'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Timer,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export type ClientQuestion = {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  options?: string[];
  hint?: string;
};

type QuizData = {
  token: string;
  questions: ClientQuestion[];
  title: string;
  mode: 'QUIZ' | 'MOCK_EXAM';
  timeLimitSeconds: number | null;
};

type Props = {
  quizData: QuizData;
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function QuizSession({ quizData }: Props) {
  const router = useRouter();
  const { token, questions, title, mode, timeLimitSeconds } = quizData;
  const isMockExam = mode === 'MOCK_EXAM';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [showNavigator, setShowNavigator] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(timeLimitSeconds);
  const [showHint, setShowHint] = useState(false);

  const autoSubmitRef = useRef(false);

  const total = questions.length;
  const current = questions[currentIndex];





const submitQuiz = useCallback(
      async (autoSubmit = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        setShowConfirmSubmit(false);
  
        try {
          const res = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              answers,
              markedForReview: Array.from(markedForReview),
            }),
          });
  
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || 'Submission failed. Please try again.');
            setIsSubmitting(false);
            return;
          }
  
          // Clear session storage after submission
          sessionStorage.removeItem('activeQuiz');
  
          router.push(`/quiz/results/${data.attemptId}`);
        } catch {
          setError('Network error. Please try again.');
          setIsSubmitting(false);
          if (autoSubmit) autoSubmitRef.current = false;
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [token, answers, markedForReview, isSubmitting, router],
    );

  // Timer countdown (display only — server is authoritative)
  useEffect(() => {
    if (!timeLimitSeconds) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            submitQuiz(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimitSeconds]);


  function setCurrentAnswer(val: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  }

  function toggleMark(id: string) {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getQuestionStatus(q: ClientQuestion): 'answered' | 'marked' | 'skipped' {
    if (markedForReview.has(q.id)) return 'marked';
    if (answers[q.id]) return 'answered';
    return 'skipped';
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const isTimeLow = timeLeft !== null && timeLeft < 60;

  const isMCQ = current.type === 'MCQ';
  const isTF = current.type === 'TRUE_FALSE';
  const isObjective = isMCQ || isTF;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate max-w-[180px] sm:max-w-xs">{title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {total}
              </span>
              <Badge variant={isMockExam ? 'default' : 'secondary'} className="text-[10px] py-0">
                {isMockExam ? 'Mock Exam' : 'Quiz'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-mono font-medium tabular-nums ${
                isTimeLow
                  ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                  : 'border-border bg-background'
              }`}
            >
              <Timer className={`h-3.5 w-3.5 ${isTimeLow ? 'animate-pulse' : ''}`} />
              {formatTime(timeLeft)}
            </div>
          )}

          {/* Navigator toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNavigator((v) => !v)}
            className="text-xs hidden sm:flex"
          >
            {answeredCount}/{total} answered
          </Button>

          {/* Submit */}
          <Button
            size="sm"
            onClick={() => setShowConfirmSubmit(true)}
            disabled={isSubmitting}
            className="text-xs"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-1 bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main question area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-5">
            {/* Question header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Q{currentIndex + 1}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {current.type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {current.difficulty}
                </Badge>
              </div>
              <button
                onClick={() => toggleMark(current.id)}
                className={`flex items-center gap-1.5 text-xs rounded-lg border px-2.5 py-1 transition-colors ${
                  markedForReview.has(current.id)
                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Flag className="h-3 w-3" />
                {markedForReview.has(current.id) ? 'Marked' : 'Mark for review'}
              </button>
            </div>

            {/* Question text */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                {current.text}
              </p>
            </div>

            {/* Options / input */}
            {isObjective && current.options ? (
              <div className="space-y-2">
                {current.options.map((opt) => {
                  const selected = answers[current.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setCurrentAnswer(opt)}
                      className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border bg-background hover:border-primary/40'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                placeholder={
                  current.type === 'CODING'
                    ? 'Describe your solution or write pseudocode...'
                    : 'Type your answer here...'
                }
                value={answers[current.id] ?? ''}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="min-h-[120px] resize-y"
              />
            )}

            {/* Hint — quiz mode only, not mock exam */}
            {!isMockExam && current.hint && (
              <div>
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Show hint
                  </button>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    {current.hint}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowHint(false);
                  setCurrentIndex((i) => Math.max(0, i - 1));
                }}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <button
                className="sm:hidden text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1"
                onClick={() => setShowNavigator((v) => !v)}
              >
                {answeredCount}/{total}
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowHint(false);
                  setCurrentIndex((i) => Math.min(total - 1, i + 1));
                }}
                disabled={currentIndex === total - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question navigator sidebar */}
        {showNavigator && (
          <div className="hidden sm:flex flex-col w-52 border-l border-border bg-card p-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Questions
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowHint(false);
                    }}
                    className={`aspect-square rounded text-xs font-medium transition-colors ${
                      idx === currentIndex
                        ? 'bg-primary text-primary-foreground'
                        : status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : status === 'marked'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-900/30 inline-block" />
                Answered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-900/30 inline-block" />
                Marked
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-muted inline-block" />
                Unanswered
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit confirmation dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">Submit {isMockExam ? 'Exam' : 'Quiz'}?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  You have answered {answeredCount} of {total} questions.
                  {total - answeredCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {' '}
                      {total - answeredCount} unanswered.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
              >
                Continue {isMockExam ? 'exam' : 'quiz'}
              </Button>
              <Button size="sm" onClick={() => submitQuiz(false)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}