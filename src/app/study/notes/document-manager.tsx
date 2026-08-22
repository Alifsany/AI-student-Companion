"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Trash2, ExternalLink, Loader2, FileUp, RefreshCw, Sparkles } from "lucide-react";
import { uploadPresigned } from '@vercel/blob/client';

function formatBytes(bytes: number) { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; }

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function DocumentManager({ userId }: { userId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setSuccessMsg(null);
    setUploadProgress(0);
    
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("Only PDF files are supported.");
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum allowed size is 50 MB.");
      return;
    }

    setIsUploading(true);
    setUploadStatusText("Requesting upload token...");

    try {
      setUploadStatusText("Uploading to secure storage...");

      const uniqueId = crypto.randomUUID();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim() || 'document.pdf';
      const clientPathname = `users/${userId}/${uniqueId}-${sanitizedFilename}`;

      // Upload file directly to Vercel Blob from the client using the presigned URL flow
      const blobResult = await uploadPresigned(clientPathname, file, {
        access: 'private',
        handleUploadUrl: '/api/documents/upload',
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percentage);
            setUploadStatusText(`Uploading PDF... ${percentage}%`);
          }
        }
      });

      setUploadStatusText("Saving document record...");

      // Create document record in database
      const dbRes = await fetch("/api/documents", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: blobResult.url,
          pathname: blobResult.pathname,
          filename: file.name,
          size: file.size
        }),
      });
      
      const data = await dbRes.json();
      
      if (!dbRes.ok) {
        throw new Error(data.error || "Failed to save document record");
      }
      
      setDocuments((docs) => [data, ...docs]);
      setSuccessMsg("PDF uploaded successfully.");
      
      // Auto-extract
      handleExtract(data.id);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError((err instanceof Error ? err.message : String(err)) || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadStatusText("");
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // clear success message after a few seconds
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleExtract = async (id: string, isOcr = false) => {
    if (!isOcr) {
      setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, status: "PROCESSING" } : d)));
    }
    
    try {
      const endpoint = isOcr ? `/api/documents/${id}/extract?ocr=true` : `/api/documents/${id}/extract`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, status: "READY" } : d)));
      } else if (data.error === 'NEEDS_OCR') {
        // Fallback to OCR
        setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, status: "RUNNING_OCR" } : d)));
        handleExtract(id, true);
      } else {
        setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, status: 'FAILED', extractionError: data.message || data.error || 'Extraction failed' } : d)));
      }
    } catch (err) { 
      setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, status: 'FAILED', extractionError: (err instanceof Error ? err.message : String(err)) || 'Extraction failed' } : d))); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
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
    <div className="space-y-8">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="application/pdf"
          className="hidden" 
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {isUploading ? uploadStatusText || "Uploading..." : "Click or drag and drop to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Maximum file size: 50 MB
            </p>
            {isUploading && uploadProgress > 0 && (
               <div className="w-64 max-w-full bg-muted rounded-full h-2 mt-4 mx-auto overflow-hidden">
                 <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
               </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-center">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm p-4 rounded-lg flex items-center">
          {successMsg}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center p-8 border rounded-xl bg-card text-muted-foreground">
            <FileUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <span className="font-medium truncate" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </div>
                    <Badge 
                      variant={doc.status === "READY" ? "default" : doc.status === "FAILED" ? "destructive" : "secondary"} 
                      className="text-[10px] uppercase shrink-0"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatBytes(doc.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Added:</span>
                      <span>
                        {doc.createdAt && !isNaN(new Date(doc.createdAt).getTime())
                          ? new Date(doc.createdAt).toLocaleDateString()
                          : "Date unavailable"}
                      </span>
                    </div>
                    {doc.status === 'FAILED' && doc.extractionError && (
                      <div className="mt-2 text-destructive/80 bg-destructive/10 p-2 rounded line-clamp-2" title={doc.extractionError}>
                        Error: {doc.extractionError}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(`/study/notes/${doc.id}`, '_blank')}
                        disabled={doc.status !== "READY"}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Workspace
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    
                    {doc.status !== 'READY' && (
                       <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs h-7"
                        onClick={() => handleExtract(doc.id)}
                        disabled={doc.status === 'PROCESSING' || doc.status === 'RUNNING_OCR'}
                      >
                        {doc.status === 'PROCESSING' || doc.status === 'RUNNING_OCR' ? (
                          <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Extracting Text...</>
                        ) : (
                          <><RefreshCw className="w-3 h-3 mr-2" /> Retry Extraction</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


