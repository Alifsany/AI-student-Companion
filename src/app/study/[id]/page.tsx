import { notFound, redirect } from 'next/navigation';
import { getConversation } from '@/actions/study';
import { getCurrentUser, verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { Chat } from '../chat';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await verifySession();
  if (!session.isAuth) {
    redirect('/login');
  }

  const conversation = await getConversation(id);
  const user = await getCurrentUser();
  const subjects = await db.subject.findMany({
    where: { userId: session.userId, status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  if (!conversation) {
    notFound();
  }

  // Convert DB messages to AI SDK format
  const initialMessages = conversation.messages.map(
    (msg: { id: string; role: string; content: string }) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'data',
      content: msg.content,
    }),
  );

  return (
    <Chat
      initialMessages={initialMessages}
      conversationId={conversation.id}
      userName={user?.name || undefined}
      userImage={user?.image}
      subjects={subjects}
    />
  );
}
