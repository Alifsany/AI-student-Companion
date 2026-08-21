"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, Calculator } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function FormulasTab({ document }: { document: DocumentData }) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formulas, setFormulas] = useState<string | null>(document.formulas || null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    if (!formulas) return;
    navigator.clipboard.writeText(formulas);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateFormulas = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/formulas`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.formulas) {
        setFormulas(data.formulas);
      } else {
        setError(data.message || data.error || 'Failed to extract formulas');
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!formulas && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Calculator className="w-12 h-12 text-primary/60 mb-4" />
        <h3 className="text-lg font-medium mb-2">Formulas & Equations</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Extract any mathematical formulas, equations, or scientific notation found in the document.
        </p>
        <Button onClick={generateFormulas}>
          <Calculator className="w-4 h-4 mr-2" />
          Extract Formulas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-end p-2 border-b bg-muted/10">
        <div className="flex gap-2">
          {formulas && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={generateFormulas} disabled={isGenerating} className="h-8">
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {formulas ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-sm">Extracting formulas...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p className="font-medium text-sm">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : formulas ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{formulas}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}
