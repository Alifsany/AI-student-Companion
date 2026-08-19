import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brain, Calendar, Target, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground tracking-tight">
              AI Student Companion
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'hidden sm:inline-flex text-muted-foreground hover:text-foreground',
              )}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: 'default' }),
                'rounded-full shadow-sm hover:shadow transition-all',
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:pb-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Intelligent Academic Clarity
                </span>
              </div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6">
                A smart academic companion <span className="text-primary">for students</span>
              </h1>
              <p className="text-lg leading-8 text-muted-foreground sm:text-xl mb-10 max-w-2xl mx-auto">
                Take control of your learning journey with personalized study support, intelligent
                academic planning, and seamless progress tracking.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full sm:w-auto rounded-full gap-2 text-base h-12 px-8',
                  )}
                >
                  Start Learning <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: 'lg', variant: 'outline' }),
                    'w-full sm:w-auto rounded-full text-base h-12 px-8',
                  )}
                >
                  Sign In to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need to excel
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built to bring clarity to your academic life. Features designed to help you stay
                focused and achieve your goals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="font-heading mb-3 text-xl font-semibold text-foreground">
                  Personalized Study Support
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get adaptive recommendations and study materials tailored to your unique learning
                  style and current academic needs.
                </p>
                <div className="mt-6 flex items-center text-sm font-medium text-primary">
                  <span>Coming soon</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-heading mb-3 text-xl font-semibold text-foreground">
                  Academic Planning
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Organize your semesters, balance your workload, and never miss a deadline with our
                  intelligent scheduling tools.
                </p>
                <div className="mt-6 flex items-center text-sm font-medium text-primary">
                  <span>Coming soon</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-heading mb-3 text-xl font-semibold text-foreground">
                  Study Goals & Progress
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Set actionable goals, track your daily progress, and celebrate your academic
                  achievements with visual insights.
                </p>
                <div className="mt-6 flex items-center text-sm font-medium text-primary">
                  <span>Coming soon</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="font-heading text-sm font-semibold text-foreground">
              AI Student Companion
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Student Companion. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
