import { NextResponse, type NextRequest } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { recordCollaboratorPayment, deleteCollaboratorPayment } from '@/lib/services/collaboratorPayoutService';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await recordCollaboratorPayment({
      collaboratorId: params.id,
      bookingId: typeof body?.bookingId === 'string' ? body.bookingId : null,
      leadId: typeof body?.leadId === 'string' ? body.leadId : null,
      amount: Number(body?.amount),
      method: typeof body?.method === 'string' ? body.method : null,
      paidAt: typeof body?.paidAt === 'string' ? body.paidAt : null,
      notes: typeof body?.notes === 'string' ? body.notes : null,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error registrant pagament a col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params: _params }: { params: { id: string } }) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId') || '';
    const result = await deleteCollaboratorPayment(paymentId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant pagament a col·laborador:', error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
