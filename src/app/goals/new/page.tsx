import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession, getCurrentUser } from '@/lib/dal';
import { GoalForm } from '@/app/goals/goal-form';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Create Goal — AI Student Companion',
  description: 'Create a new academic goal',
};

export default async function NewGoalPage() {
  const session = await verifySession();

  if (!session?.userId) {
    redirect('/login');
  }

  const user = await getCurrentUser();
  if (!user?.onboardingCompleted) {
    redirect('/onboarding');
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
        <GoalForm />
      </div>
    </div>
  );
}
