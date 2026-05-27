/**
 * GET /api/admin/emails/sent/[id]
 * ──────────────────────────────────────────────────────────────────────────
 * Retorna metadades + snapshot HTML d'un email enviat des de l'admin.
 * Pot acceptar `EmailSend.id` o `EmailSend.trackingToken` com a paràmetre.
 *
 * Servei: previsualització a la fitxa de lead (Bug B del #799 → #800).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { loadSentEmail } from '@/lib/services/emailTrackingService';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const raw = params.id?.trim();
  if (!raw) {
    return NextResponse.json({ error: 'Identificador buit' }, { status: 400 });
  }

  try {
    const record = await loadSentEmail(raw);
    if (!record) {
      return NextResponse.json({ error: 'Correu no trobat' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    log.error('Error obtenint email enviat', error);
    return NextResponse.json({ error: 'Error obtenint email enviat' }, { status: 500 });
  }
}
