import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPendingTestimonialsReminderCount } from '@/lib/services/testimonialReminderAdminService';

export const dynamic = 'force-dynamic';

/**
 * POST - Retorna el recompte de testimonis pendents de revisió.
 * Endpoint creat per ManualActionsPanel.tsx.
 */
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    return NextResponse.json(await getPendingTestimonialsReminderCount());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
