/**
 * API ROUTE: Admin Customer [id]
 * ==============================
 * GET - Obtenir un client
 * PATCH - Actualitzar client
 * DELETE - Eliminar client (amb consideracions GDPR)
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/request-context';
import { z } from 'zod';
import { deleteCustomerOrAnonymize, getCustomerDetail, updateCustomerFromInput } from '@/lib/services/customerRouteService';

export const dynamic = 'force-dynamic';

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  preferredLocale: z.enum(['ca', 'es', 'en']).optional(),
  gdprConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const requestId = getRequestId(request);

  try {
    const result = await getCustomerDetail(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error obtenint client' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await updateCustomerFromInput(params.id, parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error actualitzant client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;
  const requestId = getRequestId(request);

  try {
    const result = await deleteCustomerOrAnonymize(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error eliminant client' },
      { status: 500 }
    );
  }
}
