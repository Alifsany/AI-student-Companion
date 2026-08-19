"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, BookOpen } from "lucide-react";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };


export function StudyNotesTab({ document }: { document: DocumentData }) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNotes = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/study-notes`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.notes) {
        setNotes(data.notes);
      } else {
        setError(data.message || data.error || 'Failed to generate study notes');
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!document.extractedText) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-2">No text available to generate notes.</p>
      </div>
    );
  }

  if (!notes && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-card shadow-sm p-6">
        <BookOpen className="w-12 h-12 text-purple-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Generate Study Notes</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Extract beautifully formatted academic notes with key concepts, definitions, and important points.
        </p>
        <Button onClick={generateNotes}>
          <BookOpen className="w-4 h-4 mr-2" />
          Generate Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground ml-2">Study Notes</span>
        <div className="flex gap-2">
          {notes && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={generateNotes} disabled={isGenerating} className="h-8">
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {notes ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Analyzing and formatting notes...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : notes ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              {notes}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
