// app/api/admin/emails/send-post-event/route.ts
// Enviament manual d'email post-event des del panell admin
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { sendPostEventEmailForBooking } from '@/lib/services/postEventDispatchService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const formData = await req.formData();
    const bookingId = formData.get('bookingId') as string;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requerit' }, { status: 400 });
    }
    const result = await sendPostEventEmailForBooking(bookingId, { createAdminLog: true });

    if (result.status === 'error') {
      const status = result.reason === 'Reserva no trobada' ? 404 : 500;
      return NextResponse.json({ error: result.reason || 'Error enviant email' }, { status });
    }

    if (result.status === 'skipped') {
      const status = result.reason?.includes('no està completada') ? 422
        : result.reason?.includes('Ja s\'ha enviat') ? 409
        : 422;
      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({ ok: true, email: result.email, reference: result.reference });
  } catch (error) {
    log.error('Error enviant email post-event:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error enviant email' },
      { status: 500 }
    );
  }
}
