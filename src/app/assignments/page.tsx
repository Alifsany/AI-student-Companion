import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { buttonVariants } from '@/components/ui/button';
import { AssignmentCard } from '@/components/assignment-card';
import { FileText, Plus, FolderOpen } from 'lucide-react';

export const metadata = {
  title: 'Assignments — AI Student Companion',
  description: 'Manage your academic assignments and tasks',
};

export default async function AssignmentsPage() {
  const session = await verifySession();

  // Fetch assignments with subject relation for the authenticated user
  const assignments = await db.academicTask.findMany({
    where: { userId: session.userId, type: 'ASSIGNMENT' },
    orderBy: [
      { dueDate: 'asc' }, // Nearest first
      { priority: 'desc' }, // HIGH priority first
    ],
    include: {
      subject: {
        select: {
          name: true,
          color: true,
        },
      },
    },
  });

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
            <FileText className="h-5 w-5 text-primary hidden sm:block" />
            <h1 className="font-heading font-semibold text-foreground text-lg hidden sm:block">
              Assignments
            </h1>
          </div>

          <Link
            href="/assignments/new"
            className={buttonVariants({ size: 'sm', className: 'gap-2' })}
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:hidden mb-2">
            Assignments
          </h2>
          <p className="text-muted-foreground">Keep track of your tasks, projects, and homework.</p>
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground">No assignments yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mb-8">
              Stay on top of your work by adding your upcoming assignments, essays, and projects.
            </p>
            <Link
              href="/assignments/new"
              className={buttonVariants({ size: 'lg', className: 'gap-2' })}
            >
              <Plus className="h-5 w-5" />
              Add your first assignment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
