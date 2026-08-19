'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { deleteAcademicRecord } from '@/actions/academic-records';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';

type AcademicRecordProps = {
  id: string;
  semester: string;
  academicYear: string;
  creditHours: number;
  grade: string;
  gradePoint: number;
  subject: {
    name: string;
    code: string | null;
    color: string | null;
  };
};

export function AcademicRecordCard({ record }: { record: AcademicRecordProps }) {
  const deleteAction = deleteAcademicRecord.bind(null, record.id);

  return (
    <Card className="group relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md flex flex-col">
      {record.subject.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: record.subject.color }}
          aria-hidden="true"
        />
      )}

      <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="font-heading text-lg font-bold flex items-center gap-2 text-foreground mb-1 truncate">
            <BookOpen
              className="h-4 w-4 shrink-0"
              style={{ color: record.subject.color || 'currentColor' }}
            />
            <span className="truncate">{record.subject.name}</span>
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {record.subject.code && (
              <Badge
                variant="secondary"
                className="text-[10px] py-0 font-medium truncate max-w-[100px]"
              >
                {record.subject.code}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {record.semester} {record.academicYear}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 text-right">
          <span className="text-2xl font-black text-primary leading-none">{record.grade}</span>
          <span className="text-xs text-muted-foreground mt-1 font-medium">
            {record.gradePoint.toFixed(1)} GP
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/50">
          <span className="text-xs font-medium text-foreground w-16">Credits:</span>
          <span className="text-sm font-semibold">{record.creditHours}</span>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/10 border-t border-border/50 p-3 flex justify-between gap-2">
        <Link
          href={`/academic-performance/${record.id}/edit`}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'h-8 text-xs font-medium px-3',
          })}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Link>

        <form action={deleteAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="h-8 text-xs font-medium px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            formTarget="_self"
            onClick={(e) => {
              if (
                !confirm(
                  'Are you sure you want to delete this record? Your CGPA will be recalculated. This action cannot be undone.',
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
