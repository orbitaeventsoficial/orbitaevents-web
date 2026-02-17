import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST']),
});

/**
 * PATCH /api/admin/customers/[id]/status
 * Canvia l'estat del client manualment (actualitza leads relacionats)
 */
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

    const { status } = parsed.data;
    const customerId = params.id;

    // Mapeig d'estat Hub a estat Lead
    const leadStatusMap: Record<string, string> = {
      LEAD: 'NEW',
      NEGOTIATION: 'NEGOTIATING',
      CONFIRMED: 'WON',
      POSTEVENT: 'WON',
      LOST: 'LOST',
    };
    const leadStatus = leadStatusMap[status] || 'NEW';

    // Actualitzar tots els leads del client
    await prisma.lead.updateMany({
      where: { customerId },
      data: { status: leadStatus as any },
    });

    // Si és CONFIRMED, actualitzar bookings a CONFIRMED
    if (status === 'CONFIRMED') {
      await prisma.booking.updateMany({
        where: { customerId, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });
    }

    // Si és LOST, marcar bookings com CANCELLED
    if (status === 'LOST') {
      await prisma.booking.updateMany({
        where: { customerId, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' },
      });
    }

    // Registrar activitat
    await prisma.customerActivity.create({
      data: {
        customerId,
        action: 'STATUS_CHANGED',
        details: { newStatus: status },
      },
    });

    return NextResponse.json({ ok: true, status });
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
