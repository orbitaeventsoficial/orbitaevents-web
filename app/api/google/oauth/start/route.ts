import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'Missing Google OAuth configuration' },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const nextUrl = req.nextUrl.searchParams.get('next') || '/admin/ressenyes?google=connected';

  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage');
  url.searchParams.set('state', state);
  url.searchParams.set('include_granted_scopes', 'true');

  const response = NextResponse.redirect(url.toString());
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/api/google/oauth/callback',
  });
  response.cookies.set('google_oauth_next', nextUrl, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/api/google/oauth/callback',
  });

  return response;
}
