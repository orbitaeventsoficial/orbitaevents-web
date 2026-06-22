// app/api/admin/emails/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { requireAuth } from '@/lib/auth';
import { sendAdminTestEmail } from '@/lib/services/adminTestNotificationService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(req, { ...RATE_LIMITS.contact, limit: 3 });
  if (rateLimitResult) return rateLimitResult;

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Correu electrònic no vàlid' }, { status: 400 });
    }

    const result = await sendAdminTestEmail(email);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error enviant correu de prova:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error enviant correu' },
      { status: 500 }
    );
  }
}