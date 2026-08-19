'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { OnboardingSchema, type FormState } from '@/lib/validations';

export async function submitOnboarding(state: FormState, formData: FormData): Promise<FormState> {
  const session = await verifySession();

  // Parse fields
  const targetGpa = formData.get('targetGpa');

  const validatedFields = OnboardingSchema.safeParse({
    institution: formData.get('institution'),
    gradeLevel: formData.get('gradeLevel'),
    major: formData.get('major'),
    targetGpa: targetGpa ? Number(targetGpa) : undefined,
    bio: formData.get('bio'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { institution, gradeLevel, major, targetGpa: parsedGpa, bio } = validatedFields.data;

  try {
    await db.user.update({
      where: { id: session.userId },
      data: {
        institution,
        gradeLevel,
        major,
        targetGpa: parsedGpa === '' ? null : parsedGpa,
        bio,
        onboardingCompleted: true,
      },
    });
  } catch (error) {
    console.error('Failed to submit onboarding:', error);
    return {
      message: 'Failed to update profile. Please try again later.',
    };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
