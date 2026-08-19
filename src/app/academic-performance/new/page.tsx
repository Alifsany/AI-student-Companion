import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { RecordForm } from '../record-form';
import { createAcademicRecord } from '@/actions/academic-records';

export const metadata = {
  title: 'Add Academic Result — AI Student Companion',
  description: 'Record a new academic result',
};

export default async function NewAcademicRecordPage() {
  const session = await verifySession();

  // Fetch subjects for the dropdown
  const subjects = await db.subject.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, code: true, creditHours: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <RecordForm action={createAcademicRecord} subjects={subjects} />
    </div>
  );
}
