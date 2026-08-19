'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { GoalSchema, type FormState } from '@/lib/validations';
import { GoalStatus, GoalType } from '@/generated/prisma/client';

export async function createGoal(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = GoalSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    targetValue: formData.get('targetValue'),
    deadline: formData.get('deadline'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to create goal. Please check the fields.',
    };
  }

  const { title, description, type, targetValue, deadline, status } = validatedFields.data;

  try {
    await db.academicGoal.create({
      data: {
        userId: session.userId,
        title,
        description: description || null,
        type: type as GoalType,
        targetValue: targetValue || null,
        deadline: deadline ? new Date(deadline) : null,
        status: status as GoalStatus,
      },
    });
  } catch (error) {
    console.error('Failed to create goal:', error);
    return { message: 'Failed to create goal. A database error occurred.' };
  }

  revalidatePath('/goals');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/goals?toast=Goal+saved+successfully.');
}

export async function updateGoal(
  id: string,
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = GoalSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    targetValue: formData.get('targetValue'),
    deadline: formData.get('deadline'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Failed to update goal. Please check the fields.',
    };
  }

  const { title, description, type, targetValue, deadline, status } = validatedFields.data;

  try {
    const existing = await db.academicGoal.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      return { message: 'Unauthorized. You cannot modify this goal.' };
    }

    await db.academicGoal.update({
      where: { id },
      data: {
        title,
        description: description || null,
        type: type as GoalType,
        targetValue: targetValue || null,
        deadline: deadline ? new Date(deadline) : null,
        status: status as GoalStatus,
      },
    });
  } catch (error) {
    console.error('Failed to update goal:', error);
    return { message: 'Failed to update goal. A database error occurred.' };
  }

  revalidatePath('/goals');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/goals?toast=Goal+saved+successfully.');
}

export async function deleteGoal(id: string) {
  const session = await verifySession();

  try {
    const existing = await db.academicGoal.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      throw new Error('Unauthorized');
    }

    await db.academicGoal.delete({
      where: { id },
    });

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    revalidatePath('/profile');
  } catch (error) {
    console.error('Failed to delete goal:', error);
    throw new Error('Failed to delete goal');
  }
}

export async function completeGoal(id: string) {
  const session = await verifySession();

  try {
    const existing = await db.academicGoal.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.userId) {
      throw new Error('Unauthorized');
    }

    await db.academicGoal.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    revalidatePath('/goals');
    revalidatePath('/dashboard');
    revalidatePath('/profile');
  } catch (error) {
    console.error('Failed to complete goal:', error);
    throw new Error('Failed to complete goal');
  }
}
