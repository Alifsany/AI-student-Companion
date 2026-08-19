'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { StudyPlanSchema, type FormState } from '@/lib/validations';

export async function createStudyPlan(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = StudyPlanSchema.safeParse({
    title: formData.get('title'),
    subjectId: formData.get('subjectId'),
    taskId: formData.get('taskId'),
    goalId: formData.get('goalId'),
    plannedDate: formData.get('plannedDate'),
    plannedDuration: formData.get('plannedDuration'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { title, subjectId, taskId, goalId, plannedDate, plannedDuration, description } =
    validatedFields.data;

  try {
    // Verify subject ownership
    if (subjectId) {
      const subject = await db.subject.findFirst({
        where: { id: subjectId, userId: session.userId },
      });
      if (!subject) return { message: 'Invalid subject or unauthorized.' };
    }

    // Verify task ownership
    if (taskId) {
      const task = await db.academicTask.findFirst({
        where: { id: taskId, userId: session.userId },
      });
      if (!task) return { message: 'Invalid task or unauthorized.' };
    }

    // Verify goal ownership
    if (goalId) {
      const goal = await db.academicGoal.findFirst({
        where: { id: goalId, userId: session.userId },
      });
      if (!goal) return { message: 'Invalid goal or unauthorized.' };
    }

    // We want plannedDate to act as the YYYY-MM-DD boundary.
    // We parse it natively as UTC to avoid local timezone drifts on the boundary.
    const dateBoundary = new Date(plannedDate);

    await db.studyPlanItem.create({
      data: {
        userId: session.userId,
        title,
        subjectId: subjectId || null,
        taskId: taskId || null,
        goalId: goalId || null,
        plannedDate: dateBoundary,
        plannedDuration,
        description: description || null,
        status: 'PLANNED',
      },
    });
  } catch (error) {
    return { message: 'An error occurred while creating the plan.' };
  }

  revalidatePath('/study-planner');
  revalidatePath('/dashboard');
  redirect('/study-planner');
}

export async function updateStudyPlan(
  id: string,
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = StudyPlanSchema.safeParse({
    title: formData.get('title'),
    subjectId: formData.get('subjectId'),
    taskId: formData.get('taskId'),
    goalId: formData.get('goalId'),
    plannedDate: formData.get('plannedDate'),
    plannedDuration: formData.get('plannedDuration'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { title, subjectId, taskId, goalId, plannedDate, plannedDuration, description } =
    validatedFields.data;

  try {
    const existing = await db.studyPlanItem.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return { message: 'Plan item not found or unauthorized.' };
    }

    if (subjectId && subjectId !== existing.subjectId) {
      const subject = await db.subject.findFirst({
        where: { id: subjectId, userId: session.userId },
      });
      if (!subject) return { message: 'Invalid subject or unauthorized.' };
    }

    if (taskId && taskId !== existing.taskId) {
      const task = await db.academicTask.findFirst({
        where: { id: taskId, userId: session.userId },
      });
      if (!task) return { message: 'Invalid task or unauthorized.' };
    }

    if (goalId && goalId !== existing.goalId) {
      const goal = await db.academicGoal.findFirst({
        where: { id: goalId, userId: session.userId },
      });
      if (!goal) return { message: 'Invalid goal or unauthorized.' };
    }

    const dateBoundary = new Date(plannedDate);

    await db.studyPlanItem.update({
      where: { id },
      data: {
        title,
        subjectId: subjectId || null,
        taskId: taskId || null,
        goalId: goalId || null,
        plannedDate: dateBoundary,
        plannedDuration,
        description: description || null,
      },
    });
  } catch (error) {
    return { message: 'An error occurred while updating the plan.' };
  }

  revalidatePath('/study-planner');
  revalidatePath('/dashboard');
  redirect('/study-planner');
}

export async function deleteStudyPlan(id: string) {
  const session = await verifySession();

  try {
    await db.studyPlanItem.deleteMany({
      where: { id, userId: session.userId },
    });
  } catch (error) {
    console.error('Failed to delete study plan:', error);
  }

  revalidatePath('/study-planner');
  revalidatePath('/dashboard');
}

export async function updateStudyPlanStatus(
  id: string,
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED',
) {
  const session = await verifySession();

  try {
    const existing = await db.studyPlanItem.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) throw new Error('Plan item not found or unauthorized.');

    await db.studyPlanItem.update({
      where: { id },
      data: { status },
    });
  } catch (error) {
    console.error('Failed to update study plan status:', error);
  }

  revalidatePath('/study-planner');
  revalidatePath('/dashboard');
}

export async function startSessionFromPlan(planId: string) {
  const session = await verifySession();

  try {
    const plan = await db.studyPlanItem.findFirst({
      where: { id: planId, userId: session.userId },
    });

    if (!plan) return { message: 'Plan item not found or unauthorized.' };

    // Prevent concurrent active sessions
    const activeSession = await db.studySession.findFirst({
      where: {
        userId: session.userId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });

    if (activeSession) {
      return {
        message: 'You already have an active study session. Please complete or cancel it first.',
      };
    }

    const now = new Date();

    // Create actual session linked to plan
    await db.studySession.create({
      data: {
        userId: session.userId,
        subjectId: plan.subjectId,
        taskId: plan.taskId,
        type: 'POMODORO', // default
        plannedDuration: plan.plannedDuration,
        notes: plan.title,
        status: 'ACTIVE',
        startedAt: now,
        resumedAt: now,
        duration: 0,
        studyPlanItemId: plan.id,
      },
    });

    // Mark plan as IN_PROGRESS
    if (plan.status === 'PLANNED' || plan.status === 'SKIPPED') {
      await db.studyPlanItem.update({
        where: { id: plan.id },
        data: { status: 'IN_PROGRESS' },
      });
    }
  } catch (error) {
    return { message: 'An error occurred while starting the session.' };
  }

  revalidatePath('/study-sessions');
  revalidatePath('/study-planner');
  redirect('/study-sessions');
}
