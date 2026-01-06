import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
const LOCATION_API = 'https://businessprofile.googleapis.com/v1';

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

async function upsertSetting(key: string, value: string, label: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value, type: 'STRING', category: 'integrations', label },
    create: { key, value, type: 'STRING', category: 'integrations', label },
  });
}

async function fetchJson(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: 'Missing Google OAuth configuration' },
      { status: 500 }
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const cookieState = req.cookies.get('google_oauth_state')?.value;
  const nextUrl = req.cookies.get('google_oauth_next')?.value || '/admin/ressenyes?google=connected';

  if (error) {
    return NextResponse.redirect(new URL(`/admin/ressenyes?google=error&reason=${encodeURIComponent(error)}`, req.url));
  }

  if (!code || !state || !cookieState || state !== cookieState) {
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
      await upsertSetting('integrations.google.refreshToken', refreshToken, 'Google OAuth refresh token');
    }

    const accounts = await fetchJson(ACCOUNT_API, accessToken);
    const accountName = accounts?.accounts?.[0]?.name;

    if (!accountName) {
      throw new Error('No Google Business accounts found');
    }

    const locations = await fetchJson(`${LOCATION_API}/${accountName}/locations?readMask=name,title`, accessToken);
    const firstLocation = locations?.locations?.[0];
    const locationName = firstLocation?.name;

    if (!locationName) {
      throw new Error('No locations found in Google Business Profile');
    }

    const accountId = accountName.split('/').pop() || '';
    const locationId = locationName.split('/').pop() || '';

    await Promise.all([
      upsertSetting('integrations.google.accountId', accountId, 'Google Business account id'),
      upsertSetting('integrations.google.locationId', locationId, 'Google Business location id'),
      upsertSetting('integrations.google.locationName', locationName, 'Google Business location name'),
      upsertSetting('integrations.google.connectedAt', new Date().toISOString(), 'Google connection timestamp'),
    ]);

    const response = NextResponse.redirect(new URL(nextUrl, req.url));
    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_oauth_next');
    return response;
  } catch (err) {
    log.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/admin/ressenyes?google=error', req.url));
  }
}
