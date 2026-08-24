"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Calculator, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Formula = {
  name: string;
  formula: string;
  variables?: { symbol: string; meaning: string }[];
  usage?: string;
};

export function FormulasTab({ document }: { document: any }) {
  const initialResult = document.aiResults?.find((r: any) => r.type === 'FORMULAS');
  const [isGenerating, setIsGenerating] = useState(initialResult?.status === 'GENERATING');
  const [formulas, setFormulas] = useState<Formula[] | null>(initialResult?.status === 'READY' ? initialResult.result.formulas : null);
  const [error, setError] = useState<string | null>(null);

  const generateFormulas = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/formulas`, { method: "POST" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setFormulas(result.data.formulas || []);
      } else {
        setError(result.error?.message || 'We couldn\'t extract formulas right now.');
      }
    } catch (err) {
      setError('Something went wrong while connecting to the server. Please try again.');
    } finally {
      setIsGenerating(false);
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

  if (!formulas && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Calculator className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Extract Formulas</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Automatically find and explain mathematical and scientific formulas in this document.
        </p>
        <Button onClick={generateFormulas}>
          <Calculator className="w-4 h-4 mr-2" />
          Find Formulas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b bg-muted/10 shrink-0">
        <span className="text-sm font-medium text-foreground flex items-center">
          <Calculator className="w-4 h-4 mr-2 text-blue-500" />
          Formulas
        </span>
        {formulas && (
          <Button variant="outline" size="sm" onClick={generateFormulas} disabled={isGenerating} className="h-8">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Regenerate
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-muted/5">
        <div className="max-w-3xl mx-auto pb-8">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse text-sm">Finding important formulas...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3 my-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error.includes('limit reached') || error.includes('AI_QUOTA') ? 'AI usage limit reached' : 'Something went wrong'}</p>
                <p className="text-sm opacity-90 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generateFormulas} className="mt-3 bg-background">
                  Try again
                </Button>
              </div>
            </div>
          ) : formulas ? (
            formulas.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                 <Calculator className="w-12 h-12 opacity-20 mb-4" />
                 <p className="font-medium">No important formulas were found in this document.</p>
               </div>
            ) : (
              <div className="space-y-6">
                {formulas.map((item, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 p-4 border-b">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-6">
                      <div className="bg-background border rounded-lg p-4 text-center overflow-x-auto">
                        <code className="text-lg md:text-xl font-mono whitespace-nowrap text-primary">
                          {item.formula}
                        </code>
                      </div>
                      
                      {item.variables && item.variables.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Variables</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {item.variables.map((v, vi) => (
                              <div key={vi} className="flex items-baseline gap-2 bg-muted/30 p-2 rounded-md">
                                <span className="font-mono font-medium text-foreground">{v.symbol}</span>
                                <span className="text-muted-foreground">—</span>
                                <span>{v.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.usage && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Usage</h4>
                          <p className="text-sm leading-relaxed">{item.usage}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
