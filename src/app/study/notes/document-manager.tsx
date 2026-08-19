"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Trash2, ExternalLink, Loader2, FileUp, RefreshCw,  Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Summarization loading state tracking
    
  // Dialog state
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'text' | 'summary'>('text');
  const [dialogContent, setDialogContent] = useState<string | null>(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  
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
      setError("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
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
    
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      
      setDocuments((docs) => [data, ...docs]);
      
      // Auto-extract
      handleExtract(data.id);
      
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
              {isUploading ? "Uploading..." : "Click or drag and drop to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF files only, up to 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg">
          {error}
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
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {formatBytes(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                  </div>

                  {doc.status === "FAILED" && doc.extractionError && (
                    <div className="text-[10px] text-destructive mb-2 line-clamp-2" title={doc.extractionError}>
                      {doc.extractionError}
                    </div>
                  )}

                  {doc.summaryError && (
                    <div className="text-[10px] text-destructive mb-2 line-clamp-2" title={doc.summaryError}>
                      {doc.summaryError}
                    </div>
                  )}
                  
                  <div className="mt-auto flex gap-2 pt-2 border-t flex-wrap">
                    <a 
                      href={`/api/documents/${doc.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      PDF
                    </a>

                    {doc.status === "READY" && (
                      <a 
                        href={`/study/notes/${doc.id}`}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 flex-1"
                      >
                        <Sparkles className="w-3 h-3 mr-2" />
                        Open Workspace
                      </a>
                    )}

                    {doc.status === "PROCESSING" && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 text-xs"
                        disabled
                      >
                        <Loader2 className="w-3 h-3 mr-2 animate-spin shrink-0" />
                        <span className="truncate">Extracting text...</span>
                      </Button>
                    )}

                    {doc.status === "RUNNING_OCR" && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 text-[10px]"
                        disabled
                      >
                        <Loader2 className="w-3 h-3 mr-1 animate-spin shrink-0" />
                        <span className="truncate">Scanned PDF detected. Running OCR...</span>
                      </Button>
                    )}

                    {doc.status === "FAILED" && (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground italic mr-2">Try another PDF</span>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => handleExtract(doc.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive px-2 shrink-0"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {viewMode === 'summary' ? `Summary: ${viewingDoc?.filename}` : viewingDoc?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/50 p-4 rounded-md border text-sm whitespace-pre-wrap relative font-sans leading-relaxed">
            {isDialogLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : dialogContent ? (
              viewMode === 'text' && dialogContent.length > 50000 
                ? dialogContent.slice(0, 50000) + "\n\n... [Preview Truncated due to size]" 
                : dialogContent
            ) : (
              <span className="text-muted-foreground italic">
                {viewMode === 'summary' ? 'No summary found.' : 'No text found.'}
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
