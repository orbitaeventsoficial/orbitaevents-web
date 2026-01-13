import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { sendPendingTestimonialsReminder } from '@/lib/services/testimonialReminder';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON_SECRET no configurado - el cron no puede ejecutarse');
    return false;
  }

  if (!authHeader) {
    log.warn('Intento de acceso a cron sin authorization header');
    return false;
  }

  const isValid = authHeader === `Bearer ${cronSecret}`;
  if (!isValid) {
    log.warn('Intento de acceso a cron con credenciales invalidas', {
      ip: request.headers.get('x-forwarded-for'),
    });
  }

  return isValid;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendPendingTestimonialsReminder();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('Error en cron testimonios:', error);
    return NextResponse.json(
      { error: 'Error procesando recordatorio' },
      { status: 500 }
    );
  }
}
