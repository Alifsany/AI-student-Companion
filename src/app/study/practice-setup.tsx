'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'CONCEPTUAL', label: 'Conceptual' },
  { value: 'PROBLEM_SOLVING', label: 'Problem Solving' },
  { value: 'CODING', label: 'Coding (Conceptual)' },
] as const;

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const;

export type ClientQuestion = {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  options?: string[];
  hint?: string;
};

type Props = {
  subjects: { id: string; name: string }[];
  onGenerate: (token: string, questions: ClientQuestion[]) => void;
};

export function PracticeSetup({ subjects, onGenerate }: Props) {
  const [subjectId, setSubjectId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<string>('MCQ');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [count, setCount] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/practice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subjectId || undefined,
          topic: topic.trim() || undefined,
          type,
          difficulty,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate questions.');
        return;
      }

      onGenerate(data.token, data.questions);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Practice Question Generator</CardTitle>
          </div>
          <CardDescription>
            Configure your practice set and let the AI generate personalized questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject */}
          {subjects.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={subjectId}
                onValueChange={(val) => setSubjectId(val !== null ? val : '')}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Topic */}
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic (optional)</Label>
            <Input
              id="topic"
              placeholder="e.g. Binary Trees, Photosynthesis, Calculus"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Question Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type">Question Type</Label>
            <Select
              value={type}
              onValueChange={(val) => {
                if (val) setType(val);
              }}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(val) => {
                if (val) setDifficulty(val);
              }}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question Count */}
          <div className="space-y-1.5">
            <Label htmlFor="count">Number of Questions (1–10)</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setCount(Math.min(10, Math.max(1, v)));
              }}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
