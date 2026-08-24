'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { StudySessionSchema, type FormState } from '@/lib/validations';

export async function startStudySession(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = StudySessionSchema.safeParse({
    subjectId: formData.get('subjectId'),
    taskId: formData.get('taskId'),
    type: formData.get('type'),
    plannedDuration: formData.get('plannedDuration'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { subjectId, taskId, type, plannedDuration, notes } = validatedFields.data;

  try {
    // 1. Prevent concurrent active sessions
    const activeSession = await db.studySession.findFirst({
      where: {
        userId: session.userId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });

    if (activeSession) {
      return { message: 'You already have an active study session.' };
    }

    // 2. Verify subject ownership if provided
    if (subjectId) {
      const subject = await db.subject.findFirst({
        where: { id: subjectId, userId: session.userId },
      });
      if (!subject) return { message: 'Invalid subject or unauthorized.' };
    }

    // 3. Verify task ownership if provided
    if (taskId) {
      const task = await db.academicTask.findFirst({
        where: { id: taskId, userId: session.userId },
      });
      if (!task) return { message: 'Invalid task or unauthorized.' };
    }

    // 4. Create the session
    const now = new Date();
    await db.studySession.create({
      data: {
        userId: session.userId,
        subjectId: subjectId || null,
        taskId: taskId || null,
        type: type === 'CUSTOM' ? 'CUSTOM' : 'POMODORO',
        plannedDuration,
        notes: notes || null,
        status: 'ACTIVE',
        startedAt: now,
        resumedAt: now,
        duration: 0,
      },
    });
  } catch (error) {
    return { message: 'An error occurred while starting the session.' };
  }

  revalidatePath('/study-sessions');
  revalidatePath('/dashboard');
  redirect('/study-sessions');
}

export async function pauseStudySession(id: string) {
  const session = await verifySession();

  try {
    const studySession = await db.studySession.findFirst({
      where: { id, userId: session.userId, status: 'ACTIVE' },
    });

    if (!studySession) {
      throw new Error('Active session not found or unauthorized.');
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - studySession.resumedAt.getTime()) / 1000);
    const newDuration = studySession.duration + Math.max(0, elapsedSeconds);

    await db.studySession.update({
      where: { id },
      data: {
        status: 'PAUSED',
        duration: newDuration,
      },
    });
  } catch (error) {
    console.error(error);
  }

  revalidatePath('/study-sessions');
}

export async function resumeStudySession(id: string) {
  const session = await verifySession();

  try {
    const studySession = await db.studySession.findFirst({
      where: { id, userId: session.userId, status: 'PAUSED' },
    });

    if (!studySession) {
      throw new Error('Paused session not found or unauthorized.');
    }

    await db.studySession.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        resumedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(error);
  }

  revalidatePath('/study-sessions');
}

export async function completeStudySession(id: string) {
  const session = await verifySession();

  try {
    const studySession = await db.studySession.findFirst({
      where: { id, userId: session.userId, status: { in: ['ACTIVE', 'PAUSED'] } },
      include: { studyPlanItem: true },
    });

    if (!studySession) {
      throw new Error('Session not found or unauthorized.');
    }

    const now = new Date();
    let finalDuration = studySession.duration;

    if (studySession.status === 'ACTIVE') {
      const elapsedSeconds = Math.floor((now.getTime() - studySession.resumedAt.getTime()) / 1000);
      finalDuration += Math.max(0, elapsedSeconds);
    }

    await db.studySession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        duration: finalDuration,
        endedAt: now,
      },
    });

    // Auto-update StudyPlanItem completion logic
    if (studySession.studyPlanItemId && studySession.studyPlanItem) {
      // Find all completed sessions for this plan item
      const allSessionsForPlan = await db.studySession.findMany({
        where: { studyPlanItemId: studySession.studyPlanItemId, status: 'COMPLETED' },
      });

      const totalStudied = allSessionsForPlan.reduce((acc, s) => acc + s.duration, 0);

      // If total studied meets or exceeds planned duration, mark COMPLETED
      // Otherwise keep/mark IN_PROGRESS
      const newStatus =
        totalStudied >= studySession.studyPlanItem.plannedDuration ? 'COMPLETED' : 'IN_PROGRESS';

      await db.studyPlanItem.update({
        where: { id: studySession.studyPlanItemId },
        data: { status: newStatus },
      });
    }
  } catch (error) {
    console.error(error);
  }

  revalidatePath('/study-sessions');
  revalidatePath('/study-planner');
  revalidatePath('/dashboard');
  redirect(`/study-sessions/completed/${id}`);
}

export async function cancelStudySession(id: string) {
  const session = await verifySession();

  try {
    const studySession = await db.studySession.findFirst({
      where: { id, userId: session.userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });

    if (!studySession) {
      throw new Error('Session not found or unauthorized.');
    }

    await db.studySession.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(error);
  }

  revalidatePath('/study-sessions');
  revalidatePath('/dashboard');
}
