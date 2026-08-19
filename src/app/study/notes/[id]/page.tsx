import { verifySession, getCurrentUser } from '@/lib/dal';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { WorkspaceClient } from './workspace-client';

export const metadata = {
  title: 'Document Workspace - AI Student Companion',
};

export default async function DocumentWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  const user = await getCurrentUser();

  if (!user || !session.isAuth) {
    redirect('/login');
  }

  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
  });

  if (!document || document.userId !== user.id) {
    redirect('/study/notes');
  }

  return <WorkspaceClient document={document} />;
}
