'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { SubjectSchema, type FormState } from '@/lib/validations';

// ---------------------------------------------------------------------------
// Create Subject Action
// ---------------------------------------------------------------------------
export async function createSubject(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = SubjectSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code'),
    department: formData.get('department'),
    semester: formData.get('semester'),
    academicYear: formData.get('academicYear'),
    creditHours: formData.get('creditHours'),
    status: formData.get('status'),
    teacherName: formData.get('teacherName'),
    description: formData.get('description'),
    color: formData.get('color'),
    targetGoal: formData.get('targetGoal'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const {
    name,
    code,
    department,
    semester,
    academicYear,
    creditHours,
    status,
    teacherName,
    description,
    color,
    targetGoal,
  } = validatedFields.data;

  try {
    await db.subject.create({
      data: {
        userId: session.userId,
        name,
        code: code || null,
        department: department || null,
        semester: semester || null,
        academicYear: academicYear || null,
        creditHours: creditHours === '' ? null : Number(creditHours),
        status: status as 'ACTIVE' | 'ARCHIVED',
        teacherName: teacherName || null,
        description: description || null,
        color: color || null,
        targetGoal: targetGoal || null,
      },
    });
  } catch (error) {
    return {
      message: 'An error occurred while creating the subject.',
    };
  }

  revalidatePath('/subjects');
  revalidatePath('/dashboard');
  redirect('/subjects?toast=Subject+saved+successfully.');
}

// ---------------------------------------------------------------------------
// Update Subject Action
// ---------------------------------------------------------------------------
export async function updateSubject(
  id: string,
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = SubjectSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code'),
    department: formData.get('department'),
    semester: formData.get('semester'),
    academicYear: formData.get('academicYear'),
    creditHours: formData.get('creditHours'),
    status: formData.get('status'),
    teacherName: formData.get('teacherName'),
    description: formData.get('description'),
    color: formData.get('color'),
    targetGoal: formData.get('targetGoal'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const {
    name,
    code,
    department,
    semester,
    academicYear,
    creditHours,
    status,
    teacherName,
    description,
    color,
    targetGoal,
  } = validatedFields.data;

  try {
    // Verify ownership and update in a single operation
    const updated = await db.subject.updateMany({
      where: {
        id: id,
        userId: session.userId,
      },
      data: {
        name,
        code: code || null,
        department: department || null,
        semester: semester || null,
        academicYear: academicYear || null,
        creditHours: creditHours === '' ? null : Number(creditHours),
        status: status as 'ACTIVE' | 'ARCHIVED',
        teacherName: teacherName || null,
        description: description || null,
        color: color || null,
        targetGoal: targetGoal || null,
      },
    });

    if (updated.count === 0) {
      return { message: 'Subject not found or access denied.' };
    }
  } catch (error) {
    return {
      message: 'An error occurred while updating the subject.',
    };
  }

  revalidatePath('/subjects');
  revalidatePath('/dashboard');
  redirect('/subjects?toast=Subject+saved+successfully.');
}

// ---------------------------------------------------------------------------
// Delete Subject Action
// ---------------------------------------------------------------------------
export async function deleteSubject(id: string) {
  const session = await verifySession();

  try {
    // Verify ownership and delete
    await db.subject.deleteMany({
      where: {
        id: id,
        userId: session.userId,
      },
    });
  } catch (error) {
    throw new Error('Failed to delete subject.');
  }

  revalidatePath('/subjects');
  revalidatePath('/dashboard');
  redirect('/subjects?toast=Subject+saved+successfully.');
}

// ---------------------------------------------------------------------------
// Archive/Restore Subject Actions
// ---------------------------------------------------------------------------
export async function archiveSubject(id: string) {
  const session = await verifySession();

  try {
    await db.subject.updateMany({
      where: { id: id, userId: session.userId },
      data: { status: 'ARCHIVED' },
    });
    revalidatePath('/subjects');
    revalidatePath('/dashboard');
  } catch (error) {
    throw new Error('Failed to archive subject.');
  }
}

export async function restoreSubject(id: string) {
  const session = await verifySession();

  try {
    await db.subject.updateMany({
      where: { id: id, userId: session.userId },
      data: { status: 'ACTIVE' },
    });
    revalidatePath('/subjects');
    revalidatePath('/dashboard');
  } catch (error) {
    throw new Error('Failed to restore subject.');
  }
}
