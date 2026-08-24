'use server';

import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function createSubjectInline(name: string, code: string) {
  const session = await verifySession();
  if (!name || name.trim() === '') {
    return { success: false, message: 'Subject name is required.' };
  }

  try {
    const subject = await db.subject.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        code: code ? code.trim() : null,
        status: 'ACTIVE'
      }
    });
    revalidatePath('/study-planner');
    revalidatePath('/study-planner/new');
    return { success: true, id: subject.id, name: subject.name };
  } catch (error) {
    console.error('Failed to create subject:', error);
    return { success: false, message: 'Failed to create subject.' };
  }
}

export async function createGoalInline(title: string, targetDate: string) {
  const session = await verifySession();
  if (!title || title.trim() === '') {
    return { success: false, message: 'Goal title is required.' };
  }

  try {
    const goal = await db.academicGoal.create({
      data: {
        userId: session.userId,
        title: title.trim(),
        deadline: targetDate ? new Date(targetDate) : null,
        status: 'NOT_STARTED'
      }
    });
    revalidatePath('/study-planner');
    revalidatePath('/study-planner/new');
    return { success: true, id: goal.id, title: goal.title };
  } catch (error) {
    console.error('Failed to create goal:', error);
    return { success: false, message: 'Failed to create goal.' };
  }
}

export async function createTaskInline(title: string, subjectId: string) {
  const session = await verifySession();
  if (!title || title.trim() === '') {
    return { success: false, message: 'Task title is required.' };
  }

  try {
    const task = await db.academicTask.create({
      data: {
        userId: session.userId,
        title: title.trim(),
        subjectId: subjectId || null,
        status: 'TODO'
      }
    });
    revalidatePath('/study-planner');
    revalidatePath('/study-planner/new');
    return { success: true, id: task.id, title: task.title, subjectId: task.subjectId };
  } catch (error) {
    console.error('Failed to create task:', error);
    return { success: false, message: 'Failed to create task.' };
  }
}
