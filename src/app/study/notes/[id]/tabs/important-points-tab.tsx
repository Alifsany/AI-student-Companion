"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckSquare, Copy, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function ImportantPointsTab({ document }: { document: DocumentData }) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [points, setPoints] = useState<string | null>(document.importantPoints || null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    if (!points) return;
    navigator.clipboard.writeText(points);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePoints = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/important-points`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.importantPoints) {
        setPoints(data.importantPoints);
      } else {
        setError(data.message || data.error || 'Failed to extract points');
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!points && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <CheckSquare className="w-12 h-12 text-primary/60 mb-4" />
        <h3 className="text-lg font-medium mb-2">Important Points</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Extract 5-15 concise important points highly relevant for exam preparation.
        </p>
        <Button onClick={generatePoints}>
          <CheckSquare className="w-4 h-4 mr-2" />
          Generate Points
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end p-2 border-b bg-muted/10">
        <div className="flex gap-2">
          {points && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={generatePoints} disabled={isGenerating} className="h-8">
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {points ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-sm">Extracting important points...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p className="font-medium text-sm">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : points ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{points}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}
