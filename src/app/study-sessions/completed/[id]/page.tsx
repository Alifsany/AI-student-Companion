import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, BookOpen, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function SessionCompletedPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (!session) redirect('/login');

  const { id } = await params;
  const studySession = await db.studySession.findUnique({
    where: { id, userId: session.userId, status: 'COMPLETED' },
    include: {
      subject: true,
      task: true,
    }
  });

  if (!studySession) {
    return notFound();
  }

  const h = Math.floor(studySession.duration / 3600);
  const m = Math.floor((studySession.duration % 3600) / 60);
  const formattedDuration = h > 0 ? h + 'h ' + m + 'm' : m + ' minutes';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500 delay-150">
          <h1 className="text-3xl font-bold font-heading">Study Session Complete ??</h1>
          <p className="text-muted-foreground">Great job maintaining your focus!</p>
        </div>

        <Card className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Focused Time</span>
              </div>
              <span className="text-xl font-bold font-heading text-primary">{formattedDuration}</span>
            </div>

            {(studySession.subject || studySession.notes) && (
              <div className="space-y-3 text-left pt-2">
                {studySession.subject && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{studySession.subject.name}</span>
                  </div>
                )}
                {studySession.notes && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="line-clamp-1">{studySession.notes}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="pt-4 animate-in fade-in duration-500 delay-500">
          <Link href="/study-sessions">
            <Button size="lg" className="w-full">Done</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

