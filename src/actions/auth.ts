'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { createSession, deleteSession } from '@/lib/session';
import { SignUpSchema, SignInSchema, type FormState } from '@/lib/validations';

const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------
export async function signUp(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate
  const validated = SignUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  // 2. Check for duplicate email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ['An account with this email already exists.'] } };
  }

  // 3. Hash password — never store plaintext
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 4. Create user
  const user = await db.user.create({
    data: { name, email, passwordHash },
    select: { id: true, role: true },
  });

  // 5. Create session
  await createSession(user.id, user.role);

  // 6. Redirect
  redirect('/dashboard');
}

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------
export async function signIn(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate
  const validated = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  // 2. Find user — always compare hash to prevent timing attacks
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });

  // 3. Use constant-time comparison regardless of whether user exists
  //    This prevents email enumeration via timing differences.
  const dummyHash = '$2b$12$invalidhashforenumerationprotectionXXXXXXXXXXXXXXXXXXXXX';
  const hashToCompare = user?.passwordHash ?? dummyHash;

  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.passwordHash || !passwordMatch) {
    // Deliberately vague error to prevent enumeration
    return { message: 'Invalid email or password.' };
  }

  // 4. Create session
  await createSession(user.id, user.role);

  // 5. Redirect
  redirect('/dashboard');
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
