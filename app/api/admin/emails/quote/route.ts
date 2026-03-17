// app/api/admin/emails/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { sendAdminQuoteEmail } from '@/lib/services/adminQuoteEmailService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const result = await sendAdminQuoteEmail(body ?? {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing extras:')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && /timeout/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Timeout SMTP enviant pressupost. Revisa configuració SMTP (host/port/firewall).' },
        { status: 504 }
      );
    }

    log.error('Error enviant pressupost:', error);
    return NextResponse.json(
      { error: error instanceof Error ? `Error enviant pressupost: ${error.message}` : 'Error enviant pressupost' },
      { status: 500 }
    );
  }
}