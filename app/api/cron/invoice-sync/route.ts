import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { createInvoiceFromBooking, retryHoldedSync, refreshHoldedStatus } from '@/lib/services/invoiceService';
import { isHoldedEnabled } from '@/lib/services/holdedService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per invoice-sync', undefined, {
      context: { requestId, endpoint: 'cron/invoice-sync:isAuthorized' },
    });
    return false;
  }
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  const summary = {
    autoCreated: 0,
    retried: 0,
    refreshed: 0,
    errors: 0,
  };

  try {
    // 1. Auto-create invoices for COMPLETED bookings that are fully paid and have no invoice
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        depositPaid: true,
        remainingPaid: true,
        invoices: { none: { status: { not: 'CANCELLED' } } },
        customerId: { not: null },
      },
      select: { id: true, reference: true },
      take: 20,
    });

    for (const booking of completedBookings) {
      try {
        await createInvoiceFromBooking(booking.id);
        summary.autoCreated++;
        log.info(`Cron invoice-sync: factura auto-creada per reserva ${booking.reference}`);
      } catch (error) {
        summary.errors++;
        log.error(`Cron invoice-sync: error creant factura per ${booking.reference}`, error);
      }
    }

    // 2. Retry SYNC_ERROR invoices (if Holded is enabled)
    if (isHoldedEnabled()) {
      const errorInvoices = await prisma.invoice.findMany({
        where: { status: 'SYNC_ERROR' },
        select: { id: true, reference: true },
        take: 10,
      });

      for (const invoice of errorInvoices) {
        try {
          await retryHoldedSync(invoice.id);
          summary.retried++;
          log.info(`Cron invoice-sync: reintentat ${invoice.reference}`);
        } catch (error) {
          summary.errors++;
          log.error(`Cron invoice-sync: error reintentant ${invoice.reference}`, error);
        }
      }

      // 3. Refresh SYNCED invoices to check if they're paid in Holded
      const syncedInvoices = await prisma.invoice.findMany({
        where: {
          status: 'SYNCED',
          holdedInvoiceId: { not: null },
        },
        select: { id: true, reference: true },
        take: 20,
      });

      for (const invoice of syncedInvoices) {
        try {
          await refreshHoldedStatus(invoice.id);
          summary.refreshed++;
        } catch (error) {
          summary.errors++;
          log.error(`Cron invoice-sync: error refrescant ${invoice.reference}`, error);
        }
      }
    }

    log.info('Cron invoice-sync completat', { context: { summary } });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('Cron invoice-sync error global', error, {
      context: { requestId },
    });
    return NextResponse.json({ ok: false, error: 'Error executant cron' }, { status: 500 });
  }
}
