"use client";


import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { ChevronLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import { AiToolsPanel } from "./ai-tools-panel";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function WorkspaceClient({ document }: { document: DocumentData }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/study/notes">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{document.filename}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {document.fileType || "PDF Document"}
              </span>
              <span>•</span>
              <span>{formatBytes(document.size)}</span>
              <span>•</span>
              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium">
                {document.status}
              </span>
            </div>
          </div>
        </div>
        <a href={`/api/documents/${document.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Original PDF
          </Button>
        </a>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-6">
        {/* Left: Document Content */}
        <div className="flex-1 lg:max-w-[65%] h-[50vh] lg:h-auto min-h-[400px] min-w-0 bg-card border rounded-lg overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 border-b bg-muted/30 shrink-0">
            <span className="text-sm font-medium text-muted-foreground ml-2">Extracted Text Viewer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-3xl mx-auto prose prose-sm md:prose-base dark:prose-invert">
              <div className="whitespace-pre-wrap leading-relaxed font-serif">
                {document.extractedText}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Tools Panel */}
        <div className="w-full lg:w-[35%] shrink-0 min-w-[320px] h-[60vh] lg:h-auto min-h-[500px] bg-card border rounded-lg overflow-hidden shadow-sm flex flex-col">
          <AiToolsPanel document={document} />
        </div>
      </div>
    </div>
  );
}