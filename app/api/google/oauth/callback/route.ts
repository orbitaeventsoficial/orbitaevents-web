import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import {
  exchangeGoogleOAuthCode,
  upsertIntegrationSetting,
  upsertIntegrationSettings,
  verifyGoogleOAuthState,
} from '@/lib/services/googleOAuthService';

export const dynamic = 'force-dynamic';

const ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
const LOCATION_API = 'https://businessprofile.googleapis.com/v1';

function normalizeRedirectUri(uri: string): string {
  return uri.trim().replace(/\/+$/, '');
}

function resolveRedirectUri(req: NextRequest): string {
  const envUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (envUri && envUri.trim().length > 0) {
    return normalizeRedirectUri(envUri);
  }
  return normalizeRedirectUri(new URL('/api/google/oauth/callback', req.url).toString());
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
  const redirectUri = resolveRedirectUri(req);

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing Google OAuth configuration' },
      { status: 500 }
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const nextUrl = '/admin/google-reviews?google=connected';

  if (error) {
    return NextResponse.redirect(new URL(`/admin/google-reviews?google=error&reason=${encodeURIComponent(error)}`, req.url));
  }

  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  if (!code || !state || !secret || !verifyGoogleOAuthState(state, secret)) {
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
      await upsertIntegrationSetting('integrations.google.refreshToken', refreshToken, 'Google OAuth refresh token');
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

    await upsertIntegrationSettings([
      { key: 'integrations.google.accountId', value: accountId, label: 'Google Business account id' },
      { key: 'integrations.google.locationId', value: locationId, label: 'Google Business location id' },
      { key: 'integrations.google.locationName', value: locationName, label: 'Google Business location name' },
      { key: 'integrations.google.connectedAt', value: new Date().toISOString(), label: 'Google connection timestamp' },
    ]);

    return NextResponse.redirect(new URL(nextUrl, req.url));
  } catch (err) {
    log.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/admin/google-reviews?google=error', req.url));
  }
}
