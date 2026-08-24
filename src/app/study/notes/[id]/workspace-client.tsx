"use client";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { ChevronLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import { AiToolsPanel } from "./ai-tools-panel";

type DocumentData = { 
  id: string; 
  filename: string;
  fileUrl?: string;
  fileType?: string;
  size: number;
  status: string;
  extractedText?: string | null; 
  summary?: string | null; 
  summaryError?: string | null; 
  createdAt?: Date | string; 
  updatedAt?: Date | string; 
  [key: string]: any 
};

export function WorkspaceClient({ document }: { document: DocumentData }) {
  // Use our secure API endpoint for fetching the PDF
  const pdfUrl = `/api/documents/${document.id}`;

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Premium Header */}
      <div className="flex items-center justify-between p-4 md:px-6 md:py-4 border-b bg-card/50 backdrop-blur-sm shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-[70%]">
          <Link href="/study/notes">
            <Button variant="ghost" size="icon" className="hover:bg-muted shrink-0 rounded-full h-9 w-9">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold truncate tracking-tight text-foreground">
              {document.filename}
            </h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                {document.fileType === "application/pdf" ? "PDF Document" : "Document"}
              </span>
              <span className="opacity-50">•</span>
              <span className="shrink-0">{formatBytes(document.size)}</span>
              <span className="opacity-50 hidden sm:inline">•</span>
              <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
                document.status === 'READY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                document.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {document.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="hidden sm:flex h-9 rounded-full px-4">
              <Download className="w-4 h-4 mr-2 text-muted-foreground" />
              Download PDF
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden h-9 w-9 rounded-full">
              <Download className="w-4 h-4 text-muted-foreground" />
            </Button>
          </a>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left: Document/PDF Viewer */}
        <div className="flex-none h-[45vh] lg:h-auto lg:flex-1 lg:max-w-[60%] xl:max-w-[65%] border-b lg:border-b-0 lg:border-r bg-muted/20 relative flex flex-col shrink-0">
          {document.status === 'READY' ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-0 bg-transparent flex-1"
              title={document.filename}
            />
          ) : document.status === 'FAILED' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <FileText className="w-16 h-16 opacity-20 mb-4" />
              <p className="font-medium text-destructive mb-2">Failed to process this document.</p>
              <p className="text-sm max-w-sm">We couldn't extract the text from this PDF. AI features will be limited.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="font-medium animate-pulse">Processing document...</p>
              <p className="text-sm opacity-70 mt-2">Extracting text and preparing AI tools</p>
            </div>
          )}
        </div>

        {/* Right: AI Tools Panel */}
        <div className="flex-1 lg:w-[40%] xl:w-[35%] shrink-0 min-h-[500px] lg:min-h-0 bg-background flex flex-col relative z-0">
          <AiToolsPanel document={document} />
        </div>
        
      </div>
    </div>
  );
}