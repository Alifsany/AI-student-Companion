'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, Lightbulb } from 'lucide-react';
import type { ClientQuestion } from './practice-setup';

type EvalResult = {
  id: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  feedback: string;
  type: string;
};

type Summary = {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
};

type Props = {
  token: string;
  questions: ClientQuestion[];
  onFinish: (results: EvalResult[], summary: Summary) => void;
  onBack: () => void;
};

export function PracticeSession({ token, questions, onFinish, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // answers keyed by question id
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLast = currentIndex === totalQuestions - 1;
  const currentAnswer = answers[current?.id ?? ''] ?? '';

  function setCurrentAnswer(val: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  }

  function handleNext() {
    setShowHint(false);
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
    }
  }

  async function handleSubmitAll() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/practice/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to evaluate answers.');
        return;
      }
      onFinish(data.results, data.summary);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!current) return null;

  const isMCQ = current.type === 'MCQ';
  const isTF = current.type === 'TRUE_FALSE';
  const isObjective = isMCQ || isTF;

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-4 max-w-2xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground font-medium">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {current.difficulty}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {current.type.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium leading-relaxed text-foreground">{current.text}</p>
        </div>

        {/* MCQ Options */}
        {isObjective && current.options && (
          <div className="space-y-2">
            {current.options.map((option) => {
              const selected = currentAnswer === option;
              return (
                <button
                  key={option}
                  onClick={() => setCurrentAnswer(option)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Text Answer */}
        {!isObjective && (
          <Textarea
            placeholder={
              current.type === 'CODING'
                ? 'Describe your solution or write pseudocode...'
                : 'Type your answer here...'
            }
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            className="min-h-[120px] resize-y"
          />
        )}

        {/* Hint */}
        {current.hint && (
          <div>
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Show hint
              </button>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 px-4 py-2.5 flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">{current.hint}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Setup
        </Button>
        {!isLast ? (
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="flex items-center gap-1.5"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmitAll}
            disabled={isSubmitting || !currentAnswer}
            className="flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              'Submit All Answers'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
