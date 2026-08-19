'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { AcademicRecordSchema, type FormState } from '@/lib/validations';
import { getGradePoint } from '@/lib/grading';

export async function createAcademicRecord(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = AcademicRecordSchema.safeParse({
    subjectId: formData.get('subjectId'),
    semester: formData.get('semester'),
    academicYear: formData.get('academicYear'),
    creditHours: formData.get('creditHours'),
    grade: formData.get('grade'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { subjectId, semester, academicYear, creditHours, grade } = validatedFields.data;

  // Derive grade point server-side
  const gradePoint = getGradePoint(grade);
  if (gradePoint === null) {
    return { message: 'Invalid grade provided.' };
  }

  try {
    // 1. Verify subject belongs to user
    const subject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
    });

    if (!subject) {
      return { message: 'Invalid subject or unauthorized.' };
    }

    // 2. Prevent exact duplicates (retakes must be in different semester/year)
    const existing = await db.academicRecord.findFirst({
      where: {
        userId: session.userId,
        subjectId,
        semester,
        academicYear,
      },
    });

    if (existing) {
      return {
        message:
          'An academic record for this subject in the same semester and year already exists.',
      };
    }

    await db.academicRecord.create({
      data: {
        userId: session.userId,
        subjectId,
        semester,
        academicYear,
        creditHours,
        grade: grade.toUpperCase(),
        gradePoint,
      },
    });
  } catch (error) {
    return {
      message: 'An error occurred while adding the academic record.',
    };
  }

  revalidatePath('/academic-performance');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/academic-performance?toast=Record+saved+successfully.');
}

export async function updateAcademicRecord(
  id: string,
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await verifySession();

  const validatedFields = AcademicRecordSchema.safeParse({
    subjectId: formData.get('subjectId'),
    semester: formData.get('semester'),
    academicYear: formData.get('academicYear'),
    creditHours: formData.get('creditHours'),
    grade: formData.get('grade'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { subjectId, semester, academicYear, creditHours, grade } = validatedFields.data;

  const gradePoint = getGradePoint(grade);
  if (gradePoint === null) {
    return { message: 'Invalid grade provided.' };
  }

  try {
    // 1. Verify subject belongs to user
    const subject = await db.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
    });

    if (!subject) {
      return { message: 'Invalid subject or unauthorized.' };
    }

    // 2. Check for duplicate IF they changed the semester/year/subject
    const existing = await db.academicRecord.findFirst({
      where: {
        id: { not: id },
        userId: session.userId,
        subjectId,
        semester,
        academicYear,
      },
    });

    if (existing) {
      return {
        message:
          'An academic record for this subject in the same semester and year already exists.',
      };
    }

    const updated = await db.academicRecord.updateMany({
      where: { id: id, userId: session.userId },
      data: {
        subjectId,
        semester,
        academicYear,
        creditHours,
        grade: grade.toUpperCase(),
        gradePoint,
      },
    });

    if (updated.count === 0) {
      return { message: 'Record not found or access denied.' };
    }
  } catch (error) {
    return { message: 'An error occurred while updating the academic record.' };
  }

  revalidatePath('/academic-performance');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/academic-performance?toast=Record+saved+successfully.');
}

export async function deleteAcademicRecord(id: string) {
  const session = await verifySession();

  try {
    await db.academicRecord.deleteMany({
      where: { id: id, userId: session.userId },
    });
  } catch (error) {
    throw new Error('Failed to delete academic record.');
  }

  revalidatePath('/academic-performance');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/academic-performance?toast=Record+saved+successfully.');
}
