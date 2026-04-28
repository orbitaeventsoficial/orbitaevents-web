import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { reassignProposalOwner } from '@/lib/services/proposalAdminService';

const reassignSchema = z.object({
  customerId: z.string().min(1).nullable().optional(),
  leadId: z.string().min(1).nullable().optional(),
  bookingId: z.string().min(1).nullable().optional(),
});

interface Params {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body invàlid' }, { status: 400 });
  }

  const parsed = reassignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await reassignProposalOwner({
      proposalId: params.id,
      customerId: parsed.data.customerId,
      leadId: parsed.data.leadId,
      bookingId: parsed.data.bookingId,
      actor: 'Admin',
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, proposal: result.proposal, changed: result.changed });
  } catch (error) {
    log.error('Error reassignant pressupost', error, {
      context: { endpoint: 'PATCH /api/admin/proposals/[id]/owner', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error reassignant pressupost' }, { status: 500 });
  }
}
