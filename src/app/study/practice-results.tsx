'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';

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
  results: EvalResult[];
  summary: Summary;
  onPracticeAgain: () => void;
  onBackToChat: () => void;
};

function getPerformanceLabel(accuracy: number): string {
  if (accuracy >= 90) return 'Excellent!';
  if (accuracy >= 75) return 'Great work!';
  if (accuracy >= 60) return 'Good effort!';
  if (accuracy >= 40) return 'Keep practicing!';
  return 'Room to improve — keep going!';
}

function getPerformanceColor(accuracy: number): string {
  if (accuracy >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (accuracy >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function PracticeResults({ results, summary, onPracticeAgain, onBackToChat }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-6 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Score Card */}
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
          Practice Complete
        </p>
        <div className={`text-5xl font-bold tabular-nums ${getPerformanceColor(summary.accuracy)}`}>
          {summary.accuracy}%
        </div>
        <p className={`text-sm font-medium ${getPerformanceColor(summary.accuracy)}`}>
          {getPerformanceLabel(summary.accuracy)}
        </p>
        <div className="flex items-center justify-center gap-6 pt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {summary.correct} correct
          </span>
          <span className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-rose-500" />
            {summary.incorrect} incorrect
          </span>
          <span>{summary.total} total</span>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Question Review</h3>
        {results.map((result, index) => {
          const isExpanded = expandedId === result.id;
          return (
            <div
              key={result.id}
              className={`rounded-xl border transition-colors ${
                result.isCorrect
                  ? 'border-emerald-200 dark:border-emerald-900'
                  : 'border-rose-200 dark:border-rose-900'
              } bg-card overflow-hidden`}
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left gap-3"
                onClick={() => setExpandedId(isExpanded ? null : result.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">Q{index + 1}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {result.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">Your answer</p>
                    <p className="text-foreground">{result.studentAnswer || '(no answer)'}</p>
                  </div>
                  {!result.isCorrect && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-3 py-2">
                      <p className="font-medium text-xs text-emerald-700 dark:text-emerald-400 mb-0.5">
                        Correct answer
                      </p>
                      <p className="text-emerald-700 dark:text-emerald-300">
                        {result.correctAnswer}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-xs text-muted-foreground mb-1">Feedback</p>
                    <p className="text-foreground">{result.feedback}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="font-medium text-xs text-muted-foreground mb-0.5">Explanation</p>
                    <p className="text-foreground text-xs leading-relaxed">{result.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pb-2">
        <Button
          onClick={onPracticeAgain}
          variant="default"
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Practice Again
        </Button>
        <Button
          onClick={onBackToChat}
          variant="outline"
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Back to AI Tutor
        </Button>
      </div>
    </div>
  );
}
