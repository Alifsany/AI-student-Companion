"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function TextViewerTab({ document }: { document: DocumentData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!document.extractedText) return;
    navigator.clipboard.writeText(document.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!document.extractedText) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-2">This document doesn't have readable text yet.</p>
        <p className="text-sm text-muted-foreground">Try extracting the text from the Notes overview.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground ml-2">Extracted Text</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
          {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy Text"}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
          {document.extractedText}
        </div>
      </div>
    </div>
  );
}
