'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { type FormState } from '@/lib/validations';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GRADES } from '@/lib/grading';

type Subject = {
  id: string;
  name: string;
  code: string | null;
  creditHours: number | null;
};

type RecordFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  subjects: Subject[];
  initialData?: {
    id?: string;
    subjectId?: string;
    semester?: string;
    academicYear?: string;
    creditHours?: number;
    grade?: string;
  };
};

export function RecordForm({ action, subjects, initialData }: RecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/academic-performance"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Academic Performance
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            {initialData?.id ? 'Edit Academic Result' : 'Add Academic Result'}
          </CardTitle>
          <CardDescription>
            {initialData?.id
              ? 'Update your grade and credits for this subject.'
              : 'Record your final grade for a completed subject.'}
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            {state?.message && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{state.message}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Subject <span className="text-destructive">*</span>
                </Label>
                {subjects.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md border border-border/50">
                    You need to add a subject first before recording a grade.
                  </div>
                ) : (
                  <Select name="subjectId" defaultValue={initialData?.subjectId || ''} required>
                    <SelectTrigger id="subjectId">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code ? `${s.code} - ` : ''}
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {state?.errors?.subjectId && (
                  <p className="text-xs font-medium text-destructive">
                    {state.errors.subjectId[0]}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="semester">
                    Semester / Term <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="semester"
                    name="semester"
                    placeholder="e.g. Fall, Spring, Q1"
                    defaultValue={initialData?.semester || ''}
                    required
                  />
                  {state?.errors?.semester && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.semester[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">
                    Academic Year <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    placeholder="e.g. 2026-2027"
                    defaultValue={initialData?.academicYear || ''}
                    required
                  />
                  {state?.errors?.academicYear && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.academicYear[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditHours">
                    Credit Hours <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="creditHours"
                    name="creditHours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="e.g. 3"
                    defaultValue={initialData?.creditHours ?? ''}
                    required
                  />
                  {state?.errors?.creditHours && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.creditHours[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">
                    Grade <span className="text-destructive">*</span>
                  </Label>
                  <Select name="grade" defaultValue={initialData?.grade || ''} required>
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g.grade} value={g.grade}>
                          {g.grade} ({g.point.toFixed(1)} GP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state?.errors?.grade && (
                    <p className="text-xs font-medium text-destructive">{state.errors.grade[0]}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4 flex justify-end gap-3">
            <Link href="/academic-performance" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
            <Button type="submit" disabled={isPending || subjects.length === 0}>
              {isPending
                ? initialData?.id
                  ? 'Updating...'
                  : 'Saving...'
                : initialData?.id
                  ? 'Update Result'
                  : 'Save Result'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
