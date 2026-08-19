'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, Loader2, Timer, ClipboardList } from 'lucide-react';

const ALL_QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'CONCEPTUAL', label: 'Conceptual' },
  { value: 'PROBLEM_SOLVING', label: 'Problem Solving' },
  { value: 'CODING', label: 'Coding (Conceptual)' },
] as const;

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const;

const TIME_LIMITS = [
  { value: '', label: 'No time limit' },
  { value: '300', label: '5 minutes' },
  { value: '600', label: '10 minutes' },
  { value: '900', label: '15 minutes' },
  { value: '1800', label: '30 minutes' },
  { value: '2700', label: '45 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '5400', label: '1.5 hours' },
  { value: '7200', label: '2 hours' },
] as const;

type Props = {
  subjects: { id: string; name: string }[];
};

// We store the active quiz state in sessionStorage so it survives navigation
// without putting sensitive data in the URL. The JWE token is passed to the
// attempt page via sessionStorage — it is the only client-side storage used,
// and it contains no plaintext answers (the JWE payload is encrypted).

export function QuizSetup({ subjects }: Props) {
  const router = useRouter();

  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [types, setTypes] = useState<string[]>(['MCQ']);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<'QUIZ' | 'MOCK_EXAM'>('QUIZ');
  const [timeLimit, setTimeLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(value: string) {
    setTypes((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((t) => t !== value)
          : prev
        : [...prev, value],
    );
  }

  async function handleStart() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: subjectId || undefined,
          topic: topic.trim() || undefined,
          types,
          difficulty,
          count,
          mode,
          timeLimitSeconds: timeLimit ? parseInt(timeLimit) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate quiz.');
        return;
      }

      // Store in sessionStorage — safe because no plaintext answers are present
      sessionStorage.setItem(
        'activeQuiz',
        JSON.stringify({
          token: data.token,
          questions: data.questions,
          title: data.title,
          mode: data.mode,
          timeLimitSeconds: data.timeLimitSeconds,
        }),
      );

      router.push('/quiz/attempt');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isMockExam = mode === 'MOCK_EXAM';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight font-heading">New Quiz</h1>
        <p className="text-sm text-muted-foreground">
          Configure your AI-generated quiz or mock exam.
        </p>
      </div>

      {/* Mode selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode('QUIZ')}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors ${
            mode === 'QUIZ'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <ClipboardList className="h-5 w-5" />
          <span>Quiz Mode</span>
          <span className="text-xs font-normal text-muted-foreground text-center">
            Practice with hints, relaxed timing
          </span>
        </button>
        <button
          onClick={() => setMode('MOCK_EXAM')}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-colors ${
            mode === 'MOCK_EXAM'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <GraduationCap className="h-5 w-5" />
          <span>Mock Exam</span>
          <span className="text-xs font-normal text-muted-foreground text-center">
            Exam conditions, timed, formal
          </span>
        </button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Quiz Configuration</CardTitle>
          <CardDescription>
            Set up your personalized {isMockExam ? 'mock exam' : 'quiz'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Subject */}
          {subjects.length > 0 && (
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={(v) => setSubjectId(v !== null ? v : '')}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects / General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects / General</SelectItem>
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
            <Label htmlFor="topic">
              Topic <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="topic"
              placeholder="e.g. Linked Lists, Photosynthesis, Derivatives"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Question Types */}
          <div className="space-y-2">
            <Label>Question Types</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_QUESTION_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                    types.includes(t.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Checkbox
                    checked={types.includes(t.value)}
                    onCheckedChange={() => toggleType(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Select at least one type.</p>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                    difficulty === d.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="space-y-1.5">
            <Label htmlFor="count">
              Number of Questions{' '}
              <Badge variant="outline" className="ml-1 text-[10px]">
                Max 30
              </Badge>
            </Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) setCount(Math.min(30, Math.max(1, v)));
              }}
            />
          </div>

          {/* Time Limit */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Time Limit
            </Label>
            <Select value={timeLimit} onValueChange={(v) => setTimeLimit(v !== null ? v : '')}>
              <SelectTrigger>
                <SelectValue placeholder="No time limit" />
              </SelectTrigger>
              <SelectContent>
                {TIME_LIMITS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isMockExam && !timeLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Mock Exam mode works best with a time limit.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={isLoading || types.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating {isMockExam ? 'exam' : 'quiz'}...
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Start {isMockExam ? 'Mock Exam' : 'Quiz'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
