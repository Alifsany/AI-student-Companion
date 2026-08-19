import db from './db';


export type StudyStats = {
  totalDuration: number;
  sessionCount: number;
  averageDuration: number;
  pomodoroCount: number;
  customCount: number;
  longestSession: number;
  shortestSession: number;
  chartData: { date: string; duration: number; label: string }[];
  subjectBreakdown: {
    id: string;
    name: string;
    duration: number;
    percentage: number;
    color: string | null;
  }[];
};

export async function getStudyStats(userId: string, days: number): Promise<StudyStats> {
    const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await db.studySession.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      endedAt: { gte: startDate },
    },
    include: {
      subject: { select: { id: true, name: true, color: true } },
    },
    orderBy: { endedAt: 'asc' },
  });

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const sessionCount = sessions.length;
  const averageDuration = sessionCount > 0 ? Math.floor(totalDuration / sessionCount) : 0;

  let pomodoroCount = 0;
  let customCount = 0;
  let longestSession = 0;
  let shortestSession = Number.MAX_SAFE_INTEGER;

  const subjectMap = new Map<string, { name: string; duration: number; color: string | null }>();

  // Initialize chart data with 0s for the requested range
  const chartDataMap = new Map<string, { duration: number; label: string }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    chartDataMap.set(dateStr, { duration: 0, label });
  }

  sessions.forEach((s) => {
    // Type counts
    if (s.type === 'POMODORO') pomodoroCount++;
    if (s.type === 'CUSTOM') customCount++;

    // Min / Max
    if (s.duration > longestSession) longestSession = s.duration;
    if (s.duration < shortestSession) shortestSession = s.duration;

    // Subject breakdown
    const subjectId = s.subjectId || 'unassigned';
    const subjectName = s.subject?.name || 'General Study';
    const color = s.subject?.color || null;

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, { name: subjectName, duration: 0, color });
    }
    subjectMap.get(subjectId)!.duration += s.duration;

    // Chart grouping
    if (s.endedAt) {
      // Correct for local timezone boundaries where possible.
      // Since the server might be UTC, a simple slice of ISO string usually uses UTC.
      // To properly bucket by local date, we should offset by the timezone, but since we don't have the user's timezone reliably,
      // using the local server time or standard UTC is a common tradeoff. We'll use YYYY-MM-DD from the Date object in the server's local time.
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${s.endedAt.getFullYear()}-${pad(s.endedAt.getMonth() + 1)}-${pad(s.endedAt.getDate())}`;

      if (chartDataMap.has(dateStr)) {
        chartDataMap.get(dateStr)!.duration += s.duration;
      } else {
        // If it's a date not pre-filled (maybe outside exactly days but matched gte), we can still add it if needed, or ignore.
        // We'll add it safely.
        const label = s.endedAt.toLocaleDateString('en-US', { weekday: 'short' });
        chartDataMap.set(dateStr, { duration: s.duration, label });
      }
    }
  });

  if (shortestSession === Number.MAX_SAFE_INTEGER) shortestSession = 0;

  // Convert subject map to sorted array with percentages
  const subjectBreakdown = Array.from(subjectMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      duration: data.duration,
      color: data.color,
      percentage: totalDuration > 0 ? Math.round((data.duration / totalDuration) * 100) : 0,
    }))
    .sort((a, b) => b.duration - a.duration);

  // Extract chart data array sorted by date
  const chartData = Array.from(chartDataMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, duration: data.duration, label: data.label }));

  // If we asked for 30 or 90 days, returning every single day might clutter the chart.
  // However, the instructions ask for 7/30/90. For a simple bar chart, we'll return them all and let the UI handle it.

  return {
    totalDuration,
    sessionCount,
    averageDuration,
    pomodoroCount,
    customCount,
    longestSession,
    shortestSession,
    chartData,
    subjectBreakdown,
  };
}

export async function calculateStreak(userId: string) {
  // Fetch all completed session end dates
  const sessions = await db.studySession.findMany({
    where: { userId, status: 'COMPLETED', endedAt: { not: null } },
    select: { endedAt: true },
    orderBy: { endedAt: 'desc' },
  });

  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDaysThisWeek: 0, activeDaysThisMonth: 0 };
  }

  // Normalize dates to YYYY-MM-DD to count unique days
  const pad = (n: number) => n.toString().padStart(2, '0');
  const getLocalDateString = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const uniqueDays = new Set<string>();
  sessions.forEach((s) => {
    if (s.endedAt) uniqueDays.add(getLocalDateString(s.endedAt));
  });

  const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a));

  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Check if streak is active (must have studied today or yesterday)
  if (sortedDays.includes(todayStr) || sortedDays.includes(yesterdayStr)) {
    const checkDate = new Date(sortedDays.includes(todayStr) ? today : yesterday);

    for (let i = 0; i < sortedDays.length; i++) {
      const checkStr = getLocalDateString(checkDate);
      if (sortedDays.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
  }

  // Calculate longest streak (simple O(N) scan)
  if (sortedDays.length > 0) {
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const curr = new Date(sortedDays[i]);
      const prev = new Date(sortedDays[i + 1]);

      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }
  }

  // Calculate active days this week and month
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  let activeDaysThisWeek = 0;
  let activeDaysThisMonth = 0;

  sortedDays.forEach((dateStr) => {
    const d = new Date(dateStr);
    if (d >= weekStart) activeDaysThisWeek++;
    if (d >= monthStart) activeDaysThisMonth++;
  });

  return {
    currentStreak,
    longestStreak,
    activeDaysThisWeek,
    activeDaysThisMonth,
  };
}
