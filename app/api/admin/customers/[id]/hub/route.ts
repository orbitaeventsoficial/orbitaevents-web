import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { fetchCustomerHub } from '@/lib/customer-hub/fetchCustomerHub';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET /api/admin/customers/[id]/hub
 * Obté les dades completes del Customer Hub per refrescar el client
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const data = await fetchCustomerHub(params.id);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    log.error('Error obtenint Customer Hub', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Client no trobat' },
      { status: 404 }
    );
  }
}
