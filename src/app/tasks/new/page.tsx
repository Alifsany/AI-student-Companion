import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { TaskForm } from '../task-form';
import { createTask } from '@/actions/tasks';

export const metadata = {
  title: 'Add task — AI Student Companion',
  description: 'Create a new task',
};

export default async function NewtaskPage() {
  const session = await verifySession();

  // Fetch subjects to populate the dropdown
  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <TaskForm action={createTask} subjects={subjects} />
    </div>
  );
}
