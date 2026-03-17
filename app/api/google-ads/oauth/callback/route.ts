import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { getAppBaseUrl } from '@/lib/site';
import {
  exchangeGoogleOAuthCode,
  upsertIntegrationSettings,
  verifyGoogleOAuthState,
} from '@/lib/services/googleOAuthService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_ADS_OAUTH_REDIRECT_URI ||
    `${getAppBaseUrl()}/api/google-ads/oauth/callback`;

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

  if (!code || !state || !verifyGoogleOAuthState(state, clientSecret)) {
    return NextResponse.json({ ok: false, error: 'Invalid OAuth state' }, { status: 400 });
  }

  try {
    const tokenData = await exchangeGoogleOAuthCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
    if (!tokenData.access_token) {
      throw new Error('No access token returned by Google');
    }
    if (!tokenData.refresh_token) {
      throw new Error('Google no ha retornat refresh token. Revoca permisos i torna a connectar amb consent.');
    }

    await upsertIntegrationSettings([
      {
        key: 'integrations.googleAds.refreshToken',
        value: tokenData.refresh_token,
        label: 'Google Ads OAuth refresh token',
      },
      {
        key: 'integrations.googleAds.connectedAt',
        value: new Date().toISOString(),
        label: 'Google Ads connection timestamp',
      },
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
