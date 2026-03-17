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

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_OAUTH_REDIRECT_URI ||
    `${getAppBaseUrl()}/api/gmail/oauth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: 'Missing Google OAuth configuration' },
      { status: 500 }
    );
  }

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const successUrl = '/admin/inbox/settings?gmail=connected';

  if (error) {
    return NextResponse.redirect(new URL(`/admin/inbox/settings?gmail=error&reason=${encodeURIComponent(error)}`, req.url));
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

    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const profileError = await profileRes.text();
      throw new Error(`Failed to get Gmail profile: ${profileRes.status} - ${profileError}`);
    }

    const profile = await profileRes.json();
    const email = profile.emailAddress;

    if (refreshToken) {
      await upsertIntegrationSetting('integrations.gmail.refreshToken', refreshToken, 'Gmail OAuth refresh token');
    }
    await upsertIntegrationSettings([
      { key: 'integrations.gmail.email', value: email, label: 'Gmail connected email' },
      {
        key: 'integrations.gmail.connectedAt',
        value: new Date().toISOString(),
        label: 'Gmail connection timestamp',
      },
    ]);

    log.info(`Gmail connected successfully for ${email}`);

    return NextResponse.redirect(new URL(successUrl, req.url));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    log.error('Gmail OAuth callback error:', err as Error);
    return NextResponse.redirect(new URL(`/admin/inbox/settings?gmail=error&reason=${encodeURIComponent(errorMessage)}`, req.url));
  }
}
