import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { QuizSetup } from './quiz-setup';

export const metadata = {
  title: 'New Quiz — AI Student Companion',
};

export default async function NewQuizPage() {
  const session = await verifySession();
  if (!session.isAuth) redirect('/login');

  const subjects = await db.subject.findMany({
    where: { userId: session.userId, status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <QuizSetup subjects={subjects} />;
}
