"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BrainCircuit, Play } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

type DocumentData = { id: string; title?: string; extractedText?: string | null; summary?: string | null; summaryError?: string | null; extractedData?: { keyTopics?: { title: string, explanation: string }[]; importantPoints?: string[]; formulas?: { formula: string, explanation: string }[]; studyNotes?: { title: string, content: string }[]; quiz?: Record<string, unknown>; }; createdAt?: Date | string; updatedAt?: Date | string; [key: string]: any };

export function QuizTab({ document }: { document: DocumentData }) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");

  const generateQuiz = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Document: ${document.filename}`,
          difficulty: difficulty.toUpperCase(),
          count: parseInt(numQuestions),
          types: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'],
          documentId: document.id
        })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        sessionStorage.setItem(
          'activeQuiz',
          JSON.stringify({
            token: data.token,
            questions: data.questions,
            title: data.title,
            mode: data.mode,
            timeLimitSeconds: data.timeLimitSeconds,
          })
        );
        router.push('/quiz/attempt');
      } else {
        console.error('Quiz generation failed:', data);
        setError(data.message || data.error || 'Failed to generate quiz');
        setIsGenerating(false);
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'An error occurred');
      setIsGenerating(false);
    }
  };

  if (!document.extractedText) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <p className="text-muted-foreground mb-2">No text available to generate a quiz.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full ">
      <div className="flex items-center justify-end p-2 border-b bg-muted/10">
        <span className="text-sm font-medium text-muted-foreground ml-2">Practice Quiz</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Generating custom quiz from document...</p>
          </div>
        ) : (
          <div className="max-w-md w-full space-y-6">
            <div className="text-center mb-8">
              <BrainCircuit className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-80" />
              <h3 className="text-lg font-medium mb-2">Generate Quiz</h3>
              <p className="text-sm text-muted-foreground">
                Test your knowledge by generating a custom multiple-choice quiz based ONLY on the content of this document.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Select value={numQuestions} onValueChange={(val) => setNumQuestions(val || "5")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(val) => setDifficulty(val || "medium")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generateQuiz} className="w-full mt-4" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Quiz
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
