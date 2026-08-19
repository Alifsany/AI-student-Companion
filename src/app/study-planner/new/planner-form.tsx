'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ArrowLeft, CalendarDays } from 'lucide-react';
import { type FormState } from '@/lib/validations';
import { StudyPlanItem } from '@/generated/prisma/client';

type Subject = { id: string; name: string };
type Task = { id: string; title: string; subjectId: string | null };
type Goal = { id: string; title: string };

type PlannerFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  subjects: Subject[];
  tasks: Task[];
  goals: Goal[];
  initialData?: StudyPlanItem;
  defaultDate?: string;
};

export function PlannerForm({
  action,
  subjects,
  tasks,
  goals,
  initialData,
  defaultDate,
}: PlannerFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialData?.subjectId || '');

  const filteredTasks = selectedSubjectId
    ? tasks.filter((t) => t.subjectId === selectedSubjectId || !t.subjectId)
    : tasks;

  // Format YYYY-MM-DD for date input
  let formattedDate = defaultDate || new Date().toISOString().split('T')[0];
  if (initialData?.plannedDate) {
    formattedDate = new Date(initialData.plannedDate).toISOString().split('T')[0];
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/study-planner"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Study Planner
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            {initialData ? 'Edit Study Plan' : 'Add Study Plan'}
          </CardTitle>
          <CardDescription>Schedule a block of focus time.</CardDescription>
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
                <Label htmlFor="title">
                  Plan Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={initialData?.title}
                  placeholder="e.g. Read Chapter 4 & 5"
                  required
                />
                {state?.errors?.title && (
                  <p className="text-xs font-medium text-destructive">{state.errors.title[0]}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plannedDate">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="plannedDate"
                    name="plannedDate"
                    type="date"
                    defaultValue={formattedDate}
                    required
                  />
                  {state?.errors?.plannedDate && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.plannedDate[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plannedDuration">Duration</Label>
                  <Select
                    name="plannedDuration"
                    defaultValue={initialData?.plannedDuration?.toString() || '3600'}
                  >
                    <SelectTrigger id="plannedDuration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="900">15 Minutes</SelectItem>
                      <SelectItem value="1800">30 Minutes</SelectItem>
                      <SelectItem value="2700">45 Minutes</SelectItem>
                      <SelectItem value="3600">1 Hour</SelectItem>
                      <SelectItem value="5400">1.5 Hours</SelectItem>
                      <SelectItem value="7200">2 Hours</SelectItem>
                      <SelectItem value="10800">3 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                  {state?.errors?.plannedDuration && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.plannedDuration[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject (Optional)</Label>
                <Select
                  name="subjectId"
                  defaultValue={initialData?.subjectId || undefined}
                  onValueChange={(val) => setSelectedSubjectId(val === ' ' ? '' : (val as string))}
                >
                  <SelectTrigger id="subjectId">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">None (General Study)</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taskId">Related Task (Optional)</Label>
                  <Select
                    name="taskId"
                    defaultValue={initialData?.taskId || undefined}
                    disabled={filteredTasks.length === 0}
                  >
                    <SelectTrigger id="taskId">
                      <SelectValue
                        placeholder={
                          filteredTasks.length === 0 ? 'No tasks available' : 'Select a task'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">None</SelectItem>
                      {filteredTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goalId">Related Goal (Optional)</Label>
                  <Select
                    name="goalId"
                    defaultValue={initialData?.goalId || undefined}
                    disabled={goals.length === 0}
                  >
                    <SelectTrigger id="goalId">
                      <SelectValue
                        placeholder={goals.length === 0 ? 'No goals available' : 'Select a goal'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">None</SelectItem>
                      {goals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Notes (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialData?.description || ''}
                  placeholder="What specifically will you work on?"
                  className="resize-none"
                />
                {state?.errors?.description && (
                  <p className="text-xs font-medium text-destructive">
                    {state.errors.description[0]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4 flex justify-end gap-3">
            <Link href="/study-planner" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
            <Button type="submit" disabled={isPending} className="gap-2">
              <CalendarDays className="h-4 w-4" />
              {isPending ? 'Saving...' : initialData ? 'Update Plan' : 'Save Plan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
