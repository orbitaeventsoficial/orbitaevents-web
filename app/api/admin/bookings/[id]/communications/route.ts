import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { executeBookingCommunication, parseBookingCommunicationBody } from '@/lib/services/bookingCommunicationService';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const payload = parseBookingCommunicationBody(body);
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Payload invàlid' }, { status: 400 });
    }

    const result = await executeBookingCommunication(params.id, payload);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error in booking communications route', error);
    return NextResponse.json({ ok: false, error: 'No s’ha pogut processar la comunicació' }, { status: 500 });
  }
}