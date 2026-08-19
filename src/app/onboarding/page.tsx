import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/dal';
import OnboardingForm from './onboarding-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Complete Your Profile — AI Student Companion',
  description: 'Tell us about your academic journey to get personalized support.',
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.onboardingCompleted) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Decorative gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-primary-foreground" aria-hidden="true">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Welcome to AI Student Companion
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s set up your academic profile
        </p>
      </div>

      <div className="w-full max-w-xl">
        <Card className="border-border/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="font-heading text-xl">Student Profile</CardTitle>
            <CardDescription>
              We'll use this information to personalize your AI tutor, study plans, and content
              recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
