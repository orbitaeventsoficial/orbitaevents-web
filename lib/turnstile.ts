/**
 * CLOUDFLARE TURNSTILE VERIFICATION
 * Server-side token validation
 */

import { log } from '@/lib/logger';

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Turnstile token server-side
 * @param token - Token from client-side widget
 * @param remoteIp - Optional client IP for additional verification
 * @returns true if valid, false if invalid
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  // Skip verification in development if not configured
  if (!TURNSTILE_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      log.warn('Turnstile not configured - skipping verification in development');
      return true;
    }
    log.error('CRITICAL: TURNSTILE_SECRET_KEY not configured in production');
    return false;
  }

  // Token is required
  if (!token) {
    log.warn('Turnstile token missing');
    return false;
  }

  // Allow dev bypass token
  if (process.env.NODE_ENV === 'development' && token === 'dev-mode-bypass-token') {
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      log.error('Turnstile verification request failed', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    const data = (await response.json()) as TurnstileVerifyResponse;

    if (!data.success) {
      log.warn('Turnstile verification failed', {
        errors: data['error-codes'],
      });
      return false;
    }

    log.info('Turnstile verification successful', {
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
    });

    return true;
  } catch (error) {
    log.error('Turnstile verification error', error);
    return false;
  }
}
