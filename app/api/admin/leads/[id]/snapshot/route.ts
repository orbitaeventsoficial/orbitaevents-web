import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { processLeadTechnicalSnapshot } from '@/lib/services/leadSnapshotService';

interface Params {
  params: { id: string };
}

const schema = z.object({
  action: z.enum(['save_document', 'send_email']),
  recipient: z.string().email().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
    }

    const result = await processLeadTechnicalSnapshot({
      leadId: params.id,
      action: parsed.data.action,
      recipient: parsed.data.recipient,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error procesando snapshot técnico del lead', error, {
      context: { leadId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'No s\'ha pogut processar el snapshot tècnic' },
      { status: 500 }
    );
  }
}
