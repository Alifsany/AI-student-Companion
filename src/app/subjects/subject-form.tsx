'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

type SubjectFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialData?: {
    id?: string;
    name?: string;
    code?: string | null;
    department?: string | null;
    semester?: string | null;
    academicYear?: string | null;
    creditHours?: number | null;
    status?: 'ACTIVE' | 'ARCHIVED';
    teacherName?: string | null;
    description?: string | null;
    color?: string | null;
    targetGoal?: string | null;
  };
};

export function SubjectForm({ action, initialData }: SubjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/subjects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Subjects
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            {initialData?.id ? 'Edit Subject' : 'Add Subject'}
          </CardTitle>
          <CardDescription>
            {initialData?.id
              ? 'Update the details for this subject.'
              : 'Create a new subject to track assignments, notes, and progress.'}
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            {state?.message && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{state.message}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">
                    Subject Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Advanced Calculus"
                    defaultValue={initialData?.name || ''}
                    aria-describedby="name-error"
                    required
                  />
                  {state?.errors?.name && (
                    <p id="name-error" className="text-xs font-medium text-destructive">
                      {state.errors.name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g. CS101"
                    defaultValue={initialData?.code || ''}
                    aria-describedby="code-error"
                  />
                  {state?.errors?.code && (
                    <p id="code-error" className="text-xs font-medium text-destructive">
                      {state.errors.code[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="e.g. Computer Science"
                    defaultValue={initialData?.department || ''}
                    aria-describedby="department-error"
                  />
                  {state?.errors?.department && (
                    <p id="department-error" className="text-xs font-medium text-destructive">
                      {state.errors.department[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester / Term</Label>
                  <Input
                    id="semester"
                    name="semester"
                    placeholder="e.g. Fall, Q1, Spring"
                    defaultValue={initialData?.semester || ''}
                    aria-describedby="semester-error"
                  />
                  {state?.errors?.semester && (
                    <p id="semester-error" className="text-xs font-medium text-destructive">
                      {state.errors.semester[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    placeholder="e.g. 2026-2027"
                    defaultValue={initialData?.academicYear || ''}
                    aria-describedby="academicYear-error"
                  />
                  {state?.errors?.academicYear && (
                    <p id="academicYear-error" className="text-xs font-medium text-destructive">
                      {state.errors.academicYear[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditHours">Credit Hours</Label>
                  <Input
                    id="creditHours"
                    name="creditHours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 3"
                    defaultValue={initialData?.creditHours ?? ''}
                    aria-describedby="creditHours-error"
                  />
                  {state?.errors?.creditHours && (
                    <p id="creditHours-error" className="text-xs font-medium text-destructive">
                      {state.errors.creditHours[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={initialData?.status || 'ACTIVE'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {state?.errors?.status && (
                    <p className="text-xs font-medium text-destructive">{state.errors.status[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherName">Teacher / Professor</Label>
                <Input
                  id="teacherName"
                  name="teacherName"
                  placeholder="e.g. Dr. Alan Turing"
                  defaultValue={initialData?.teacherName || ''}
                  aria-describedby="teacher-error"
                />
                {state?.errors?.teacherName && (
                  <p id="teacher-error" className="text-xs font-medium text-destructive">
                    {state.errors.teacherName[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetGoal">Target Grade / Goal</Label>
                <Input
                  id="targetGoal"
                  name="targetGoal"
                  placeholder="e.g. A or 95%"
                  defaultValue={initialData?.targetGoal || ''}
                  aria-describedby="goal-error"
                />
                {state?.errors?.targetGoal && (
                  <p id="goal-error" className="text-xs font-medium text-destructive">
                    {state.errors.targetGoal[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Theme Color (Hex)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    className="w-14 h-10 p-1 cursor-pointer"
                    defaultValue={initialData?.color || '#3b82f6'}
                    aria-describedby="color-error"
                  />
                  <span className="text-sm text-muted-foreground">
                    Pick a color for this subject
                  </span>
                </div>
                {state?.errors?.color && (
                  <p id="color-error" className="text-xs font-medium text-destructive">
                    {state.errors.color[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Additional details about this subject, syllabus links, office hours..."
                  defaultValue={initialData?.description || ''}
                  className="min-h-[120px] resize-y"
                  aria-describedby="description-error"
                />
                {state?.errors?.description && (
                  <p id="description-error" className="text-xs font-medium text-destructive">
                    {state.errors.description[0]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4 flex justify-end gap-3">
            <Link href="/subjects" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? initialData?.id
                  ? 'Updating...'
                  : 'Creating...'
                : initialData?.id
                  ? 'Update Subject'
                  : 'Create Subject'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
