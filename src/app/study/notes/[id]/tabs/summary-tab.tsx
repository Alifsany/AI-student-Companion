"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";

type SummaryData = {
  title: string;
  overview: string;
  mainPoints: string[];
  conclusion: string;
};

export function SummaryTab({ document }: { document: any }) {
  const initialResult = document.aiResults?.find((r: any) => r.type === 'SUMMARY');
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(initialResult?.status === 'GENERATING');
  const [summary, setSummary] = useState<SummaryData | null>(initialResult?.status === 'READY' ? initialResult.result : null);
  const [error, setError] = useState<string | null>(null);

  

  const handleCopy = () => {
    if (!summary) return;
    const text = `# ${summary.title}\n\n## Overview\n${summary.overview}\n\n## Main Points\n${summary.mainPoints.map(p => `- ${p}`).join('\n')}\n\n## Conclusion\n${summary.conclusion}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSummary = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/summarize`, { method: "POST" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setSummary(result.data);
      } else {
        setError(result.error?.message || 'We couldn\'t generate your summary right now.');
      }
    } catch (err) {
      setError('Something went wrong while connecting to the server. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!document.extractedText || document.status !== 'READY') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
        <p>Your PDF is still being prepared. Please wait...</p>
      </div>
    );
  }

  if (!summary && !isSummarizing && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Sparkles className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Generate AI Summary</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Get a concise overview of this document, including the main points and conclusion.
        </p>
        <Button onClick={generateSummary}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Summary
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b bg-muted/10 shrink-0">
        <span className="text-sm font-medium text-foreground flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
          Document Summary
        </span>
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
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <div className="max-w-2xl mx-auto pb-8">
          {isSummarizing ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse text-sm">Analyzing your document...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3 my-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error.includes('limit reached') || error.includes('AI_QUOTA') ? 'AI usage limit reached' : 'Something went wrong'}</p>
                <p className="text-sm opacity-90 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generateSummary} className="mt-3 bg-background">
                  Try again
                </Button>
              </div>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{summary.title}</h2>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overview</h3>
                <p className="text-sm md:text-base leading-relaxed">{summary.overview}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Main Points</h3>
                <ul className="space-y-2 text-sm md:text-base leading-relaxed">
                  {summary.mainPoints.map((point, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-3 text-primary mt-1.5 shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conclusion</h3>
                <p className="text-sm md:text-base leading-relaxed">{summary.conclusion}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
