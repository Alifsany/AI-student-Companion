import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { SessionForm } from './session-form';
import { startStudySession } from '@/actions/study-sessions';

export const metadata = {
  title: 'Start Study Session — AI Student Companion',
  description: 'Start a new pomodoro or study session',
};

export default async function NewStudySessionPage() {
  const session = await verifySession();

  const subjects = await db.subject.findMany({
    where: { userId: session.userId, status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const tasks = await db.academicTask.findMany({
    where: { userId: session.userId, status: { not: 'COMPLETED' } },
    select: { id: true, title: true, subjectId: true },
    orderBy: { dueDate: 'asc' },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <SessionForm action={startStudySession} subjects={subjects} tasks={tasks} />
    </div>
  );
}
