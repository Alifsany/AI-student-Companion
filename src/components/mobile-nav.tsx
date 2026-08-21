"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Sparkles, LayoutDashboard, FileText, ClipboardCheck, CalendarDays, BookOpen, NotebookPen, ListChecks, ChartNoAxesCombined, Timer, Target, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      { title: 'Progress & Analytics', icon: ChartNoAxesCombined, href: '/progress' },
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b bg-background/80 backdrop-blur-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold text-foreground">AI Companion</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-50 flex w-3/4 max-w-sm flex-col bg-card border-r shadow-lg h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-heading font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
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
          </div>
        </div>
      )}
    </>
  );
}
