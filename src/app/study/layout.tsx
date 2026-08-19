import { verifySession, getCurrentUser } from '@/lib/dal';
import { getConversations } from '@/actions/study';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import { MobileStudySidebar } from './mobile-sidebar';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'AI Study Assistant â€” AI Student Companion',
  description: 'Your personal academic AI assistant',
};

export default async function StudyLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  const user = await getCurrentUser();

  if (!user || !session.isAuth) {
    redirect('/login');
  }

  const conversations = await getConversations();

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar for Conversations */}
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border space-y-2">
          <Link
            href="/study"
            className={buttonVariants({
              variant: 'default',
              className: 'w-full flex items-center justify-start gap-2',
            })}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Link>
          <Link
            href="/study/notes"
            className={buttonVariants({
              variant: 'outline',
              className: 'w-full flex items-center justify-start gap-2',
            })}
          >
            <span className="font-semibold px-1">Notes & PDFs</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Chats
          </h3>
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No recent chats</p>
          ) : (
            conversations.map((conv: { id: string; title: string }) => (
              <SidebarItem key={conv.id} id={conv.id} title={conv.title} />
            ))
          )}
        </div>
      </div>

      <MobileStudySidebar conversations={conversations} />
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative p-4">
        {children}
      </div>
    </div>
  );
}
