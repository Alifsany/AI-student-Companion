'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, CheckCircle2 } from 'lucide-react';
import {
  pauseStudySession,
  resumeStudySession,
  completeStudySession,
  cancelStudySession,
} from '@/actions/study-sessions';

type StudySessionProps = {
  session: {
    id: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
    duration: number; // accumulated seconds so far
    plannedDuration: number;
    resumedAt: Date;
    subject?: { name: string; color: string | null } | null;
    task?: { title: string } | null;
  };
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PomodoroTimer({ session }: StudySessionProps) {
  const [elapsed, setElapsed] = useState(session.duration);
  const [isPending, setIsPending] = useState(false);

  // Sync elapsed time locally if active
  useEffect(() => {
    if (session.status !== 'ACTIVE') {
      setElapsed(session.duration); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    const startElapsed = session.duration;
    const resumedTime = new Date(session.resumedAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diffSeconds = Math.floor((now - resumedTime) / 1000);
      setElapsed(startElapsed + diffSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const remaining = Math.max(0, session.plannedDuration - elapsed);

  // Handlers
  const handlePause = async () => {
    setIsPending(true);
    await pauseStudySession(session.id);
    setIsPending(false);
  };

  const handleResume = async () => {
    setIsPending(true);
    await resumeStudySession(session.id);
    setIsPending(false);
  };

  const handleComplete = async () => {
    if (!confirm('Are you sure you want to complete this session?')) return;
    setIsPending(true);
    await completeStudySession(session.id);
    setIsPending(false);
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? This will not record your time.')) return;
    setIsPending(true);
    await cancelStudySession(session.id);
    setIsPending(false);
  };

  const isOvertime = elapsed > session.plannedDuration;

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden relative">
      {session.subject?.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: session.subject.color }}
        />
      )}
      <CardContent className="p-8 flex flex-col items-center justify-center text-center">
        <div className="mb-6 space-y-1">
          <h3 className="font-heading text-lg font-bold text-foreground">
            {session.subject?.name || 'General Study'}
          </h3>
          {session.task && (
            <p className="text-sm font-medium text-muted-foreground">{session.task.title}</p>
          )}
        </div>

        <div className="relative mb-8">
          <div className="text-7xl sm:text-8xl font-black font-heading tracking-tighter text-foreground tabular-nums">
            {formatTime(remaining > 0 ? remaining : elapsed)}
          </div>
          {isOvertime && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-semibold text-primary uppercase tracking-widest whitespace-nowrap">
              Overtime
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 justify-center mt-2">
          {session.status === 'ACTIVE' ? (
            <Button
              size="lg"
              variant="outline"
              className="w-24 gap-2"
              onClick={handlePause}
              disabled={isPending}
            >
              <Pause className="h-4 w-4" /> Pause
            </Button>
          ) : (
            <Button
              size="lg"
              variant="default"
              className="w-24 gap-2"
              onClick={handleResume}
              disabled={isPending}
            >
              <Play className="h-4 w-4" /> Resume
            </Button>
          )}

          <Button
            size="lg"
            variant="default"
            className="w-32 gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleComplete}
            disabled={isPending}
          >
            <CheckCircle2 className="h-4 w-4" /> Complete
          </Button>
        </div>

        <div className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive text-xs"
            onClick={handleCancel}
            disabled={isPending}
          >
            <Square className="h-3 w-3 mr-1.5" /> Cancel Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
