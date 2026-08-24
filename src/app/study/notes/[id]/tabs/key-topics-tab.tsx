"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, List, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Topic = {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
};

export function KeyTopicsTab({ document }: { document: any }) {
  const initialResult = document.aiResults?.find((r: any) => r.type === 'KEY_TOPICS');
  const [isGenerating, setIsGenerating] = useState(initialResult?.status === 'GENERATING');
  const [topics, setTopics] = useState<Topic[] | null>(initialResult?.status === 'READY' ? initialResult.result.topics : null);
  const [error, setError] = useState<string | null>(null);

  const generateTopics = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/key-topics`, { method: "POST" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setTopics(result.data.topics || []);
      } else {
        setError(result.error?.message || 'We couldn\'t extract topics right now.');
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

  if (!topics && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <List className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Identify Key Topics</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Automatically extract the most important topics discussed in this document.
        </p>
        <Button onClick={generateTopics}>
          <List className="w-4 h-4 mr-2" />
          Find Key Topics
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b bg-muted/10 shrink-0">
        <span className="text-sm font-medium text-foreground flex items-center">
          <List className="w-4 h-4 mr-2 text-blue-500" />
          Key Topics
        </span>
        {topics && (
          <Button variant="outline" size="sm" onClick={generateTopics} disabled={isGenerating} className="h-8">
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
              <p className="text-muted-foreground animate-pulse text-sm">Identifying key topics...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3 my-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error.includes('limit reached') || error.includes('AI_QUOTA') ? 'AI usage limit reached' : 'Something went wrong'}</p>
                <p className="text-sm opacity-90 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generateTopics} className="mt-3 bg-background">
                  Try again
                </Button>
              </div>
            </div>
          ) : topics ? (
            topics.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                 <List className="w-12 h-12 opacity-20 mb-4" />
                 <p className="font-medium">No key topics could be extracted.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {topics.map((item, i) => (
                  <Card key={i} className="overflow-hidden border-l-4" style={{ 
                    borderLeftColor: item.importance === 'high' ? 'hsl(var(--destructive))' : 
                                     item.importance === 'medium' ? 'hsl(var(--warning, 45 93% 47%))' : 
                                     'hsl(var(--primary))' 
                  }}>
                    <CardContent className="p-4 md:p-5 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-base">{item.title}</h3>
                        <Badge variant={item.importance === 'high' ? 'destructive' : item.importance === 'medium' ? 'secondary' : 'outline'} className="shrink-0 capitalize">
                          {item.importance} Priority
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
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
