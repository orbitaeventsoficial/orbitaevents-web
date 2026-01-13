import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { sendPendingTestimonialsReminder } from '@/lib/services/testimonialReminder';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await sendPendingTestimonialsReminder();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('Error sending testimonials reminder', error);
    return NextResponse.json(
      { error: 'Error enviando recordatorio' },
      { status: 500 }
    );
  }
}
