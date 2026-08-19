import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { verifySession, getCurrentUser } from '@/lib/dal';
import { GoalCard } from '@/components/goal-card';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TargetIcon, ArrowLeft, Plus } from 'lucide-react';

export const metadata = {
  title: 'Academic Goals — AI Student Companion',
  description: 'Manage your academic goals and track your progress',
};

export default async function GoalsPage() {
  const session = await verifySession();

  if (!session?.userId) {
    redirect('/login');
  }

  const user = await getCurrentUser();
  if (!user?.onboardingCompleted) {
    redirect('/onboarding');
  }

  const goals = await db.academicGoal.findMany({
    where: { userId: session.userId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  const activeGoals = goals.filter((g) => g.status !== 'COMPLETED');
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="mr-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-heading font-semibold text-lg text-foreground">
              Academic Goals
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Your Goals
            </h1>
            <p className="text-muted-foreground mt-1">
              Set, track, and achieve your academic targets.
            </p>
          </div>
          <Link href="/goals/new" className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-2 h-4 w-4" />
            Create Goal
          </Link>
        </div>

        {goals.length === 0 ? (
          <Card className="border-border/50 border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TargetIcon className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="font-heading text-xl font-medium text-foreground mb-2">
                No goals set yet
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Start by creating your first academic goal. Track your target GPA, study habits, or
                specific achievements.
              </p>
              <Link href="/goals/new" className={buttonVariants({ variant: 'default' })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Goal
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                Active Goals
                <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full font-semibold">
                  {activeGoals.length}
                </span>
              </h2>
              {activeGoals.length === 0 ? (
                <div className="p-8 text-center border rounded-lg bg-muted/20 border-dashed">
                  <p className="text-muted-foreground text-sm">
                    No active goals. You've completed everything!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </section>

            {completedGoals.length > 0 && (
              <section>
                <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  Completed Goals
                  <span className="bg-green-500/10 text-green-600 text-xs py-0.5 px-2 rounded-full font-semibold">
                    {completedGoals.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
