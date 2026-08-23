"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, Calculator, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type FormulaVariable = {
  symbol: string;
  meaning: string;
  unit?: string;
};

type FormulaItem = {
  formula: string;
  name: string;
  explanation: string;
  variables: FormulaVariable[];
  example?: string;
};

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: any; createdAt?: Date | string; updatedAt?: Date | string; formulas?: any; [key: string]: any };

export function FormulasTab({ document }: { document: DocumentData }) {
  const [copied, setCopied] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formulas, setFormulas] = useState<FormulaItem[] | null>(() => {
    if (document.formulas) {
      if (Array.isArray(document.formulas)) return document.formulas;
      if (document.formulas.formulas && Array.isArray(document.formulas.formulas)) return document.formulas.formulas;
    }
    return null;
  });
  
  const [error, setError] = useState<string | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateFormulas = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/formulas`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.formulas) {
        if (Array.isArray(data.formulas)) {
           setFormulas(data.formulas);
        } else if (data.formulas.formulas) {
           setFormulas(data.formulas.formulas);
        }
      } else {
        setError(data.error || data.message || 'Failed to extract formulas');
      }
    } catch (err) {
      setError("Unable to generate formulas right now. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!formulas && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Calculator className="w-12 h-12 text-primary/60 mb-4" />
        <h3 className="text-lg font-medium mb-2">Generate formulas from this document</h3>
        <p className="text-muted-foreground mb-6 text-sm max-w-sm">
          Extract any mathematical formulas, equations, or scientific notation found in the document.
        </p>
        <Button onClick={generateFormulas} disabled={isGenerating}>
          <Calculator className="w-4 h-4 mr-2" />
          Extract Formulas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-end p-2 border-b bg-background shrink-0">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateFormulas} disabled={isGenerating} className="h-8">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {formulas ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-sm">Extracting formulas...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex flex-col items-center text-center py-8">
            <AlertCircle className="w-10 h-10 mb-4 opacity-80" />
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1 max-w-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={generateFormulas} className="mt-4 border-destructive/20 hover:bg-destructive/20">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : formulas && formulas.length > 0 ? (
          <div className="space-y-6">
            {formulas.map((item, i) => (
              <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base text-primary">{item.name}</CardTitle>
                      <CardDescription className="mt-1.5 text-sm">{item.explanation}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(item.formula, i)} className="shrink-0 h-8 w-8" title="Copy Formula">
                      {copied === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 bg-background flex items-center justify-center border-y border-border/30">
                     <code className="text-lg font-serif font-semibold text-foreground px-4 py-2 bg-muted/30 rounded-md whitespace-pre-wrap text-center max-w-full overflow-x-auto">
                        {item.formula}
                     </code>
                  </div>
                  {item.variables && item.variables.length > 0 && (
                    <div className="px-5 py-4 border-b border-border/30">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Variables</h4>
                      <ul className="space-y-2">
                        {item.variables.map((v, idx) => (
                          <li key={idx} className="text-sm flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="font-mono font-medium bg-muted px-1.5 py-0.5 rounded text-xs">{v.symbol}</span>
                            <span className="text-foreground/90">{v.meaning}</span>
                            {v.unit && <span className="text-muted-foreground text-xs">({v.unit})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.example && (
                    <div className="px-5 py-4 bg-muted/10">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Example</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">{item.example}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <Calculator className="w-10 h-10 mb-3 opacity-20" />
            <p>No formulas found in this document.</p>
          </div>
        )}
      </div>
    </div>
  );
}
