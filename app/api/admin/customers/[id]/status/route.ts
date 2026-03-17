import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { z } from 'zod';
import { updateCustomerHubStatus } from '@/lib/services/customerStatusService';

const statusSchema = z.object({
  status: z.enum(['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Estat invàlid' },
        { status: 400 }
      );
    }

    const result = await updateCustomerHubStatus(params.id, parsed.data.status);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error canviant estat del client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error canviant estat' },
      { status: 500 }
    );
  }
}
