import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// ---------------------------------------------------------------------------
// Route groups
// ---------------------------------------------------------------------------
const protectedRoutes = [
  '/dashboard',
  '/onboarding',
  '/profile',
  '/subjects',
  '/tasks',
  '/assignments',
  '/goals',
  '/academic-performance',
  '/study',
  '/study-sessions',
  '/study-planner',
  '/study-analytics',
  '/quiz',
  '/progress',
  '/ai-tutor',
  '/achievements',
  '/settings',
];

const authRoutes = ['/login', '/register'];

// ---------------------------------------------------------------------------
// Proxy — Next.js 16 (replaces deprecated middleware.ts)
// Performs optimistic cookie-based checks only — no DB queries here.
// ---------------------------------------------------------------------------
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  const isAuthRoute = authRoutes.includes(path);

  // Decode session from cookie — no DB call, optimistic check only
  const token = req.cookies.get('session')?.value;
  const session = await decrypt(token);
  const isAuthenticated = !!session?.userId;

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Config — run proxy on all routes except Next.js internals and static assets
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
