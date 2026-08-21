'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { type FormState } from '@/lib/validations';

type Subject = { id: string; name: string };
type Task = { id: string; title: string; subjectId: string | null };

type SessionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  subjects: Subject[];
  tasks: Task[];
};

export function SessionForm({ action, subjects, tasks }: SessionFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const filteredTasks = selectedSubjectId
    ? tasks.filter((t) => t.subjectId === selectedSubjectId || !t.subjectId)
    : tasks;

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <Link
        href="/study-sessions"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Study Dashboard
      </Link>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Start Study Session</CardTitle>
          <CardDescription>Configure your focus time.</CardDescription>
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
                <Label htmlFor="subjectId">Subject (Optional)</Label>
                <Select
                  name="subjectId"
                  onValueChange={(val) => setSelectedSubjectId(val as string)}
                >
                  <SelectTrigger id="subjectId">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (General Study)</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskId">Academic Task (Optional)</Label>
                <Select name="taskId" disabled={filteredTasks.length === 0}>
                  <SelectTrigger id="taskId">
                    <SelectValue
                      placeholder={
                        filteredTasks.length === 0 ? 'No tasks available' : 'Select a task'
                      }
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Session Type</Label>
                  <Select name="type" defaultValue="POMODORO">
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POMODORO">Pomodoro Focus</SelectItem>
                      <SelectItem value="CUSTOM">Custom Timer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plannedDuration">Duration</Label>
                  <Select name="plannedDuration" defaultValue="1500">
                    <SelectTrigger id="plannedDuration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="900">15 Minutes (Short)</SelectItem>
                      <SelectItem value="1500">25 Minutes (Standard)</SelectItem>
                      <SelectItem value="2700">45 Minutes (Long)</SelectItem>
                      <SelectItem value="3600">60 Minutes (Deep Work)</SelectItem>
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
                <Label htmlFor="notes">Notes / Intentions (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="What is your goal for this session?"
                  className="resize-none"
                />
                {state?.errors?.notes && (
                  <p className="text-xs font-medium text-destructive">{state.errors.notes[0]}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4 flex justify-end gap-3">
            <Link href="/study-sessions" className={buttonVariants({ variant: 'outline' })}>
              Cancel
            </Link>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Clock className="h-4 w-4" />
              {isPending ? 'Starting...' : 'Start Session'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
