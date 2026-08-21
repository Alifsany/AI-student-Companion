import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { getCurrentUser, getProfileCompletion } from '@/lib/dal';
import { calculateGPA } from '@/lib/grading';
import { signOut } from '@/actions/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, FileText, ClipboardCheck, CalendarDays, 
  BookOpen, NotebookPen, ListChecks, Target, ArrowRight,
  UploadCloud, Plus, Activity, ChartNoAxesCombined
} from 'lucide-react';

export const metadata = {
  title: 'Dashboard &rarr; AI Student Companion',
  description: 'Your personal academic dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  const completionPercent = getProfileCompletion(user);

  // Fetch Academic Data
  const activeSubjectsCount = await db.subject.count({
    where: { userId: user.id, status: 'ACTIVE' },
  });

  const subjects = await db.subject.findMany({
    where: { userId: user.id, status: 'ACTIVE' },
    take: 3,
    orderBy: { name: 'asc' },
  });

  const academicRecords = await db.academicRecord.findMany({
    where: { userId: user.id },
    orderBy: [{ academicYear: 'desc' }, { semester: 'desc' }],
  });

  const overallCgpa = calculateGPA(academicRecords);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todaysPlan = await db.studyPlanItem.findMany({
    where: {
      userId: user.id,
      plannedDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    include: {
      subject: { select: { name: true, color: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const activeGoalsCount = await db.academicGoal.count({
    where: { userId: user.id, status: { not: 'COMPLETED' } },
  });

  const recentGoals = await db.academicGoal.findMany({
    where: { userId: user.id, status: { not: 'COMPLETED' } },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="md:sticky md:top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full items-center justify-end px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        
        {/* Welcome Hero */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Welcome back, {user.name?.split(' ')[0] || 'Student'} ?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Stay organized, study smarter, and make progress with your AI-powered study companion.
            </p>
          </div>
          {completionPercent < 100 && (
            <div className="w-full md:w-64 bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">Profile Setup</span>
                <span className="text-xs text-muted-foreground">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 mb-2" />
              <Link href="/profile/edit" className="text-xs text-primary hover:underline font-medium">
                Complete profile &rarr;
              </Link>
            </div>
          )}
        </section>

        {/* AI Study Tools */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Study Tools
            </h2>
            <p className="text-sm text-muted-foreground">
              Everything you need to understand, practice, and organize your studies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">AI Study Assistant</CardTitle>
                <CardDescription className="text-xs">
                  Ask questions, understand difficult topics, and get step-by-step explanations.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Link href="/study" className={buttonVariants({ variant: "default", className: "w-full text-xs" })}>
                  Ask AI <ArrowRight className="ml-2 w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-base">Notes & PDFs</CardTitle>
                <CardDescription className="text-xs">
                  Upload academic PDFs, extract text, and generate AI-powered summaries.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Link href="/study/notes" className={buttonVariants({ variant: "outline", className: "w-full text-xs" })}>
                  Open Notes <ArrowRight className="ml-2 w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                  <ClipboardCheck className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-base">AI Quiz</CardTitle>
                <CardDescription className="text-xs">
                  Generate practice questions and test your understanding of any topic.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Link href="/quiz" className={buttonVariants({ variant: "outline", className: "w-full text-xs" })}>
                  Practice Quiz <ArrowRight className="ml-2 w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                  <CalendarDays className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-base">Study Planner</CardTitle>
                <CardDescription className="text-xs">
                  Plan your study sessions and stay on track with your academic goals.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Link href="/study-planner" className={buttonVariants({ variant: "outline", className: "w-full text-xs" })}>
                  Open Planner <ArrowRight className="ml-2 w-3 h-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/study" className={buttonVariants({ variant: "secondary", size: "sm", className: "rounded-full" })}>
              <Sparkles className="w-4 h-4 mr-2 text-primary" /> Ask AI
            </Link>
            <Link href="/study/notes" className={buttonVariants({ variant: "secondary", size: "sm", className: "rounded-full" })}>
              <UploadCloud className="w-4 h-4 mr-2" /> Upload PDF
            </Link>
            <Link href="/quiz/new" className={buttonVariants({ variant: "secondary", size: "sm", className: "rounded-full" })}>
              <Plus className="w-4 h-4 mr-2" /> Create Quiz
            </Link>
            <Link href="/study-planner/new" className={buttonVariants({ variant: "secondary", size: "sm", className: "rounded-full" })}>
              <CalendarDays className="w-4 h-4 mr-2" /> Plan Study
            </Link>
          </div>
        </section>

        {/* Academic Overview & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 border-t border-border/50">
          
          {/* Left Column: Academic Overview */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                <ChartNoAxesCombined className="h-5 w-5 text-foreground" />
                Academic Overview
              </h2>
              <Link href="/academic-performance" className="text-xs text-primary hover:underline font-medium">
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target CGPA</p>
                <p className="text-2xl font-bold">{user.targetGpa || '--'}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current CGPA</p>
                <p className="text-2xl font-bold">{overallCgpa}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Subjects</p>
                <p className="text-2xl font-bold">{activeSubjectsCount}</p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Goals</p>
                <p className="text-2xl font-bold">{activeGoalsCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Subjects Snippet */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Active Subjects</h3>
                  <Link href="/subjects" className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground">Manage</Link>
                </div>
                {subjects.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg text-center bg-muted/10 text-muted-foreground text-xs">
                    No active subjects.
                    <Link href="/subjects/new" className="block text-primary mt-1 hover:underline">Add one now</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subjects.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#ccc' }} />
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Today&apos;s Plan Snippet */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Today&apos;s Study Plan</h3>
                  <Link href="/study-planner" className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground">View all</Link>
                </div>
                {todaysPlan.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg text-center bg-muted/10 text-muted-foreground text-xs">
                    No study plans for today.
                    <Link href="/study-planner/new" className="block text-primary mt-1 hover:underline">Plan a session</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaysPlan.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.subject?.color || '#ccc' }} />
                            {item.subject?.name || 'General'}
                          </p>
                        </div>
                        <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px]">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Recent Activity & Goals */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-foreground" />
                Current Goals
              </h2>
              <Link href="/goals" className="text-xs text-primary hover:underline font-medium">
                All goals &rarr;
              </Link>
            </div>

            {recentGoals.length === 0 ? (
              <div className="p-6 border border-dashed rounded-xl text-center bg-muted/10">
                <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">No active study goals</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Set a goal to start tracking your progress.</p>
                <Link href="/goals/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Set a Goal
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGoals.map(goal => (
                  <div key={goal.id} className="p-4 border rounded-xl bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold leading-tight">{goal.title}</h4>
                      <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{goal.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{goal.description}</p>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (0 / 100) * 100))}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{0} / {100}</span>
                      <span>
                        {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
