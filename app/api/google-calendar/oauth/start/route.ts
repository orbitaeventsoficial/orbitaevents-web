import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

function createState(secret: string): string {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('base64url');
  const payload = `${ts}:${nonce}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_OAUTH_REDIRECT_URI
    || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://orbitaevents.com'}/api/google-calendar/oauth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing Google OAuth configuration' },
      { status: 500 }
    );
  }

  const state = createState(clientSecret);
  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly');
  url.searchParams.set('state', state);
  url.searchParams.set('include_granted_scopes', 'true');

  return NextResponse.redirect(url.toString());
}
