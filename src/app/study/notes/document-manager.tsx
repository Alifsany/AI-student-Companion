"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Trash2, ExternalLink, Loader2, FileUp, AlertCircle, CheckCircle2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { upload } from "@vercel/blob/client";

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

type Document = {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  status: string;
  createdAt: string;
  extractionError?: string;
  summaryGeneratedAt?: string | null;
  summaryError?: string | null;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function DocumentManager({ userId }: { userId: string }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileSelection(e.target.files[0]);
    }
  };

  const processFileSelection = (file: File) => {
    setError(null);
    setSuccessMsg(null);
    setSelectedFile(file);
    
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("Please choose a valid PDF file.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError(`This PDF is larger than 20 MB (${formatBytes(file.size)}). Please choose a smaller file.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Automatically start upload once validated
    executeUpload(file);
  };

  const executeUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus("Uploading your PDF...");
    setUploadProgress(0);
    
    abortControllerRef.current = new AbortController();

    try {
      // 1. Direct upload to Vercel Blob (bypasses Vercel Serverless payload limits)
      const blobResult = await upload(file.name, file, {
        access: 'private',
        handleUploadUrl: '/api/documents/upload',
        abortSignal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.percentage) {
            setUploadProgress(progressEvent.percentage);
          } else if (progressEvent.loaded && progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        },
      });

      setUploadStatus("Saving document metadata...");

      // 2. Save metadata to our database
      const dbRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: blobResult.url,
          filename: file.name,
          size: file.size,
        }),
      });

      const dbData = await dbRes.json();

      if (!dbRes.ok) {
        throw new Error(dbData.message || dbData.error || "Failed to save document record.");
      }

      setUploadProgress(100);
      setUploadStatus("Preparing your study tools...");
      setSuccessMsg("PDF added successfully! Redirecting...");
      setDocuments(prev => [dbData.document, ...prev]);
      
      // Auto-extract logic
      handleExtract(dbData.document.id);

      // Navigate to the document workspace after a short delay
      setTimeout(() => {
        router.push(`/study/notes/${dbData.document.id}`);
      }, 1000);

    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setError("Upload canceled.");
      } else {
        console.error("Upload error:", err);
        setError(err.message || "We couldn't upload your PDF right now. Please try again.");
      }
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleExtract = async (id: string, isOcr = false) => {
    // Just trigger it in the background to start processing
    try {
      const endpoint = isOcr ? `/api/documents/${id}/extract?ocr=true` : `/api/documents/${id}/extract`;
      await fetch(endpoint, { method: "POST" });
      // We don't necessarily need to await or block the UI here since we are redirecting
    } catch (err) { 
      console.error("Background extraction failed:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete document");
      }
      
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } catch (err) {
      alert((err instanceof Error ? err.message : String(err)) || "Failed to delete document");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Upload Area */}
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all text-center ${
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        } ${isUploading ? "pointer-events-none" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="application/pdf"
          className="hidden" 
        />
        
        {isUploading && selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-primary/10 rounded-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">{uploadStatus}</p>
              <p className="text-sm text-muted-foreground mt-1 truncate max-w-[250px] mx-auto">
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            </div>
            
            <div className="w-full max-w-sm mx-auto mt-4">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
              className="mt-4 pointer-events-auto"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                Drop your PDF here
              </p>
              <p className="text-muted-foreground mt-1">
                or click to choose a file from your device
              </p>
            </div>
            <Badge variant="secondary" className="mt-4 font-normal text-muted-foreground">
              PDF only • Maximum 20 MB
            </Badge>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Upload failed</p>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {/* Document List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Your Study Library</h2>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
            <p>Loading your documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 px-4 border-2 border-dashed rounded-2xl bg-card/50 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">Your study library is empty</h3>
            <p className="max-w-sm mx-auto mb-6">
              Upload a PDF lecture, reading, or syllabus to turn it into an interactive study guide.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <FileUp className="w-4 h-4 mr-2" />
              Upload your first PDF
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <Card 
                key={doc.id} 
                className="group relative flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/study/notes/${doc.id}`)}
              >
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-2.5 bg-red-500/10 rounded-lg shrink-0">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger 
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/study/notes/${doc.id}`); }}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Workspace
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Document
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-medium line-clamp-2 mb-1" title={doc.filename}>
                    {doc.filename}
                  </h3>
                  
                  <div className="text-sm text-muted-foreground mt-auto pt-4 flex items-center justify-between">
                    <span>{formatBytes(doc.size)}</span>
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {doc.status !== 'READY' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                      <div className={`h-full ${doc.status === 'FAILED' ? 'bg-destructive' : 'bg-primary animate-pulse'}`} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
