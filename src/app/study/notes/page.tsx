import { verifySession, getCurrentUser } from '@/lib/dal';
import { redirect } from 'next/navigation';
import { DocumentManager } from './document-manager';

export const metadata = {
  title: 'Notes & Documents ?" AI Student Companion',
  description: 'Manage your academic documents and notes',
};

export default async function NotesPage() {
  const session = await verifySession();
  const user = await getCurrentUser();

  if (!user || !session.isAuth) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notes & Documents</h1>
            <p className="text-muted-foreground mt-2">
              Upload your academic PDFs and use AI to understand, summarize, and study from your documents.
            </p>
            <ul className="text-sm text-muted-foreground mt-3 space-y-1 list-disc list-inside">
              <li>Extract text from PDFs</li>
              <li>AI-powered summaries</li>
              <li>Ask questions about documents</li>
              <li>Generate study notes & quizzes</li>
              <li>Extract formulas and key points</li>
            </ul>
          </div>
          
          <DocumentManager userId={user.id} />
        </div>
      </div>
    </div>
  );
}
