'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createGoal, updateGoal, deleteGoal, completeGoal } from '@/actions/goals';
import type { AcademicGoal } from '@/generated/prisma/client';
import { Loader2, Trash2, CheckCircle } from 'lucide-react';
import { FormState } from '@/lib/validations';

interface GoalFormProps {
  initialData?: AcademicGoal;
}

export function GoalForm({ initialData }: GoalFormProps) {
  const isEditing = !!initialData;
  const action = isEditing ? updateGoal.bind(null, initialData.id) : createGoal;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action as any,
    undefined,
  );

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading">
            {isEditing ? 'Edit Goal' : 'Create New Goal'}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? 'Update your academic goal details.'
              : 'Define a new goal to track your academic progress.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Goal Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={initialData?.title}
                  placeholder="e.g. Achieve 3.8 GPA this semester"
                  disabled={isPending}
                  required
                />
                {state?.errors?.title && (
                  <p className="text-sm text-destructive">{state.errors.title[0]}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Goal Type</Label>
                <Select
                  name="type"
                  defaultValue={initialData?.type || 'OTHER'}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TARGET_GPA">Target GPA</SelectItem>
                    <SelectItem value="ACADEMIC_PERFORMANCE">Academic Performance</SelectItem>
                    <SelectItem value="STUDY_CONSISTENCY">Study Consistency</SelectItem>
                    <SelectItem value="SKILL_DEVELOPMENT">Skill Development</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {state?.errors?.type && (
                  <p className="text-sm text-destructive">{state.errors.type[0]}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialData?.description || ''}
                  placeholder="What specific actions will you take?"
                  disabled={isPending}
                  rows={3}
                />
                {state?.errors?.description && (
                  <p className="text-sm text-destructive">{state.errors.description[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="targetValue">Target Value (Optional)</Label>
                  <Input
                    id="targetValue"
                    name="targetValue"
                    defaultValue={initialData?.targetValue || ''}
                    placeholder="e.g. 3.8, 10 hours/week"
                    disabled={isPending}
                  />
                  {state?.errors?.targetValue && (
                    <p className="text-sm text-destructive">{state.errors.targetValue[0]}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    defaultValue={
                      initialData?.deadline
                        ? new Date(initialData.deadline).toISOString().split('T')[0]
                        : ''
                    }
                    disabled={isPending}
                  />
                  {state?.errors?.deadline && (
                    <p className="text-sm text-destructive">{state.errors.deadline[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  defaultValue={initialData?.status || 'NOT_STARTED'}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {state?.errors?.status && (
                  <p className="text-sm text-destructive">{state.errors.status[0]}</p>
                )}
              </div>
            </div>

            {state?.message && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {state.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="sm:flex-1">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Goal'}
              </Button>
              <Link href="/goals" className="sm:flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={isPending}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="border-destructive/20 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-destructive font-heading text-lg">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for this goal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialData.status !== 'COMPLETED' && (
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <h4 className="text-sm font-medium">Mark as completed</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Achieved your goal? Mark it as complete.
                  </p>
                </div>
                <form action={completeGoal.bind(null, initialData.id)}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </form>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Delete goal</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete this goal and its data.
                </p>
              </div>
              <form action={deleteGoal.bind(null, initialData.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
