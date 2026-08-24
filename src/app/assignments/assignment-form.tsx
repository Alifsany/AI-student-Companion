
'use client';

import { useActionState, useState, useTransition } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type FormState } from '@/lib/validations';
import { AlertCircle, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import type { AcademicTask } from '@/generated/prisma/client';
import { createTaskInline, createSubjectInline } from '@/actions/study-planner-inline';

type SubjectOption = {
  id: string;
  name: string;
};

type TaskOption = {
  id: string;
  title: string;
  subjectId: string | null;
};

type AssignmentFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  subjects: SubjectOption[];
  tasks?: TaskOption[];
  initialData?: AcademicTask & { taskId?: string | null };
};

export function AssignmentForm({ action, subjects, tasks = [], initialData }: AssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  // Format date for the input field (YYYY-MM-DD)
  const defaultDate = initialData?.dueDate
    ? new Date(initialData.dueDate).toISOString().split('T')[0]
    : '';

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialData?.subjectId || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialData?.taskId || '');
  
  const [localTasks, setLocalTasks] = useState<TaskOption[]>(tasks);
  const [localSubjects, setLocalSubjects] = useState<SubjectOption[]>(subjects);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [isPendingSubject, startTransitionSubject] = useTransition();
  const [subjectError, setSubjectError] = useState<string>('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isPendingTask, startTransitionTask] = useTransition();
  const [taskError, setTaskError] = useState<string>('');

  const filteredTasks = selectedSubjectId
    ? localTasks.filter((t) => t.subjectId === selectedSubjectId || !t.subjectId)
    : localTasks;

  // Clear task if it doesn't belong to the newly selected subject
  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    if (newSubjectId && selectedTaskId) {
      const task = localTasks.find(t => t.id === selectedTaskId);
      if (task && task.subjectId && task.subjectId !== newSubjectId) {
        setSelectedTaskId('');
      }
    }
  };

  async function handleCreateSubject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubjectError('');
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string).trim();
    const code = (fd.get('code') as string).trim();
    
    if (!name) {
      setSubjectError('Subject name is required.');
      return;
    }

    startTransitionSubject(async () => {
      const res = await createSubjectInline(name, code);
      if (res.success && res.id && res.name) {
        setLocalSubjects((prev) => [...prev, { id: res.id!, name: res.name! }]);
        setSelectedSubjectId(res.id);
        setSubjectModalOpen(false);
      } else {
        setSubjectError(res.message || "Unknown error");
      }
    });
  }

  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTaskError('');
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string).trim();
    
    if (!title) {
      setTaskError('Task title is required.');
      return;
    }

    startTransitionTask(async () => {
      const res = await createTaskInline(title, selectedSubjectId);
      if (res.success && res.id && res.title) {
        setLocalTasks((prev) => [...prev, { id: res.id!, title: res.title!, subjectId: res.subjectId || null }]);
        setSelectedTaskId(res.id || '');
        setTaskModalOpen(false);
      } else {
        setTaskError(res.message || "Unknown error");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/assignments"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assignments
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            {initialData?.id ? 'Edit Assignment' : 'New Assignment'}
          </CardTitle>
          <CardDescription>
            {initialData?.id
              ? 'Update the details for this assignment.'
              : 'Add a new assignment, project, or task to keep track of.'}
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
              <div className="space-y-2">
                <Label htmlFor="title">
                  Assignment Title <span className="text-destructive">*</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="subjectId">Subject</Label>
                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setSubjectModalOpen(true)}>
                      <Plus className="w-3 h-3 mr-1" /> Create Subject
                    </Button>
                  </div>
                  <Select
                    name="subjectId"
                    value={selectedSubjectId || 'none'}
                    onValueChange={(val) => handleSubjectChange(val === 'none' ? '' : (val || ''))}
                  >
                    <SelectTrigger id="subjectId">
                      <SelectValue placeholder="No specific subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific subject</SelectItem>
                      {localSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state?.errors?.subjectId && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.subjectId[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="taskId">Task / Related Task</Label>
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
                  {state?.errors?.taskId && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.taskId[0]}
                    </p>
                  )}
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue={initialData?.priority || 'MEDIUM'}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {state?.errors?.priority && (
                    <p className="text-xs font-medium text-destructive">
                      {state.errors.priority[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={initialData?.status || 'PENDING'}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending (Not Started)</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
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
            <Link href="/assignments" className={buttonVariants({ variant: 'outline' })}>
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
                  ? 'Update Assignment'
                  : 'Create Assignment'}
            </button>
          </CardFooter>
        </form>
      </Card>

      {/* Task Creation Modal */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a task to organize your academic work.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
            {taskError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="inline-task-title">Task Title <span className="text-destructive">*</span></Label>
              <Input
                id="inline-task-title"
                name="title"
                placeholder="e.g. Complete Chapter 5 exercises"
                autoFocus
                disabled={isPendingTask}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                {selectedSubjectId
                  ? localSubjects.find(s => s.id === selectedSubjectId)?.name || 'Unknown'
                  : 'No subject selected (General task)'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The task will be linked to the currently selected subject.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaskModalOpen(false)}
                disabled={isPendingTask}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPendingTask}>
                {isPendingTask ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subject Creation Modal */}
      <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subject</DialogTitle>
            <DialogDescription>Add a new subject to organize your studies.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubject} className="space-y-4 pt-4">
            {subjectError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{subjectError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="inline-subject-name">Subject Name <span className="text-destructive">*</span></Label>
              <Input
                id="inline-subject-name"
                name="name"
                placeholder="e.g. Mathematics"
                autoFocus
                disabled={isPendingSubject}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inline-subject-code">Subject Code (Optional)</Label>
              <Input
                id="inline-subject-code"
                name="code"
                placeholder="e.g. MATH101"
                disabled={isPendingSubject}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubjectModalOpen(false)}
                disabled={isPendingSubject}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPendingSubject}>
                {isPendingSubject ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Subject'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
