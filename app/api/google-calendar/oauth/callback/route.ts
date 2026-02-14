import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const STATE_TTL_SECONDS = 10 * 60;

function verifyState(state: string, secret: string): boolean {
  const parts = state.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const [tsPart, nonce] = payload.split(':');
  const ts = Number(tsPart);
  if (!nonce) return false;
  if (!Number.isFinite(ts)) return false;
  const age = Math.floor(Date.now() / 1000) - ts;
  if (age < 0 || age > STATE_TTL_SECONDS) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
};

async function upsertSetting(key: string, value: string, label: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value, type: 'STRING', category: 'integrations', label },
    create: { key, value, type: 'STRING', category: 'integrations', label },
  });
}

export async function GET(req: NextRequest) {
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

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const successUrl = '/admin/settings/integrations?gcal=connected';

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/settings/integrations?gcal=error&reason=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state || !verifyState(state, clientSecret)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid OAuth state' },
      { status: 400 }
    );
  }

  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Token exchange failed: ${text}`);
    }

    const tokenData = (await tokenRes.json()) as TokenResponse;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    if (!accessToken) {
      throw new Error('No access token returned by Google');
    }
    if (refreshToken) {
      await upsertSetting('integrations.googleCalendar.refreshToken', refreshToken, 'Google Calendar OAuth refresh token');
    }

    const listRes = await fetch(CALENDAR_LIST_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listRes.ok) {
      const text = await listRes.text();
      throw new Error(`Calendar list failed: ${text}`);
    }
    const listData = await listRes.json().catch(() => ({} as Record<string, unknown>));
    const items = Array.isArray((listData as { items?: unknown[] }).items)
      ? ((listData as { items: unknown[] }).items as Array<Record<string, unknown>>)
      : [];
    const primary = items.find((it) => it?.primary === true) || items[0];
    const calendarId = typeof primary?.id === 'string' ? primary.id : 'primary';
    const email = typeof primary?.accessRole === 'string' && typeof primary?.summary === 'string'
      ? primary.summary
      : null;

    await Promise.all([
      upsertSetting('integrations.googleCalendar.calendarId', calendarId, 'Google Calendar target calendar id'),
      upsertSetting('integrations.googleCalendar.connectedAt', new Date().toISOString(), 'Google Calendar connected timestamp'),
      email
        ? upsertSetting('integrations.googleCalendar.connectedEmail', email, 'Google Calendar connected account')
        : Promise.resolve(),
    ]);

    return NextResponse.redirect(new URL(successUrl, req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('Google Calendar OAuth callback error:', err as Error);
    return NextResponse.redirect(
      new URL(`/admin/settings/integrations?gcal=error&reason=${encodeURIComponent(message)}`, req.url)
    );
  }
}
