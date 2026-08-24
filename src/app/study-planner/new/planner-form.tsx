'use client';

import { useActionState, useState, useTransition } from 'react';
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
import { AlertCircle, ArrowLeft, CalendarDays, Loader2, Plus } from 'lucide-react';
import { type FormState } from '@/lib/validations';
import { StudyPlanItem } from '@/generated/prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createSubjectInline, createGoalInline, createTaskInline } from '@/actions/study-planner-inline';

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
  subjects: initialSubjects,
  tasks: initialTasks,
  goals: initialGoals,
  initialData,
  defaultDate,
}: PlannerFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  
  // Local state for dynamically added entities
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(initialSubjects);
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [localGoals, setLocalGoals] = useState<Goal[]>(initialGoals);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialData?.subjectId || '');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(initialData?.goalId || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialData?.taskId || '');

  // Modals state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Transitions
  const [isPendingSubject, startTransitionSubject] = useTransition();
  const [isPendingGoal, startTransitionGoal] = useTransition();
  const [isPendingTask, startTransitionTask] = useTransition();

  const filteredTasks = selectedSubjectId
    ? localTasks.filter((t) => t.subjectId === selectedSubjectId || !t.subjectId)
    : localTasks;

  let formattedDate = defaultDate;
  if (!formattedDate) {
    const localNow = new Date();
    const y = localNow.getFullYear();
    const m = String(localNow.getMonth() + 1).padStart(2, '0');
    const d = String(localNow.getDate()).padStart(2, '0');
    formattedDate = `${y}-${m}-${d}`;
  }

  async function handleCreateSubject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const code = fd.get('code') as string;
    startTransitionSubject(async () => {
      const res = await createSubjectInline(name, code);
      if (res.success && res.id && res.name) {
        setLocalSubjects((prev) => [...prev, { id: res.id!, name: res.name! }]);
        setSelectedSubjectId(res.id || '');
        setSubjectModalOpen(false);
      } else {
        alert(res.message);
      }
    });
  }

  async function handleCreateGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const targetDate = fd.get('targetDate') as string;
    startTransitionGoal(async () => {
      const res = await createGoalInline(title, targetDate);
      if (res.success && res.id && res.title) {
        setLocalGoals((prev) => [...prev, { id: res.id!, title: res.title! }]);
        setSelectedGoalId(res.id || '');
        setGoalModalOpen(false);
      } else {
        alert(res.message);
      }
    });
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    startTransitionTask(async () => {
      const res = await createTaskInline(title, selectedSubjectId);
      if (res.success && res.id && res.title) {
        setLocalTasks((prev) => [...prev, { id: res.id!, title: res.title!, subjectId: res.subjectId || null }]);
        setSelectedTaskId(res.id || '');
        setTaskModalOpen(false);
      } else {
        alert(res.message);
      }
    });
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="subjectId">Subject (Optional)</Label>
                  <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setSubjectModalOpen(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Create Subject
                  </Button>
                </div>
                <Select
                  name="subjectId"
                  value={selectedSubjectId || 'none'}
                  onValueChange={(val) => {
                     const v = val === 'none' ? '' : val;
                     setSelectedSubjectId(v || '');
                  }}
                >
                  <SelectTrigger id="subjectId">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General Study)</SelectItem>
                    {localSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="taskId">Related Task (Optional)</Label>
                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setTaskModalOpen(true)}>
                      <Plus className="w-3 h-3 mr-1" /> Create Task
                    </Button>
                  </div>
                  <Select
                    name="taskId"
                    value={selectedTaskId || 'none'}
                    onValueChange={(val) => setSelectedTaskId(val === 'none' ? '' : (val || ''))}
                  >
                    <SelectTrigger id="taskId">
                      <SelectValue
                        placeholder={filteredTasks.length === 0 ? 'No tasks available' : 'Select a task'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {filteredTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="goalId">Related Goal (Optional)</Label>
                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setGoalModalOpen(true)}>
                      <Plus className="w-3 h-3 mr-1" /> Create Goal
                    </Button>
                  </div>
                  <Select
                    name="goalId"
                    value={selectedGoalId || 'none'}
                    onValueChange={(val) => setSelectedGoalId(val === 'none' ? '' : (val || ''))}
                  >
                    <SelectTrigger id="goalId">
                      <SelectValue
                        placeholder={localGoals.length === 0 ? 'No goals available' : 'Select a goal'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {localGoals.map((g) => (
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

      <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subject</DialogTitle>
            <DialogDescription>Add a new subject to organize your studies.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-subject-name">Subject Name <span className="text-destructive">*</span></Label>
              <Input id="new-subject-name" name="name" required placeholder="e.g. Mathematics" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-subject-code">Subject Code (Optional)</Label>
              <Input id="new-subject-code" name="code" placeholder="e.g. MATH101" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubjectModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPendingSubject}>
                {isPendingSubject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Goal</DialogTitle>
            <DialogDescription>Set a new academic goal.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-goal-title">Goal Title <span className="text-destructive">*</span></Label>
              <Input id="new-goal-title" name="title" required placeholder="e.g. Improve Math GPA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-goal-date">Target Date (Optional)</Label>
              <Input id="new-goal-date" name="targetDate" type="date" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGoalModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPendingGoal}>
                {isPendingGoal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a specific task to complete.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-task-title">Task Title <span className="text-destructive">*</span></Label>
              <Input id="new-task-title" name="title" required placeholder="e.g. Complete Chapter 5 exercises" />
            </div>
            {selectedSubjectId ? (
              <p className="text-sm text-muted-foreground">This task will automatically be linked to the currently selected Subject.</p>
            ) : (
              <p className="text-sm text-muted-foreground">This task will not be linked to any specific Subject since none is selected.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPendingTask}>
                {isPendingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
