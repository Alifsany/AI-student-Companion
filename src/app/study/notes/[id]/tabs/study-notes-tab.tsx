"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Note = {
  title: string;
  content: string;
};

export function StudyNotesTab({ document }: { document: any }) {
  const initialResult = document.aiResults?.find((r: any) => r.type === 'STUDY_NOTES');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(initialResult?.status === 'GENERATING');
  const [notes, setNotes] = useState<Note[] | null>(initialResult?.status === 'READY' ? initialResult.result.studyNotes : null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    if (!notes) return;
    const text = notes.map(n => `## ${n.title}\n${n.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNotes = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/study-notes`, { method: "POST" });
      const result = await res.json();
      
      if (res.ok && result.success) {
        setNotes(result.data.studyNotes || []);
      } else {
        setError(result.error?.message || 'We couldn\'t generate study notes right now.');
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

  if (!notes && !isGenerating && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <BookOpen className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
        <h3 className="text-lg font-medium mb-2">Generate Study Notes</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
          Extract beautifully formatted academic notes with key concepts and definitions.
        </p>
        <Button onClick={generateNotes}>
          <BookOpen className="w-4 h-4 mr-2" />
          Generate Notes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b bg-muted/10 shrink-0">
        <span className="text-sm font-medium text-foreground flex items-center">
          <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
          Study Notes
        </span>
        <div className="flex gap-2">
          {notes && (
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={generateNotes} disabled={isGenerating} className="h-8">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {notes ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-muted/5">
        <div className="max-w-3xl mx-auto pb-8">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse text-sm">Analyzing and formatting notes...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start gap-3 my-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error.includes('limit reached') || error.includes('AI_QUOTA') ? 'AI usage limit reached' : 'Something went wrong'}</p>
                <p className="text-sm opacity-90 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={generateNotes} className="mt-3 bg-background">
                  Try again
                </Button>
              </div>
            </div>
          ) : notes ? (
            <div className="space-y-6">
              {notes.map((n, i) => (
                <Card key={i}>
                  <CardHeader className="bg-muted/20 border-b py-3">
                    <CardTitle className="text-base">{n.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
