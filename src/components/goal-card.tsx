import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Target, CheckCircle2, Edit3, Calendar, Tag } from 'lucide-react';
import type { AcademicGoal } from '@/generated/prisma/client';

interface GoalCardProps {
  goal: AcademicGoal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const isCompleted = goal.status === 'COMPLETED';

  const typeLabels: Record<string, string> = {
    TARGET_GPA: 'Target GPA',
    ACADEMIC_PERFORMANCE: 'Academic Performance',
    STUDY_CONSISTENCY: 'Study Consistency',
    SKILL_DEVELOPMENT: 'Skill Development',
    OTHER: 'Other',
  };

  const statusColors: Record<string, string> = {
    NOT_STARTED: 'bg-muted text-muted-foreground',
    IN_PROGRESS: 'bg-primary/20 text-primary',
    COMPLETED: 'bg-green-500/20 text-green-600 dark:text-green-400',
  };

  return (
    <Card
      className={`relative flex flex-col justify-between border-border/50 shadow-sm transition-all hover:shadow-md ${isCompleted ? 'opacity-80' : ''}`}
    >
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
            {typeLabels[goal.type] || goal.type}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-[10px] font-medium uppercase ${statusColors[goal.status]}`}
          >
            {goal.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardTitle
          className={`font-heading text-lg font-semibold flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Target className="h-5 w-5 text-primary" />
          )}
          {goal.title}
        </CardTitle>
        {goal.description && (
          <CardDescription className="line-clamp-2 mt-1">{goal.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-5 pt-0 space-y-4">
        {(goal.targetValue || goal.deadline) && (
          <div className="grid grid-cols-2 gap-4 text-sm mt-2 p-3 bg-muted/20 rounded-md">
            {goal.targetValue && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[10px] uppercase flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Target
                </span>
                <span className="font-medium truncate">{goal.targetValue}</span>
              </div>
            )}
            {goal.deadline && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[10px] uppercase flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Deadline
                </span>
                <span className="font-medium truncate">
                  {new Date(goal.deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Link
            href={`/goals/${goal.id}/edit`}
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-xs h-8' })}
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            Edit Goal
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
