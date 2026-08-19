import { notFound, redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Minus,
  Clock,
  Target,
  TrendingUp,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Quiz Results #${id.slice(0, 8)} — AI Student Companion` };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function getPerformanceLabel(score: number): string {
  if (score >= 90) return 'Outstanding!';
  if (score >= 80) return 'Excellent!';
  if (score >= 70) return 'Good work!';
  if (score >= 60) return 'Satisfactory';
  if (score >= 40) return 'Needs improvement';
  return 'Keep practicing!';
}

export default async function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifySession();
  if (!session.isAuth) redirect('/login');

  // IDOR protection: always scope by userId
  const attempt = await db.quizAttempt.findFirst({
    where: { id, userId: session.userId },
    include: {
      questionResults: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!attempt) notFound();

  const hasTimeLimit = attempt.timeLimitSeconds !== null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        {/* Back link */}
        <Link
          href="/quiz"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Quiz History
        </Link>

        {/* Score card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant={attempt.mode === 'MOCK_EXAM' ? 'default' : 'secondary'}>
              {attempt.mode === 'MOCK_EXAM' ? 'Mock Exam' : 'Quiz'}
            </Badge>
            {attempt.subjectName && <Badge variant="outline">{attempt.subjectName}</Badge>}
          </div>
          <h1 className="text-base font-semibold text-foreground truncate">{attempt.title}</h1>
          <div className={`text-6xl font-bold tabular-nums ${getScoreColor(attempt.score)}`}>
            {Math.round(attempt.score)}%
          </div>
          <p className={`text-sm font-medium ${getScoreColor(attempt.score)}`}>
            {getPerformanceLabel(attempt.score)}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-lg font-bold">{attempt.correctCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-lg font-bold">{attempt.incorrectCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Minus className="h-4 w-4" />
                <span className="text-lg font-bold">{attempt.skippedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              {hasTimeLimit ? (
                <>
                  <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-bold">{formatTime(attempt.timeUsedSeconds)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {formatTime(attempt.timeLimitSeconds!)}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-bold">{formatTime(attempt.timeUsedSeconds)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Time used</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Weak areas */}
        {attempt.questionResults.filter((r) => !r.isCorrect).length > 0 && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Areas to Review
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                Array.from(
                  new Set<string>(
                    attempt.questionResults
                      .filter((r) => !r.isCorrect)
                      .map((r) => r.questionType.replace('_', ' ')),
                  ),
                ) as string[]
              ).map((type: string) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommended action */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            <span>
              {attempt.score >= 80
                ? 'Great result! Try a harder difficulty next time.'
                : attempt.score >= 60
                  ? 'Review the incorrect answers and try again.'
                  : 'Focus on the weak areas above and use the AI Tutor for help.'}
            </span>
          </div>
          <Link
            href="/quiz/new"
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Quiz
          </Link>
        </div>

        {/* Question review */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Question Review</h2>
          {attempt.questionResults.map((result, index) => (
            <QuestionReviewCard key={result.id} result={result} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Client-rendered accordion-style card (can use details/summary without JS)
function QuestionReviewCard({
  result,
  index,
}: {
  result: {
    id: string;
    questionText: string;
    questionType: string;
    questionDifficulty: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    feedback: string;
    explanation: string;
    markedForReview: boolean;
  };
  index: number;
}) {
  return (
    <details
      className={`rounded-xl border overflow-hidden group ${
        result.isCorrect
          ? 'border-emerald-200 dark:border-emerald-900'
          : 'border-rose-200 dark:border-rose-900'
      }`}
    >
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none bg-card hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          {result.isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
          )}
          <span className="text-xs text-muted-foreground shrink-0">Q{index + 1}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {result.questionType.replace('_', ' ')}
          </Badge>
          {result.markedForReview && (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-300 text-amber-600 shrink-0"
            >
              Marked
            </Badge>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-open:rotate-180 transition-transform" />
      </summary>

      <div className="border-t border-border px-4 py-4 space-y-3 text-sm bg-card">
        <p className="font-medium text-foreground leading-relaxed">{result.questionText}</p>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Your answer</p>
            <p className="text-foreground">{result.studentAnswer || '(no answer)'}</p>
          </div>

          {!result.isCorrect && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-3 py-2">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">
                Correct answer
              </p>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                {result.correctAnswer}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
            <p className="text-foreground">{result.feedback}</p>
          </div>

          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Explanation</p>
            <p className="text-foreground text-xs leading-relaxed">{result.explanation}</p>
          </div>
        </div>
      </div>
    </details>
  );
}
