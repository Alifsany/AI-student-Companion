"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, Sparkles, RefreshCw } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryText?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function SummaryTab({ document }: { document: DocumentData }) {
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(document.summaryText || null);
  const [error, setError] = useState(document.summaryError || null);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/summarize`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Fetch the fresh summary
        const sumRes = await fetch(`/api/documents/${document.id}/summary`);
        const sumData = await sumRes.json();
        if (sumData.summaryText) setSummary(sumData.summaryText);
      } else {
        setError(data.message || data.error || 'Failed to summarize');
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'An error occurred during summarization');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!document.extractedText) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-2">No text available to summarize.</p>
      </div>
    );
  }

  if (!summary && !isSummarizing && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Sparkles className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Generate AI Summary</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create a comprehensive, structured summary of this document including key points, important concepts, and an overview.
        </p>
        <Button onClick={generateSummary}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Summary
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full ">
      <div className="flex items-center justify-end p-2 border-b bg-muted/10">
        <span className="text-sm font-medium text-muted-foreground ml-2">Document Summary</span>
        <div className="flex gap-2">
          {summary && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={generateSummary} disabled={isSummarizing} className="h-8">
            {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {summary ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          {isSummarizing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Reading and summarizing document...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md">
              <p className="font-medium">Summary Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : summary ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
