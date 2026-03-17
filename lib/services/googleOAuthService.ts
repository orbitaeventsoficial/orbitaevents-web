import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const STATE_TTL_SECONDS = 10 * 60;

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export function verifyGoogleOAuthState(state: string, secret: string): boolean {
  const parts = state.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const [tsPart, nonce] = payload.split(':');
  const ts = Number(tsPart);

  if (!nonce || !Number.isFinite(ts)) return false;

  const age = Math.floor(Date.now() / 1000) - ts;
  if (age < 0 || age > STATE_TTL_SECONDS) return false;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function exchangeGoogleOAuthCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  return (await tokenRes.json()) as GoogleTokenResponse;
}

export async function upsertIntegrationSetting(key: string, value: string, label: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value, type: 'STRING', category: 'integrations', label },
    create: { key, value, type: 'STRING', category: 'integrations', label },
  });
}

export async function upsertIntegrationSettings(
  entries: Array<{ key: string; value: string; label: string }>,
) {
  await Promise.all(entries.map((entry) => upsertIntegrationSetting(entry.key, entry.value, entry.label)));
}
