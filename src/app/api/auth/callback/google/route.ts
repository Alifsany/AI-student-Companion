import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=invalid_request', req.url));
  }

  // Validate state
  const storedState = req.cookies.get('oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const authUrl = process.env.AUTH_URL;

  if (!clientId || !clientSecret || !authUrl) {
    return NextResponse.redirect(new URL('/login?error=server_configuration_error', req.url));
  }

  const redirectUri = `${authUrl}/api/auth/callback/google`;

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token, expires_in, scope, token_type, refresh_token } = tokenData;

    // 2. Fetch user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();
    const email = profile.email.toLowerCase();

    // 3. Find or Create User and Account
    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create a new user without a password
      user = await db.user.create({
        data: {
          email,
          name: profile.name || null,
          image: profile.picture || null,
          emailVerified: profile.verified_email ? new Date() : null,
        },
      });
    } else {
      // Optional: update user's name/image if empty
      if (!user.name && profile.name) {
        user = await db.user.update({
          where: { id: user.id },
          data: { name: profile.name, image: profile.picture || user.image },
        });
      }
    }

    // Upsert the OAuth account linking
    await db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.id,
        },
      },
      update: {
        access_token,
        id_token,
        refresh_token: refresh_token || undefined,
        expires_at: expires_in ? Math.floor(Date.now() / 1000) + expires_in : null,
        scope,
        token_type,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: profile.id,
        access_token,
        id_token,
        refresh_token,
        expires_at: expires_in ? Math.floor(Date.now() / 1000) + expires_in : null,
        scope,
        token_type,
      },
    });

    // 4. Create the application session
    await createSession(user.id, user.role);

    // 5. Clean up the oauth_state cookie
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url));
  }
}
