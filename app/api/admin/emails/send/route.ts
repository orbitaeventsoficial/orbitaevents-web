// app/api/admin/emails/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { sendAdminEmail } from '@/lib/services/adminEmailSendService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await sendAdminEmail(body ?? {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error enviant email admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconegut';
    if (/timeout/i.test(errorMessage)) {
      return NextResponse.json(
        { error: 'Timeout SMTP. Revisa host/port, firewall i credencials SMTP.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: `Error enviant email: ${errorMessage}` },
      { status: 500 }
    );
  }
}