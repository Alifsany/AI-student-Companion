import { notFound } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { RecordForm } from '../../record-form';
import { updateAcademicRecord } from '@/actions/academic-records';

export const metadata = {
  title: 'Edit Academic Result — AI Student Companion',
  description: 'Update an academic result',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAcademicRecordPage({ params }: Props) {
  const session = await verifySession();
  const resolvedParams = await params;

  // Fetch record and verify ownership
  const record = await db.academicRecord.findFirst({
    where: {
      id: resolvedParams.id,
      userId: session.userId,
    },
  });

  if (!record) {
    notFound();
  }

  // Fetch subjects for dropdown
  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, code: true, creditHours: true },
    orderBy: { name: 'asc' },
  });

  const updateAction = updateAcademicRecord.bind(null, record.id);

  return (
    <div className="min-h-screen bg-muted/30">
      <RecordForm action={updateAction} subjects={subjects} initialData={record} />
    </div>
  );
}
