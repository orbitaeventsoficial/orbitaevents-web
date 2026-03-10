import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const [consents, requests] = await Promise.all([
      prisma.consentRecord.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dataRequest.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ success: true, consents, requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
