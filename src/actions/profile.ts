'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/dal';
import db from '@/lib/db';
import { EditProfileSchema, type FormState } from '@/lib/validations';

export async function updateProfile(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Verify the authenticated session
  const session = await verifySession();

  // 2. Validate submitted data with Zod
  const validatedFields = EditProfileSchema.safeParse({
    name: formData.get('name'),
    institution: formData.get('institution'),
    gradeLevel: formData.get('gradeLevel'),
    major: formData.get('major'),
    targetGpa: formData.get('targetGpa'),
    bio: formData.get('bio'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please check your inputs and try again.',
    };
  }

  const { name, institution, gradeLevel, major, targetGpa, bio } = validatedFields.data;

  // 3. Update ONLY the currently authenticated user's record
  try {
    await db.user.update({
      where: { id: session.userId },
      data: {
        name,
        institution,
        gradeLevel,
        major,
        targetGpa: targetGpa !== '' && targetGpa !== undefined ? Number(targetGpa) : null,
        bio: bio || null,
      },
    });
  } catch {
    return {
      message: 'An error occurred while updating your profile.',
    };
  }

  // 4. Revalidate /dashboard and redirect
  revalidatePath('/dashboard');
  redirect('/dashboard?toast=Profile+saved+successfully.');
}
