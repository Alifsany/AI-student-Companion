import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { AssignmentForm } from '../../assignment-form';
import { updateAssignment } from '@/actions/assignments';

export const metadata = {
  title: 'Edit Assignment — AI Student Companion',
  description: 'Update an assignment',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAssignmentPage({ params }: Props) {
  const session = await verifySession();
  const resolvedParams = await params;

  // Fetch assignment and verify ownership in one query
  const assignment = await db.academicTask.findUnique({
    where: {
      id: resolvedParams.id,
      userId: session.userId,
    },
  });

  if (!assignment) {
    // Assignment doesn't exist or belongs to another user
    notFound();
  }

  // Fetch subjects to populate the dropdown
  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Bind the assignment ID to the server action
  const updateAction = updateAssignment.bind(null, assignment.id);

  return (
    <div className="min-h-screen bg-muted/30">
      <AssignmentForm action={updateAction} subjects={subjects} initialData={assignment} />
    </div>
  );
}
