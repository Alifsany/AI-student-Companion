
import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { buttonVariants } from '@/components/ui/button';
import { SubjectCard } from '@/components/subject-card';
import { BookOpen, Plus, FolderOpen, Archive } from 'lucide-react';

export const metadata = {
  title: 'Subjects — AI Student Companion',
  description: 'Manage your academic subjects and courses',
};

export default async function SubjectsPage() {
  const session = await verifySession();

  // Fetch subjects for the authenticated user
  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    orderBy: { name: 'asc' },
  });

  const activeSubjects = subjects.filter((s) => s.status === 'ACTIVE');
  const archivedSubjects = subjects.filter((s) => s.status === 'ARCHIVED');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <BookOpen className="h-5 w-5 text-primary hidden sm:block" />
            <h1 className="font-heading font-semibold text-foreground text-lg hidden sm:block">
              Subjects
            </h1>
          </div>

          <Link href="/subjects/new" className={buttonVariants({ size: 'sm', className: 'gap-2' })}>
            <Plus className="h-4 w-4" />
            Add Subject
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:hidden mb-2">
            Subjects
          </h2>
          <p className="text-muted-foreground">
            Manage your classes, track progress, and organize your academic life.
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">No subjects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mb-8">
              Start by adding your first subject. You&apos;ll be able to link assignments, notes,
              and quizzes to your subjects later.
            </p>
            <Link
              href="/subjects/new"
              className={buttonVariants({ size: 'lg', className: 'gap-2' })}
            >
              <Plus className="h-5 w-5" />
              Add your first subject
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Subjects */}
            <section>
              <h3 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Active Subjects
              </h3>
              {activeSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/50">
                  You don&apos;t have any active subjects.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {activeSubjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              )}
            </section>

            {/* Archived Subjects */}
            {archivedSubjects.length > 0 && (
              <section>
                <h3 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <Archive className="h-5 w-5" /> Archived Subjects
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {archivedSubjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} />
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
