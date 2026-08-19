import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { PlannerForm } from '../../new/planner-form';
import { updateStudyPlan } from '@/actions/study-planner';

export const metadata = {
  title: 'Edit Study Plan — AI Student Companion',
};

export default async function EditStudyPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await params;

  const [initialData, subjects, tasks, goals] = await Promise.all([
    db.studyPlanItem.findFirst({ where: { id, userId: session.userId } }),
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

  if (!initialData) redirect('/study-planner');

  // Bind the ID to the server action
  const updateAction = updateStudyPlan.bind(null, id);

  return (
    <PlannerForm
      action={updateAction}
      subjects={subjects}
      tasks={tasks}
      goals={goals}
      initialData={initialData}
    />
  );
}
