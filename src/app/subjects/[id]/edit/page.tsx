import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { SubjectForm } from '../../subject-form';
import { updateSubject } from '@/actions/subjects';

export const metadata = {
  title: 'Edit Subject — AI Student Companion',
  description: 'Update an academic subject',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSubjectPage({ params }: Props) {
  const session = await verifySession();
  const resolvedParams = await params;

  // Fetch subject and verify ownership in one query
  const subject = await db.subject.findFirst({
    where: {
      id: resolvedParams.id,
      userId: session.userId,
    },
  });

  if (!subject) {
    // Subject doesn't exist or belongs to another user
    notFound();
  }

  // Bind the subject ID to the server action
  const updateAction = updateSubject.bind(null, subject.id);

  return (
    <div className="min-h-screen bg-muted/30">
      <SubjectForm action={updateAction} initialData={subject} />
    </div>
  );
}
