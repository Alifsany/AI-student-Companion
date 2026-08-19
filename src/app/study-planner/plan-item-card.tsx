'use client';


import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, CheckCircle2, Play, XCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  deleteStudyPlan,
  updateStudyPlanStatus,
  startSessionFromPlan,
} from '@/actions/study-planner';

type PlanItem = {
  id: string;
  title: string;
  description: string | null;
  plannedDuration: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  subject: { name: string; color: string | null } | null;
  task: { title: string } | null;
  goal: { title: string } | null;
};

export function PlanItemCard({
  item,
  hasActiveSession,
}: {
  item: PlanItem;
  hasActiveSession: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this study plan?')) {
      startTransition(() => {
        deleteStudyPlan(item.id);
      });
    }
  };

  const handleStatus = (status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED') => {
    startTransition(() => {
      updateStudyPlanStatus(item.id, status);
    });
  };

  const handleStartSession = () => {
    if (hasActiveSession) {
      alert('You already have an active study session. Please complete or cancel it first.');
      return;
    }
    startTransition(() => {
      startSessionFromPlan(item.id);
    });
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-4 rounded-lg border border-border/50 bg-background shadow-sm transition-opacity ${item.status === 'COMPLETED' || item.status === 'SKIPPED' ? 'opacity-60' : ''}`}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <Badge
            variant={
              item.status === 'COMPLETED'
                ? 'default'
                : item.status === 'IN_PROGRESS'
                  ? 'secondary'
                  : 'outline'
            }
            className="text-[10px] tracking-wider uppercase"
          >
            {item.status.replace('_', ' ')}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 -mt-2 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => router.push(`/study-planner/${item.id}/edit`)}
                className="cursor-pointer"
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              {item.status !== 'COMPLETED' && (
                <DropdownMenuItem
                  onClick={() => handleStatus('COMPLETED')}
                  className="cursor-pointer text-green-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Done
                </DropdownMenuItem>
              )}
              {item.status !== 'SKIPPED' && (
                <DropdownMenuItem
                  onClick={() => handleStatus('SKIPPED')}
                  className="cursor-pointer text-orange-600"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Mark Skipped
                </DropdownMenuItem>
              )}
              {item.status !== 'PLANNED' && (
                <DropdownMenuItem
                  onClick={() => handleStatus('PLANNED')}
                  className="cursor-pointer"
                >
                  <Timer className="h-4 w-4 mr-2" /> Mark Planned
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-semibold text-foreground leading-tight mb-1">{item.title}</h4>

        {item.subject && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.subject.color || 'currentColor' }}
            />
            <span className="truncate">{item.subject.name}</span>
          </div>
        )}

        {(item.task || item.goal) && (
          <div className="mt-2 space-y-1">
            {item.task && (
              <p className="text-xs text-muted-foreground truncate border-l-2 border-primary/30 pl-2">
                Task: {item.task.title}
              </p>
            )}
            {item.goal && (
              <p className="text-xs text-muted-foreground truncate border-l-2 border-primary/30 pl-2">
                Goal: {item.goal.title}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground flex items-center gap-1">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDuration(item.plannedDuration)}
        </span>

        {(item.status === 'PLANNED' || item.status === 'IN_PROGRESS') && (
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs px-3 gap-1"
            onClick={handleStartSession}
            disabled={isPending}
          >
            <Play className="h-3 w-3" />
            {isPending ? 'Starting...' : 'Study'}
          </Button>
        )}
      </div>
    </div>
  );
}
