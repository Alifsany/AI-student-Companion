'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { TaskSchema, type FormState } from '@/lib/validations';
import { TaskPriority, TaskStatus } from '@/generated/prisma/client';

export async function createAssignment(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: 'ASSIGNMENT',
    dueDate: formData.get('dueDate'),
    priority: formData.get('priority'),
    status: formData.get('status'),
    subjectId: formData.get('subjectId'),
    taskId: formData.get('taskId'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors, message: 'Please check your inputs and try again.' };
  }

  const { title, description, dueDate, priority, status, subjectId, taskId } = validatedFields.data;

  if (subjectId) {
    const subject = await db.subject.findFirst({ where: { id: subjectId, userId: session.userId } });
    if (!subject) return { message: 'Invalid subject selected.' };
  }
  if (taskId) {
    const task = await db.academicTask.findFirst({ where: { id: taskId, userId: session.userId } });
    if (!task) return { message: 'Invalid task selected.' };
  }

  try {
    await db.academicTask.create({
      data: {
        userId: session.userId, title, description: description || null, type: 'ASSIGNMENT',
        dueDate: dueDate ? new Date(dueDate) : null, priority: priority as TaskPriority, status: status as TaskStatus,
        subjectId: subjectId || null, taskId: taskId || null,
      },
    });
  } catch { return { message: 'An error occurred while creating the assignment.' }; }

  revalidatePath('/assignments');
  revalidatePath('/dashboard');
  redirect('/assignments?toast=Assignment+saved+successfully.');
}

export async function updateAssignment(id: string, state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();
  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: 'ASSIGNMENT',
    dueDate: formData.get('dueDate'),
    priority: formData.get('priority'),
    status: formData.get('status'),
    subjectId: formData.get('subjectId'),
    taskId: formData.get('taskId'),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors, message: 'Please check your inputs and try again.' };
  }

  const { title, description, dueDate, priority, status, subjectId, taskId } = validatedFields.data;

  if (subjectId) {
    const subject = await db.subject.findFirst({ where: { id: subjectId, userId: session.userId } });
    if (!subject) return { message: 'Invalid subject selected.' };
  }
  if (taskId) {
    const task = await db.academicTask.findFirst({ where: { id: taskId, userId: session.userId } });
    if (!task) return { message: 'Invalid task selected.' };
  }

  try {
    const updated = await db.academicTask.updateMany({
      where: { id: id, userId: session.userId },
      data: {
        title, description: description || null, dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as TaskPriority, status: status as TaskStatus, subjectId: subjectId || null, taskId: taskId || null,
      },
    });
    if (updated.count === 0) return { message: 'Assignment not found or access denied.' };
  } catch { return { message: 'An error occurred while updating the assignment.' }; }

  revalidatePath('/assignments');
  revalidatePath('/dashboard');
  redirect('/assignments?toast=Assignment+saved+successfully.');
}

export async function toggleAssignmentStatus(id: string, newStatus: TaskStatus) {
  const session = await verifySession();
  try {
    await db.academicTask.updateMany({ where: { id: id, userId: session.userId }, data: { status: newStatus } });
  } catch { throw new Error('Failed to update status.'); }
  revalidatePath('/assignments');
  revalidatePath('/dashboard');
}

export async function deleteAssignment(id: string) {
  const session = await verifySession();
  try {
    await db.academicTask.deleteMany({ where: { id: id, userId: session.userId } });
  } catch { throw new Error('Failed to delete assignment.'); }
  revalidatePath('/assignments');
  revalidatePath('/dashboard');
}
