/**
 * API: Test de Notificacions
 * GET /api/admin/test-notifications - Diagnosticar configuració
 * POST /api/admin/test-notifications - Enviar test
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { getAdminNotificationDiagnostics, sendAdminTestEmail } from '@/lib/services/adminTestNotificationService';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const result = await getAdminNotificationDiagnostics();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await sendAdminTestEmail(body.email);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error enviant email de test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconegut',
      help: `
Possibles solucions:
1. Verifica que la contrasenya SMTP és correcta
2. Si uses Gmail, activa "Accés d'aplicacions menys segures" o usa App Password
3. Si uses Don Dominio, assegura't que el port és 587 o 465
4. Comprova que no hi ha firewall bloquejant
      `,
    }, { status: 500 });
  }
}