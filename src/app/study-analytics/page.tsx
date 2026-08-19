import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import { getStudyStats, calculateStreak } from '@/lib/analytics';
import db from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {  buttonVariants } from '@/components/ui/button';

import {
  BarChart3,
  
  Clock,
  Flame,
  
  Timer,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Study Analytics — AI Student Companion',
  description: 'Track your study progress and analytics.',
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default async function StudyAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const resolvedSearchParams = await searchParams;
  const periodStr =
    typeof resolvedSearchParams.period === 'string' ? resolvedSearchParams.period : '7';
  const days = ['7', '30', '90'].includes(periodStr) ? parseInt(periodStr, 10) : 7;

  const stats = await getStudyStats(session.userId, days);
  const streakInfo = await calculateStreak(session.userId);

  // Fetch recent completed sessions separately for the "Recent Activity" section
  const recentSessions = await db.studySession.findMany({
    where: { userId: session.userId, status: 'COMPLETED' },
    orderBy: { endedAt: 'desc' },
    take: 5,
    include: { subject: { select: { name: true, color: true } } },
  });

  const hasData = stats.sessionCount > 0 || recentSessions.length > 0;

  // Find max duration for chart scaling
  const maxChartDuration = Math.max(...stats.chartData.map((d) => d.duration), 1); // fallback to 1 to avoid / 0

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
            <BarChart3 className="h-5 w-5 text-primary hidden sm:block" />
            <h1 className="font-heading font-semibold text-foreground text-lg hidden sm:block">
              Study Analytics
            </h1>
          </div>
          <div className="flex bg-muted rounded-md p-1">
            <Link
              href="/study-analytics?period=7"
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                days === 7
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </Link>
            <Link
              href="/study-analytics?period=30"
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                days === 30
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Days
            </Link>
            <Link
              href="/study-analytics?period=90"
              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                days === 90
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              90 Days
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!hasData ? (
          <Card className="border-dashed border-2 border-border/50 bg-muted/10 shadow-none mt-8">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading text-xl font-bold text-foreground">No study data yet</h3>
              <p className="text-muted-foreground max-w-md mt-2 mb-6">
                Complete study sessions using the Pomodoro timer to unlock powerful analytics about
                your focus habits, consistency, and subject breakdown.
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
        ) : (
          <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/50 shadow-sm bg-primary text-primary-foreground">
                <CardContent className="p-5 flex flex-col justify-center">
                  <span className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Total Time
                  </span>
                  <span className="text-3xl font-black font-heading">
                    {formatDuration(stats.totalDuration)}
                  </span>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-5 flex flex-col justify-center">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Sessions
                  </span>
                  <span className="text-3xl font-black font-heading text-foreground">
                    {stats.sessionCount}
                  </span>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-5 flex flex-col justify-center">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-500" /> Current Streak
                  </span>
                  <span className="text-3xl font-black font-heading text-foreground">
                    {streakInfo.currentStreak}{' '}
                    <span className="text-sm font-medium text-muted-foreground tracking-normal lowercase">
                      days
                    </span>
                  </span>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-5 flex flex-col justify-center">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-green-500" /> Avg Session
                  </span>
                  <span className="text-3xl font-black font-heading text-foreground">
                    {formatDuration(stats.averageDuration)}
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart & Consistency */}
              <div className="lg:col-span-2 space-y-8">
                {/* Study Time Chart */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Study Time</CardTitle>
                    <CardDescription>
                      Your daily focus time over the last {days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end gap-2 mt-4 pt-4 border-t border-border/30 overflow-x-auto pb-2 custom-scrollbar">
                      {stats.chartData.map((d, i) => {
                        const heightPct = Math.max((d.duration / maxChartDuration) * 100, 2); // min height 2%
                        const isZero = d.duration === 0;
                        return (
                          <div
                            key={d.date}
                            className="flex-1 min-w-[24px] flex flex-col items-center gap-2 group relative"
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                              {d.label}: {formatDuration(d.duration)}
                            </div>
                            <div className="w-full relative h-full flex items-end justify-center rounded-t-sm">
                              <div
                                className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${isZero ? 'bg-muted/30' : 'bg-primary hover:bg-primary/80'}`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate uppercase font-medium">
                              {days === 7
                                ? d.label
                                : i % (days === 30 ? 3 : 7) === 0
                                  ? d.label
                                  : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Session Statistics */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Detailed Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Longest Session
                        </p>
                        <p className="font-bold text-foreground">
                          {formatDuration(stats.longestSession)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Shortest Session
                        </p>
                        <p className="font-bold text-foreground">
                          {formatDuration(stats.shortestSession)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Pomodoros
                        </p>
                        <p className="font-bold text-foreground">{stats.pomodoroCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Custom
                        </p>
                        <p className="font-bold text-foreground">{stats.customCount}</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Longest Streak
                        </p>
                        <p className="font-bold text-foreground flex items-center justify-center gap-1">
                          🔥 {streakInfo.longestStreak} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Active Days (Week)
                        </p>
                        <p className="font-bold text-foreground">
                          {streakInfo.activeDaysThisWeek} / 7
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Active Days (Month)
                        </p>
                        <p className="font-bold text-foreground">
                          {streakInfo.activeDaysThisMonth}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar: Subject Breakdown & Recent */}
              <div className="space-y-8">
                {/* Subject Breakdown */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Subject Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.subjectBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No subject data found.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {stats.subjectBreakdown.map((sb) => (
                          <div key={sb.id}>
                            <div className="flex items-center justify-between mb-1.5 text-sm">
                              <span className="font-medium text-foreground truncate mr-2 flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: sb.color || 'currentColor' }}
                                />
                                {sb.name}
                              </span>
                              <span className="text-muted-foreground whitespace-nowrap">
                                {formatDuration(sb.duration)} ({sb.percentage}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{
                                  width: `${sb.percentage}%`,
                                  backgroundColor: sb.color || undefined,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSessions.map((rs) => (
                        <div
                          key={rs.id}
                          className="flex items-start justify-between border-b border-border/50 last:border-0 pb-4 last:pb-0"
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {rs.subject?.name || 'General Study'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              {rs.endedAt?.toLocaleDateString()} •{' '}
                              {rs.type === 'POMODORO' ? 'Pomodoro' : 'Custom'}
                            </p>
                          </div>
                          <span className="font-bold text-sm font-heading">
                            {formatDuration(rs.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
