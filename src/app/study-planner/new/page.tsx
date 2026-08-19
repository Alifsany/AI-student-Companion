import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { PlannerForm } from './planner-form';
import { createStudyPlan } from '@/actions/study-planner';

export const metadata = {
  title: 'Add Study Plan — AI Student Companion',
};

export default async function NewStudyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;
  const defaultDate = typeof resolvedParams.date === 'string' ? resolvedParams.date : undefined;

  const [subjects, tasks, goals] = await Promise.all([
    db.subject.findMany({
      where: { userId: session.userId, status: 'ACTIVE' },
      select: { id: true, name: true },
    }),
    db.academicTask.findMany({
      where: { userId: session.userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      select: { id: true, title: true, subjectId: true },
    }),
    db.academicGoal.findMany({
      where: { userId: session.userId, status: { not: 'COMPLETED' } },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <PlannerForm
      action={createStudyPlan}
      subjects={subjects}
      tasks={tasks}
      goals={goals}
      defaultDate={defaultDate}
    />
  );
}
