import { NextRequest, NextResponse } from 'next/server';
import { buildCalendarFeedIcs, isValidCalendarFeedToken } from '@/lib/services/calendarFeedTokenService';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 });
  }

  if (!(await isValidCalendarFeedToken(token))) {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 404 });
  }

  const body = await buildCalendarFeedIcs();

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="orbita-events.ics"',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
