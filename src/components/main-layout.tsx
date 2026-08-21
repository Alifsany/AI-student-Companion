"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Sparkles, TrendingUp, FileText, ClipboardCheck, CalendarDays, 
  BookOpen, NotebookPen, ListChecks, ChartNoAxesCombined, Timer, Target, UserRound 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicRoute = ['/', '/login', '/register', '/onboarding'].includes(pathname) || pathname.startsWith('/api');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const routes = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      title: 'STUDY',
      items: [
        { title: 'AI Study Assistant', icon: Sparkles, href: '/study' },
        { title: 'Notes & PDFs', icon: FileText, href: '/study/notes' },
        { title: 'Quiz', icon: ClipboardCheck, href: '/quiz' },
        { title: 'Study Planner', icon: CalendarDays, href: '/study-planner' },
      ],
    },
    {
      title: 'ACADEMIC',
      items: [
        { title: 'Subjects', icon: BookOpen, href: '/subjects' },
        { title: 'Assignments', icon: NotebookPen, href: '/assignments' },
        { title: 'Tasks', icon: ListChecks, href: '/tasks' },
        { title: 'Academic Performance', icon: ChartNoAxesCombined, href: '/academic-performance' },
        { title: 'Progress & Analytics', icon: TrendingUp, href: '/progress' },
        { title: 'Study Sessions', icon: Timer, href: '/study-sessions' },
      ],
    },
    {
      title: 'PERSONAL',
      items: [
        { title: 'Goals', icon: Target, href: '/goals' },
        { title: 'Profile', icon: UserRound, href: '/profile' },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop only for now, can be responsive later */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 sm:p-6 pb-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">AI Companion</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-6">
          {routes.map((section, i) => (
            <div key={i}>
              {section.items ? (
                <>
                  <h4 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h4>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Link
                  href={section.href!}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === section.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <MobileNav />
        {children}
      </main>
    </div>
  );
}
