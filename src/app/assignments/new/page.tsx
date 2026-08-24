import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { AssignmentForm } from '../assignment-form';
import { createAssignment } from '@/actions/assignments';

export const metadata = {
  title: 'Add Assignment — AI Student Companion',
  description: 'Create a new assignment',
};

export default async function NewAssignmentPage() {
  const session = await verifySession();

  // Fetch subjects to populate the dropdown
  const tasks = await db.academicTask.findMany({
    where: { userId: session.userId, status: { not: 'COMPLETED' } },
    select: { id: true, title: true, subjectId: true },
    orderBy: { dueDate: 'asc' },
  });

  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <AssignmentForm action={createAssignment} subjects={subjects} tasks={tasks} />
    </div>
  );
}
