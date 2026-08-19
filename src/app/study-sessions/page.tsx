import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import Link from 'next/link';
import {  buttonVariants } from '@/components/ui/button';
import { Card, CardContent,    } from '@/components/ui/card';

import { PomodoroTimer } from '@/components/pomodoro-timer';
import { Timer, Plus, BrainCircuit, Calendar,  CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Study Sessions — AI Student Companion',
  description: 'Manage your study sessions and track your focus time.',
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function StudySessionsPage() {
  const session = await verifySession();

  // Find active session
  const activeSession = await db.studySession.findFirst({
    where: {
      userId: session.userId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
    include: {
      subject: { select: { name: true, color: true } },
      task: { select: { title: true } },
    },
  });

  // Calculate today's study time
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySessions = await db.studySession.findMany({
    where: {
      userId: session.userId,
      status: 'COMPLETED',
      endedAt: { gte: todayStart },
    },
  });
  const todaySeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0);

  // Calculate this week's study time
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekSessions = await db.studySession.findMany({
    where: {
      userId: session.userId,
      status: 'COMPLETED',
      endedAt: { gte: weekStart },
    },
  });
  const weekSeconds = weekSessions.reduce((acc, s) => acc + s.duration, 0);

  // Recent completed sessions
  const recentSessions = await db.studySession.findMany({
    where: {
      userId: session.userId,
      status: 'COMPLETED',
    },
    orderBy: { endedAt: 'desc' },
    take: 5,
    include: {
      subject: { select: { name: true, color: true } },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors mr-2 text-sm font-medium"
            >
              &larr; Dashboard
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Timer className="h-5 w-5 text-primary hidden sm:block" />
            <h1 className="font-heading font-semibold text-foreground text-lg hidden sm:block">
              Study Sessions
            </h1>
          </div>
          {!activeSession && (
            <Link
              href="/study-sessions/new"
              className={buttonVariants({ size: 'sm', className: 'gap-2' })}
            >
              <Plus className="h-4 w-4" />
              New Session
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-heading text-2xl font-bold mb-4">Current Session</h2>
              {activeSession ? (
                <PomodoroTimer session={activeSession} />
              ) : (
                <Card className="border-dashed border-2 border-border/50 bg-muted/10 shadow-none">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <BrainCircuit className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-heading text-xl font-bold text-foreground">
                      Ready to focus?
                    </h3>
                    <p className="text-muted-foreground max-w-md mt-2 mb-6">
                      Start a Pomodoro timer or custom study session to track your progress and
                      maintain focus.
                    </p>
                    <Link
                      href="/study-sessions/new"
                      className={buttonVariants({ size: 'lg', className: 'gap-2' })}
                    >
                      <Timer className="h-5 w-5" />
                      Start Studying
                    </Link>
                  </CardContent>
                </Card>
              )}
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold mb-4">Recent History</h2>
              {recentSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">No completed sessions yet.</p>
              ) : (
                <div className="space-y-4">
                  {recentSessions.map((s) => (
                    <Card
                      key={s.id}
                      className="border-border/50 shadow-sm relative overflow-hidden"
                    >
                      {s.subject?.color && (
                        <div
                          className="absolute top-0 left-0 bottom-0 w-1"
                          style={{ backgroundColor: s.subject.color }}
                        />
                      )}
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground">
                              {s.subject?.name || 'General Study'}
                            </h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {s.endedAt?.toLocaleDateString()} • {s.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg font-heading">
                            {formatDuration(s.duration)}
                          </span>
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Focused
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar / Stats */}
          <div className="space-y-6">
            <section>
              <h2 className="font-heading text-xl font-bold mb-4">Study Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/50 shadow-sm bg-primary text-primary-foreground">
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <span className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">
                      Today
                    </span>
                    <span className="text-3xl font-black font-heading">
                      {formatDuration(todaySeconds)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      This Week
                    </span>
                    <span className="text-3xl font-black font-heading text-foreground">
                      {formatDuration(weekSeconds)}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
