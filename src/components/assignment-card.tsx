import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { deleteAssignment,  } from '@/actions/assignments';
import { Calendar, AlertCircle, FileText, CheckCircle2, Clock, Trash2, Pencil } from 'lucide-react';
import { TaskPriority, TaskStatus} from '@/generated/prisma/client';

type AcademicTaskProps = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: TaskPriority;
  status: TaskStatus;
  subject?: {
    name: string;
    color: string | null;
  } | null;
};

export function AssignmentCard({ assignment }: { assignment: AcademicTaskProps }) {
  const deleteAction = deleteAssignment.bind(null, assignment.id);

  // Status & Priority formatting
  const getStatusIcon = () => {
    switch (assignment.status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = () => {
    switch (assignment.priority) {
      case 'HIGH':
        return (
          <Badge variant="destructive" className="text-[10px]">
            High Priority
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge
            variant="secondary"
            className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100"
          >
            Medium
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="outline" className="text-[10px]">
            Low
          </Badge>
        );
    }
  };

  // Check if overdue
  const isOverdue =
    assignment.dueDate &&
    new Date(assignment.dueDate) < new Date() &&
    assignment.status !== 'COMPLETED';

  return (
    <Card
      className={`group relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 flex flex-col ${isOverdue ? 'border-destructive/30 bg-destructive/5' : ''}`}
    >
      {assignment.subject?.color && (
        <div
          className="absolute top-0 left-0 bottom-0 w-1"
          style={{ backgroundColor: assignment.subject.color }}
          aria-hidden="true"
        />
      )}

      <CardHeader className="pb-3 pt-5 pl-5">
        <div className="flex justify-between items-start gap-2 mb-2">
          {getPriorityBadge()}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            {getStatusIcon()}
            <span className="capitalize">{assignment.status.replace('_', ' ').toLowerCase()}</span>
          </div>
        </div>

        <CardTitle className="font-heading text-lg font-bold text-foreground pr-2 leading-tight">
          {assignment.title}
        </CardTitle>

        {assignment.subject && (
          <p
            className="mt-1 text-xs font-medium"
            style={{ color: assignment.subject.color || 'var(--muted-foreground)' }}
          >
            {assignment.subject.name}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-4 pl-5">
        {assignment.dueDate && (
          <div
            className={`mb-3 flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            {isOverdue && <AlertCircle className="h-3.5 w-3.5 ml-1" />}
          </div>
        )}

        {assignment.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{assignment.description}</p>
        )}
      </CardContent>

      <CardFooter className="bg-muted/10 border-t border-border/50 p-3 pl-5 flex justify-between">
        <Link
          href={`/assignments/${assignment.id}/edit`}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'h-8 text-xs font-medium px-3',
          })}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Link>

        <form action={deleteAction} className="inline-block">
          <button
            type="submit"
            className={buttonVariants({
              variant: 'ghost',
              size: 'sm',
              className:
                'h-8 text-xs font-medium px-3 text-destructive hover:text-destructive hover:bg-destructive/10',
            })}
            onClick={(e) => {
              if (!confirm('Are you sure you want to delete this assignment?')) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </button>
        </form>
      </CardFooter>
    </Card>
  );
}
