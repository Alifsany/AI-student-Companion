import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import {  buttonVariants } from '@/components/ui/button';
import { Card, CardContent,    } from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight, Plus,   } from 'lucide-react';
import { PlanItemCard } from './plan-item-card';

export const metadata = {
  title: 'Study Planner — AI Student Companion',
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function getWeekBoundaries(dateString?: string | null) {
  const date = dateString ? new Date(dateString) : new Date();
  // Ensure we are working with midnight boundary
  date.setHours(0, 0, 0, 0);

  // Normalize to Monday start
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(date.setDate(diff));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

export default async function StudyPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;
  let dateParam = typeof resolvedParams.date === 'string' ? resolvedParams.date : undefined;

  // Validate date format safely
  if (dateParam && isNaN(new Date(dateParam).getTime())) {
    dateParam = undefined;
  }

  const { startOfWeek, endOfWeek } = getWeekBoundaries(dateParam);

  // Navigation dates
  const prevWeek = new Date(startOfWeek);
  prevWeek.setDate(startOfWeek.getDate() - 7);
  const prevWeekStr = prevWeek.toISOString().split('T')[0];

  const nextWeek = new Date(startOfWeek);
  nextWeek.setDate(startOfWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const currentWeekStr = new Date().toISOString().split('T')[0];

  const planItems = await db.studyPlanItem.findMany({
    where: {
      userId: session.userId,
      plannedDate: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    include: {
      subject: { select: { name: true, color: true } },
      task: { select: { title: true } },
      goal: { select: { title: true } },
    },
    orderBy: [{ plannedDate: 'asc' }, { createdAt: 'asc' }],
  });

  const activeSession = await db.studySession.findFirst({
    where: {
      userId: session.userId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
    select: { id: true },
  });

  // Calculate week stats
  const totalPlanned = planItems.reduce((sum, item) => sum + item.plannedDuration, 0);

  // Fetch actual studied time for these plans
  let totalCompleted = 0;
  if (planItems.length > 0) {
    const planIds = planItems.map((p) => p.id);
    const sessions = await db.studySession.findMany({
      where: { studyPlanItemId: { in: planIds }, status: 'COMPLETED' },
      select: { duration: true, studyPlanItemId: true },
    });
    totalCompleted = sessions.reduce((sum, s) => sum + s.duration, 0);
  }

  const completionPct = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  // Group by day (Monday to Sunday)
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const items = planItems.filter((item) => {
      // Safely compare using UTC YYYY-MM-DD string
      const itemDate = new Date(item.plannedDate);
      return itemDate.toISOString().split('T')[0] === dateStr;
    });

    const dayPlanned = items.reduce((sum, item) => sum + item.plannedDuration, 0);
    days.push({
      date: d,
      dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'long' }),
      shortLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      items,
      dayPlanned,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors mr-2 text-sm font-medium"
            >
              &larr; Dashboard
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <CalendarDays className="h-5 w-5 text-primary hidden sm:block" />
            <h1 className="font-heading font-semibold text-foreground text-lg hidden sm:block">
              Study Planner
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-md p-1 mr-2">
              <Link
                href={`/study-planner?date=${prevWeekStr}`}
                className="p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                href={`/study-planner?date=${currentWeekStr}`}
                className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Today
              </Link>
              <Link
                href={`/study-planner?date=${nextWeekStr}`}
                className="p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <Link
              href="/study-planner/new"
              className={buttonVariants({ size: 'sm', className: 'gap-1.5' })}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Plan</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Weekly Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50 shadow-sm bg-primary text-primary-foreground col-span-3 sm:col-span-1">
            <CardContent className="p-5 flex flex-col justify-center h-full">
              <span className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> This Week
              </span>
              <span className="text-xl font-bold">
                {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm col-span-3 sm:col-span-2">
            <CardContent className="p-5 flex items-center justify-between h-full">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Planned
                </p>
                <p className="text-2xl font-black font-heading text-foreground">
                  {formatDuration(totalPlanned)}
                </p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Completed
                </p>
                <p className="text-2xl font-black font-heading text-foreground">
                  {formatDuration(totalCompleted)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Progress
                </p>
                <p className="text-2xl font-black font-heading text-primary">{completionPct}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Days List */}
        <div className="space-y-6">
          {days.map((day) => {
            const isToday = day.dateStr === currentWeekStr;

            return (
              <div
                key={day.dateStr}
                className={`rounded-xl border ${isToday ? 'border-primary shadow-sm bg-primary/5' : 'border-border/50 bg-card'} overflow-hidden`}
              >
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? 'border-primary/20 bg-primary/10' : 'border-border/50 bg-muted/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <h3
                      className={`font-heading font-semibold text-lg ${isToday ? 'text-primary' : 'text-foreground'}`}
                    >
                      {day.label}
                    </h3>
                    <span className="text-sm text-muted-foreground">{day.shortLabel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {day.dayPlanned > 0 && (
                      <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                        {formatDuration(day.dayPlanned)} planned
                      </span>
                    )}
                    <Link
                      href={`/study-planner/new?date=${day.dateStr}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Add plan for this day"
                    >
                      <Plus className="h-5 w-5" />
                    </Link>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {day.items.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        No study planned for this day.
                      </p>
                      <Link
                        href={`/study-planner/new?date=${day.dateStr}`}
                        className="text-primary text-sm font-medium hover:underline mt-2 inline-block"
                      >
                        Plan something
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {day.items.map((item) => (
                        <PlanItemCard
                          key={item.id}
                          item={item}
                          hasActiveSession={!!activeSession}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
