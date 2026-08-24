import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Trophy,
} from 'lucide-react';

export const metadata = {
  title: 'Quizzes — AI Student Companion',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export default async function QuizPage() {
  const session = await verifySession();
  if (!session.isAuth) redirect('/login');

  // IDOR protection: always scoped to session.userId
  const attempts = await db.quizAttempt.findMany({
    where: { userId: session.userId },
    orderBy: { completedAt: 'desc' },
    take: 20,
  });

  const totalAttempts = attempts.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
      : null;
  const bestScore =
    totalAttempts > 0 ? Math.round(Math.max(...attempts.map((a) => a.score))) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight font-heading">Quizzes & Exams</h1>
            <p className="text-sm text-muted-foreground">
              Generate AI-powered quizzes to test your knowledge.
            </p>
          </div>
          <Link href="/quiz/new" className={buttonVariants({ className: "flex items-center gap-2 shrink-0" })}><Plus className="h-4 w-4" />New Quiz</Link>
        </div>

        {/* Stats */}
        {totalAttempts > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">Attempts</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className={`text-2xl font-bold ${getScoreColor(avgScore ?? 0)}`}>
                {avgScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className={`text-2xl font-bold ${getScoreColor(bestScore ?? 0)}`}>
                  {bestScore}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Best Score</p>
            </div>
          </div>
        )}

        {/* Attempt list */}
        {attempts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
              <GraduationCap className="h-8 w-8 text-primary/40" />
            </div>
            <div>
              <h3 className="text-base font-semibold">No quizzes yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first AI-powered quiz to test your knowledge.
              </p>
            </div>
            <Link href="/quiz/new" className={buttonVariants({ className: "flex items-center" })}><Plus className="h-4 w-4 mr-2" />New Quiz</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Attempts</h2>
            {attempts.map((attempt) => (
              <Link key={attempt.id} href={`/quiz/results/${attempt.id}`}>
                <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors flex items-center gap-4">
                  <div
                    className={`text-2xl font-bold tabular-nums shrink-0 w-12 text-center ${getScoreColor(attempt.score)}`}
                  >
                    {Math.round(attempt.score)}%
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{attempt.title}</p>
                      <Badge
                        variant={attempt.mode === 'MOCK_EXAM' ? 'default' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {attempt.mode === 'MOCK_EXAM' ? 'Exam' : 'Quiz'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {attempt.correctCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-rose-500" />
                        {attempt.incorrectCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(attempt.timeUsedSeconds)}
                      </span>
                      <span>{attempt.completedAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
