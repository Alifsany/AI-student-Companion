import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import { getProgressAnalytics, generateStudyInsight } from '@/lib/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BrainCircuit,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Lightbulb
} from 'lucide-react';

export const metadata = {
  title: 'Progress & Analytics',
  description: 'Your academic performance and study analytics.',
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function ProgressPage() {
  const session = await verifySession();
  if (!session?.isAuth) redirect('/login');

  const stats = await getProgressAnalytics(session.userId);
  const insight = await generateStudyInsight(stats);

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 md:p-8 md:pb-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Progress & Analytics</h1>
      </div>

      {/* AI Insight */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-4 p-4 md:p-6">
          <div className="rounded-full bg-primary/20 p-2 text-primary">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">AI Study Insight</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.averageQuizScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across {stats.overview.totalQuizzes} quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.overview.totalStudyTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {stats.overview.totalStudySessions} sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current CGPA</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.cgpa > 0 ? stats.overview.cgpa.toFixed(2) : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on academic records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Strong vs Weak Areas */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Knowledge Areas</CardTitle>
            <CardDescription>Strengths and weaknesses across categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Strong Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.strongAreas.length > 0 ? (
                  stats.strongAreas.map(a => (
                    <Badge key={a.name} variant="outline" className="bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      {a.name} ({a.accuracy.toFixed(0)}%)
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Complete more quizzes to identify strengths.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4" /> Weak Areas
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats.weakAreas.length > 0 ? (
                  stats.weakAreas.map(a => (
                    <Badge key={a.name} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      {a.name} ({a.accuracy.toFixed(0)}%)
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Complete more quizzes to identify weak areas.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average quiz scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.subjectStats.length > 0 ? (
              <div className="space-y-4">
                {stats.subjectStats.map(s => (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{s.averageScore.toFixed(0)}% avg ({s.attempts} attempts)</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        style={{ width: `${s.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No subject data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Over Time (Simple Bar Chart) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>Score trend across your recent quiz attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.performanceOverTime.length > 0 ? (
              <div className="h-48 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 pt-6">
                {stats.performanceOverTime.slice(0, 15).map((q, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 min-w-[30px] group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md border pointer-events-none">
                      {q.score.toFixed(0)}% - {q.date}
                    </div>
                    <div className="w-full bg-secondary rounded-t-sm relative flex items-end justify-center" style={{ height: '120px' }}>
                      <div 
                        className="w-full bg-primary/80 group-hover:bg-primary transition-colors rounded-t-sm" 
                        style={{ height: `${q.score}%`, minHeight: '4px' }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">{q.date.split('/')[0]}/{q.date.split('/')[1]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No quizzes taken yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Attempts List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAttempts.length > 0 ? (
              <div className="divide-y">
                {stats.recentAttempts.map((attempt) => (
                  <div key={attempt.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                    <div>
                      <h4 className="font-medium">{attempt.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {attempt.subjectName || 'General'} ? {attempt.completedAt.toLocaleDateString()}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-500"><CheckCircle2 className="h-3 w-3" /> {attempt.correctCount}</span>
                        <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" /> {attempt.incorrectCount}</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><MinusCircle className="h-3 w-3" /> {attempt.skippedCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className="text-xl font-bold font-heading">{attempt.score.toFixed(0)}%</div>
                      <Button variant="outline" size="sm">
                        <Link href={`/quiz/results/${attempt.id}`}>View Result</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BrainCircuit className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-foreground font-medium">No quiz attempts yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Complete your first quiz to see detailed statistics.</p>
                <Button>
                  <Link href="/quiz/new">Take a Quiz</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertTriangleIcon(props: Record<string, unknown>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
