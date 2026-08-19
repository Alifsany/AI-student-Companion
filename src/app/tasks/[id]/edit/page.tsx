import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { TaskForm } from '../../task-form';
import { updateTask } from '@/actions/tasks';

export const metadata = {
  title: 'Edit task — AI Student Companion',
  description: 'Update an task',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EdittaskPage({ params }: Props) {
  const session = await verifySession();
  const resolvedParams = await params;

  // Fetch task and verify ownership in one query
  const task = await db.academicTask.findUnique({
    where: {
      id: resolvedParams.id,
      userId: session.userId,
    },
  });

  if (!task) {
    // task doesn't exist or belongs to another user
    notFound();
  }

  // Fetch subjects to populate the dropdown
  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Bind the task ID to the server action
  const updateAction = updateTask.bind(null, task.id);

  return (
    <div className="min-h-screen bg-muted/30">
      <TaskForm action={updateAction} subjects={subjects} initialData={task} />
    </div>
  );
}
