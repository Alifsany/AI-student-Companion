'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { TaskSchema, type FormState } from '@/lib/validations';
import { TaskPriority, TaskStatus } from '@/generated/prisma/client';

// ---------------------------------------------------------------------------
// Create Assignment Action
// ---------------------------------------------------------------------------
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
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { title, description, dueDate, priority, status, subjectId } = validatedFields.data;

  // If a subjectId is provided, verify the user owns it
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
        type: 'ASSIGNMENT', // Compatibility layer sets type automatically
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as TaskPriority,
        status: status as TaskStatus,
        subjectId: subjectId || null,
      },
    });
  } catch {
    return {
      message: 'An error occurred while creating the assignment.',
    };
  }

  revalidatePath('/assignments');
  revalidatePath('/dashboard');
  redirect('/assignments?toast=Assignment+saved+successfully.');
}

// ---------------------------------------------------------------------------
// Update Assignment Action
// ---------------------------------------------------------------------------
export async function updateAssignment(
  id: string,
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = TaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: 'ASSIGNMENT',
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

  const { title, description, dueDate, priority, status, subjectId } = validatedFields.data;

  // If a subjectId is provided, verify the user owns it
  if (subjectId) {
    const subject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
    });
    if (!subject) {
      return { message: 'Invalid subject selected.' };
    }
  }

  try {
    // Verify ownership and update in a single operation
    const updated = await db.academicTask.updateMany({
      where: {
        id: id,
        userId: session.userId,
      },
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as TaskPriority,
        status: status as TaskStatus,
        subjectId: subjectId || null,
      },
    });

    if (updated.count === 0) {
      return { message: 'Assignment not found or access denied.' };
    }
  } catch {
    return {
      message: 'An error occurred while updating the assignment.',
    };
  }

  revalidatePath('/assignments');
  revalidatePath('/dashboard');
  redirect('/assignments?toast=Assignment+saved+successfully.');
}

// ---------------------------------------------------------------------------
// Toggle Assignment Status Action
// ---------------------------------------------------------------------------
export async function toggleAssignmentStatus(id: string, newStatus: TaskStatus) {
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

  revalidatePath('/assignments');
  revalidatePath('/dashboard');
}

// ---------------------------------------------------------------------------
// Delete Assignment Action
// ---------------------------------------------------------------------------
export async function deleteAssignment(id: string) {
  const session = await verifySession();

  try {
    // Verify ownership and delete
    await db.academicTask.deleteMany({
      where: {
        id: id,
        userId: session.userId,
      },
    });
  } catch {
    throw new Error('Failed to delete assignment.');
  }

  revalidatePath('/assignments');
  revalidatePath('/dashboard');
}
