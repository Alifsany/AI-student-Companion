'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { TaskSchema, type FormState } from '@/lib/validations';
import { TaskPriority, TaskStatus, TaskType } from '@/generated/prisma/client';

export async function createTask(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type') || 'STUDY',
    dueDate: formData.get('dueDate'),
    priority: formData.get('priority'),
    status: formData.get('status'),
    subjectId: formData.get('subjectId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { title, description, type, dueDate, priority, status, subjectId } = validatedFields.data;

  if (subjectId) {
    const subject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
    });
    if (!subject) {
      return { message: 'Invalid subject selected.' };
    }
  }

  try {
    await db.academicTask.create({
      data: {
        userId: session.userId,
        title,
        description: description || null,
        type: type as TaskType,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as TaskPriority,
        status: status as TaskStatus,
        subjectId: subjectId || null,
      },
    });
  } catch {
    return {
      message: 'An error occurred while creating the task.',
    };
  }

  revalidatePath('/tasks');
  revalidatePath('/assignments');
  revalidatePath('/dashboard');
  redirect('/tasks?toast=Task+saved+successfully.');
}

export async function updateTask(
  id: string,
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type') || 'STUDY',
    dueDate: formData.get('dueDate'),
    priority: formData.get('priority'),
    status: formData.get('status'),
    subjectId: formData.get('subjectId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { title, description, type, dueDate, priority, status, subjectId } = validatedFields.data;

  if (subjectId) {
    const subject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
    });
    if (!subject) {
      return { message: 'Invalid subject selected.' };
    }
  }

  try {
    const updated = await db.academicTask.updateMany({
      where: {
        id: id,
        userId: session.userId,
      },
      data: {
        title,
        description: description || null,
        type: type as TaskType,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as TaskPriority,
        status: status as TaskStatus,
        subjectId: subjectId || null,
      },
    });

    if (updated.count === 0) {
      return { message: 'Task not found or access denied.' };
    }
  } catch {
    return {
      message: 'An error occurred while updating the task.',
    };
  }

  revalidatePath('/tasks');
  revalidatePath('/assignments');
  revalidatePath('/dashboard');
  redirect('/tasks?toast=Task+saved+successfully.');
}

export async function toggleTaskStatus(id: string, newStatus: TaskStatus) {
  const session = await verifySession();

  try {
    await db.academicTask.updateMany({
      where: {
        id: id,
        userId: session.userId,
      },
      data: {
        status: newStatus,
      },
    });
  } catch {
    throw new Error('Failed to update status.');
  }

  revalidatePath('/tasks');
  revalidatePath('/assignments');
  revalidatePath('/dashboard');
}

export async function deleteTask(id: string) {
  const session = await verifySession();

  try {
    await db.academicTask.deleteMany({
      where: {
        id: id,
        userId: session.userId,
      },
    });
  } catch {
    throw new Error('Failed to delete task.');
  }

  revalidatePath('/tasks');
  revalidatePath('/assignments');
  revalidatePath('/dashboard');
}
