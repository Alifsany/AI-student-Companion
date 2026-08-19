'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { deleteSubject, archiveSubject, restoreSubject } from '@/actions/subjects';
import { BookOpen, User, Target, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';

type SubjectProps = {
  id: string;
  name: string;
  code: string | null;
  department: string | null;
  semester: string | null;
  academicYear: string | null;
  creditHours: number | null;
  status: 'ACTIVE' | 'ARCHIVED';
  teacherName: string | null;
  description: string | null;
  color: string | null;
  targetGoal: string | null;
};

export function SubjectCard({ subject }: { subject: SubjectProps }) {
  const isArchived = subject.status === 'ARCHIVED';

  return (
    <Card
      className={`group relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 flex flex-col ${isArchived ? 'opacity-70' : ''}`}
    >
      {subject.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: subject.color }}
          aria-hidden="true"
        />
      )}

      <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="font-heading text-lg font-bold flex items-center gap-2 text-foreground mb-1 truncate">
            <BookOpen
              className="h-4 w-4 shrink-0"
              style={{ color: subject.color || 'currentColor' }}
            />
            <span className="truncate">{subject.name}</span>
          </CardTitle>
          <div className="flex flex-wrap gap-2 items-center mt-1">
            {subject.code && (
              <Badge variant="secondary" className="text-[10px] py-0 font-medium">
                {subject.code}
              </Badge>
            )}
            {subject.creditHours !== null && (
              <Badge variant="outline" className="text-[10px] py-0 font-normal">
                {subject.creditHours} Credits
              </Badge>
            )}
            {isArchived && (
              <Badge variant="secondary" className="text-[10px] py-0 font-medium bg-muted">
                Archived
              </Badge>
            )}
          </div>

          {(subject.semester || subject.academicYear) && (
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1 font-medium">
              {subject.semester} {subject.academicYear}
            </p>
          )}

          {subject.teacherName && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{subject.teacherName}</span>
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        {subject.targetGoal && (
          <div className="mb-3 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Target:</span>
            <Badge
              variant="outline"
              className="text-[10px] py-0 font-normal truncate max-w-[150px]"
            >
              {subject.targetGoal}
            </Badge>
          </div>
        )}

        {subject.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{subject.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">No description provided.</p>
        )}
      </CardContent>

      <CardFooter className="bg-muted/10 border-t border-border/50 p-3 flex flex-wrap justify-between gap-2">
        <Link
          href={`/subjects/${subject.id}/edit`}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'h-8 text-xs font-medium px-3',
          })}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Link>

        <div className="flex gap-1">
          {isArchived ? (
            <form action={restoreSubject.bind(null, subject.id)}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="h-8 text-xs font-medium px-3"
              >
                <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
                Restore
              </Button>
            </form>
          ) : (
            <form action={archiveSubject.bind(null, subject.id)}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="h-8 text-xs font-medium px-3"
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                Archive
              </Button>
            </form>
          )}

          <form action={deleteSubject.bind(null, subject.id)}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="h-8 text-xs font-medium px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              formTarget="_self"
              onClick={(e) => {
                if (
                  !confirm(
                    'Are you sure you want to delete this subject? Tasks connected to this subject will have their subject set to unassigned. This action cannot be undone.',
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
}
