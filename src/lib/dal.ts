import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

// ---------------------------------------------------------------------------
// Safe User type — never exposes passwordHash or OAuth tokens
// ---------------------------------------------------------------------------
export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  onboardingCompleted: boolean;
  institution: string | null;
  gradeLevel: string | null;
  major: string | null;
  targetGpa: number | null;
  bio: string | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// verifySession — memoized per-request via React cache
// Redirects to /login if the session is missing or expired.
// ---------------------------------------------------------------------------
export const verifySession = cache(
  async (): Promise<{ isAuth: true; userId: string; role: string }> => {
    const session = await getSession();

    if (!session?.userId) {
      redirect('/login');
    }

    return { isAuth: true, userId: session.userId, role: session.role };
  },
);

// ---------------------------------------------------------------------------
// getCurrentUser — fetches safe user fields from DB, memoized per-request.
// Returns null if the user is not found (e.g. deleted account).
// NEVER returns passwordHash, refresh_token, access_token, or id_token.
// ---------------------------------------------------------------------------
export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const session = await getSession();
  if (!session?.userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        onboardingCompleted: true,
        institution: true,
        gradeLevel: true,
        major: true,
        targetGpa: true,
        bio: true,
        createdAt: true,
        // passwordHash intentionally excluded
        // accounts/sessions intentionally excluded
      },
    });
    return user;
  } catch {
    return null;
  }
});

// ---------------------------------------------------------------------------
// Helper: Calculate Profile Completion
// ---------------------------------------------------------------------------
export function getProfileCompletion(user: SafeUser): number {
  const fields = [
    'name',
    'bio',
    'institution',
    'gradeLevel',
    'major',
    'targetGpa',
    'image',
  ] as const;
  let filled = 0;

  fields.forEach((field) => {
    if (user[field] !== null && user[field] !== undefined && user[field] !== '') {
      filled += 1;
    }
  });

  return Math.round((filled / fields.length) * 100);
}
