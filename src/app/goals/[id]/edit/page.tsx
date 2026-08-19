import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { verifySession, getCurrentUser } from '@/lib/dal';
import { GoalForm } from '@/app/goals/goal-form';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Goal — AI Student Companion',
  description: 'Edit your academic goal',
};

interface EditGoalPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGoalPage({ params }: EditGoalPageProps) {
  const session = await verifySession();

  if (!session?.userId) {
    redirect('/login');
  }

  const user = await getCurrentUser();
  if (!user?.onboardingCompleted) {
    redirect('/onboarding');
  }

  const { id } = await params;

  const goal = await db.academicGoal.findUnique({
    where: { id },
  });

  if (!goal) {
    notFound();
  }

  if (goal.userId !== session.userId) {
    redirect('/goals');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/goals"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Goals
        </Link>
        <GoalForm initialData={goal} />
      </div>
    </div>
  );
}
