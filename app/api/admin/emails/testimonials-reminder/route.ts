import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST - Retorna el recompte de testimonis pendents de revisió.
 * Endpoint creat per ManualActionsPanel.tsx.
 */
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const pendingCount = await prisma.customerTestimonial.count({
      where: { isApproved: false },
    });
    return NextResponse.json({ ok: true, pendingCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
