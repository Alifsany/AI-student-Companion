'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
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
import type { AcademicTask } from '@/generated/prisma/client';

type SubjectOption = {
  id: string;
  name: string;
};

type TaskFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  subjects: SubjectOption[];
  initialData?: AcademicTask;
};

export function TaskForm({ action, subjects, initialData }: TaskFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  // Format date for the input field (YYYY-MM-DD)
  const defaultDate = initialData?.dueDate
    ? new Date(initialData.dueDate).toISOString().split('T')[0]
    : '';

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/tasks"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to tasks
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            {initialData?.id ? 'Edit task' : 'New task'}
          </CardTitle>
          <CardDescription>
            {initialData?.id
              ? 'Update the details for this task.'
              : 'Add a new task, project, or task to keep track of.'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Task Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Final Essay on Neural Networks"
                    defaultValue={initialData?.title || ''}
                    aria-describedby="title-error"
                    required
                  />
                  {state?.errors?.title && (
                    <p id="title-error" className="text-xs font-medium text-destructive">
                      {state.errors.title[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Task Type</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={initialData?.type || 'STUDY'}
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="EXAM">Exam</option>
                    <option value="PROJECT">Project</option>
                    <option value="PRESENTATION">Presentation</option>
                    <option value="STUDY">Study Task</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {state?.errors?.type && (
                    <p className="text-xs font-medium text-destructive">{state.errors.type[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject</Label>
                  <select
                    id="subjectId"
                    name="subjectId"
                    defaultValue={initialData?.subjectId || ''}
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">No specific subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {state?.errors?.subjectId && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.subjectId[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={defaultDate}
                    aria-describedby="date-error"
                  />
                  {state?.errors?.dueDate && (
                    <p id="date-error" className="text-xs font-medium text-destructive">
                      {state.errors.dueDate[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={initialData?.priority || 'MEDIUM'}
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  {state?.errors?.priority && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.priority[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={initialData?.status || 'PENDING'}
                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="PENDING">Pending (Not Started)</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  {state?.errors?.status && (
                    <p className="text-xs font-medium text-destructive">{state.errors.status[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description & Notes (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add any instructions, requirements, or links needed..."
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
            <Link href="/tasks" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className={buttonVariants({ variant: 'default' })}
            >
              {isPending
                ? initialData?.id
                  ? 'Updating...'
                  : 'Creating...'
                : initialData?.id
                  ? 'Update task'
                  : 'Create task'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
