"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckSquare, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Point = {
  point: string;
  whyImportant: string;
};

export function ImportantPointsTab({ document }: { document: any }) {
  const initialResult = document.aiResults?.find((r: any) => r.type === 'IMPORTANT_POINTS');
  const [isGenerating, setIsGenerating] = useState(initialResult?.status === 'GENERATING');
  const [points, setPoints] = useState<Point[] | null>(initialResult?.status === 'READY' ? initialResult.result.points : null);
  const [error, setError] = useState<string | null>(null);

  const generatePoints = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/important-points`, { method: "POST" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setPoints(result.data.points || []);
      } else {
        setError(result.error?.message || 'We couldn\'t extract important points right now.');
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

  if (!points && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <CheckSquare className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Extract Important Points</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Get a list of concise, highly-relevant points tailored for exam preparation.
        </p>
        <Button onClick={generatePoints}>
          <CheckSquare className="w-4 h-4 mr-2" />
          Extract Points
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b bg-muted/10 shrink-0">
        <span className="text-sm font-medium text-foreground flex items-center">
          <CheckSquare className="w-4 h-4 mr-2 text-blue-500" />
          Important Points
        </span>
        {points && (
          <Button variant="outline" size="sm" onClick={generatePoints} disabled={isGenerating} className="h-8">
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
              <p className="text-muted-foreground animate-pulse text-sm">Preparing important study points...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3 my-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error.includes('limit reached') || error.includes('AI_QUOTA') ? 'AI usage limit reached' : 'Something went wrong'}</p>
                <p className="text-sm opacity-90 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generatePoints} className="mt-3 bg-background">
                  Try again
                </Button>
              </div>
            </div>
          ) : points ? (
            points.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                 <CheckSquare className="w-12 h-12 opacity-20 mb-4" />
                 <p className="font-medium">No distinct important points could be extracted.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {points.map((item, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4 md:p-5 flex gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="font-medium text-sm md:text-base leading-relaxed">{item.point}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed"><span className="font-medium text-foreground/70">Why: </span>{item.whyImportant}</p>
                      </div>
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
