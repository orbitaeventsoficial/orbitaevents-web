import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
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
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_ADS_OAUTH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_BASE_URL || 'https://orbitaevents.com'}/api/google-ads/oauth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing Google Ads OAuth configuration' },
      { status: 500 }
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const successUrl = '/admin/settings/integrations?gads=connected';

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/settings/integrations?gads=error&reason=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state || !verifyState(state, clientSecret)) {
    return NextResponse.json({ ok: false, error: 'Invalid OAuth state' }, { status: 400 });
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
    if (!tokenData.access_token) {
      throw new Error('No access token returned by Google');
    }
    if (!tokenData.refresh_token) {
      throw new Error('Google no ha retornat refresh token. Revoca permisos i torna a connectar amb consent.');
    }

    await Promise.all([
      upsertSetting(
        'integrations.googleAds.refreshToken',
        tokenData.refresh_token,
        'Google Ads OAuth refresh token'
      ),
      upsertSetting(
        'integrations.googleAds.connectedAt',
        new Date().toISOString(),
        'Google Ads connection timestamp'
      ),
    ]);

    return NextResponse.redirect(new URL(successUrl, req.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error('Google Ads OAuth callback error:', err as Error);
    return NextResponse.redirect(
      new URL(`/admin/settings/integrations?gads=error&reason=${encodeURIComponent(message)}`, req.url)
    );
  }
}
