import { Chat } from './chat';
import { getCurrentUser, verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function StudyPage() {
  const session = await verifySession();
  if (!session.isAuth) redirect('/login');

  const user = await getCurrentUser();
  const subjects = await db.subject.findMany({
    where: { userId: session.userId, status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  return (
    <Chat
      initialMessages={[]}
      userName={user?.name || undefined}
      userImage={user?.image}
      subjects={subjects}
    />
  );
}
