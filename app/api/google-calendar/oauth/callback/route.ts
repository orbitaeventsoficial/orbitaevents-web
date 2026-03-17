import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getAppBaseUrl } from '@/lib/site';
import {
  exchangeGoogleOAuthCode,
  upsertIntegrationSetting,
  upsertIntegrationSettings,
  verifyGoogleOAuthState,
} from '@/lib/services/googleOAuthService';

export const dynamic = 'force-dynamic';

const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_OAUTH_REDIRECT_URI
    || `${getAppBaseUrl()}/api/google-calendar/oauth/callback`;

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

  if (!code || !state || !verifyGoogleOAuthState(state, clientSecret)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid OAuth state' },
      { status: 400 }
    );
  }

  try {
    const tokenData = await exchangeGoogleOAuthCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    if (!accessToken) {
      throw new Error('No access token returned by Google');
    }
    if (refreshToken) {
      await upsertIntegrationSetting('integrations.googleCalendar.refreshToken', refreshToken, 'Google Calendar OAuth refresh token');
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

    const entries = [
      {
        key: 'integrations.googleCalendar.calendarId',
        value: calendarId,
        label: 'Google Calendar target calendar id',
      },
      {
        key: 'integrations.googleCalendar.connectedAt',
        value: new Date().toISOString(),
        label: 'Google Calendar connected timestamp',
      },
      ...(email
        ? [{
            key: 'integrations.googleCalendar.connectedEmail',
            value: email,
            label: 'Google Calendar connected account',
          }]
        : []),
    ];

    await upsertIntegrationSettings(entries);

    return NextResponse.redirect(new URL(successUrl, req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('Google Calendar OAuth callback error:', err as Error);
    return NextResponse.redirect(
      new URL(`/admin/settings/integrations?gcal=error&reason=${encodeURIComponent(message)}`, req.url)
    );
  }
}
