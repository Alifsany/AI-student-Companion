import { verifySession } from '@/lib/dal';
import { SubjectForm } from '../subject-form';
import { createSubject } from '@/actions/subjects';

export const metadata = {
  title: 'Add Subject — AI Student Companion',
  description: 'Create a new academic subject',
};

export default async function NewSubjectPage() {
  // Ensure user is authenticated before rendering form
  await verifySession();

  return (
    <div className="min-h-screen bg-muted/30">
      <SubjectForm action={createSubject} />
    </div>
  );
}
