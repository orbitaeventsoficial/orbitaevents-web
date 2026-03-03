import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import type { EventType } from '@prisma/client';

interface Params {
  params: { id: string };
}

function mapLeadEventType(raw: unknown): EventType {
  const value = String(raw || '').toLowerCase();
  if (value === 'bodas' || value === 'wedding') return 'WEDDING';
  if (value === 'empresas' || value === 'corporate') return 'CORPORATE';
  if (value === 'fiestas' || value === 'private_party') return 'PRIVATE_PARTY';
  return 'OTHER';
}

function parseDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLocale(raw: unknown): string {
  const value = String(raw || 'ca').toLowerCase();
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('en')) return 'en';
  return 'ca';
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const existing = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Pressupost no trobat' }, { status: 404 });
    }

    let ensuredLeadId = existing.leadId || null;

    if (!ensuredLeadId) {
      const snapshot = (existing.snapshot || {}) as Record<string, any>;
      const snapshotCustomer = (snapshot.customer || {}) as Record<string, any>;
      const snapshotEvent = (snapshot.event || {}) as Record<string, any>;

      const reusableLead = await prisma.lead.findFirst({
        where: {
          OR: [{ customerId: existing.customerId }, { email: existing.customer.email }],
          status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'] },
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });

      if (reusableLead) {
        ensuredLeadId = reusableLead.id;
      } else {
        const createdLead = await prisma.lead.create({
          data: {
            customerId: existing.customerId,
            name: existing.customer.name || String(snapshotCustomer.name || 'Client'),
            email: existing.customer.email,
            phone: snapshotCustomer.phone ? String(snapshotCustomer.phone) : null,
            eventType: mapLeadEventType(snapshot.eventType),
            eventDate: parseDateOrNull(snapshotEvent.date),
            eventSchedule: snapshotEvent.schedule ? String(snapshotEvent.schedule) : null,
            eventLocation: snapshotEvent.location ? String(snapshotEvent.location) : null,
            guestCount: Number.isFinite(Number(snapshotEvent.guests)) ? Math.max(0, Math.round(Number(snapshotEvent.guests))) : null,
            budget: Number.isFinite(Number(existing.total)) ? String(Number(existing.total).toFixed(2)) : null,
            message: snapshot.whyChooseUs ? String(snapshot.whyChooseUs) : null,
            interestedPackId: snapshot.packId ? String(snapshot.packId) : null,
            interestedExtras: [],
            source: 'OTHER',
            status: 'QUOTE_SENT',
            preferredLocale: normalizeLocale(existing.locale),
          },
          select: { id: true },
        });
        ensuredLeadId = createdLead.id;
      }
    }

    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        leadId: ensuredLeadId,
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true } },
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: proposal.customerId,
        action: 'PROPOSAL_SENT',
        details: { proposalId: proposal.id, reference: proposal.reference, total: proposal.total },
      },
    });

    // Auto-seguiment 48h després d'enviar pressupost.
    const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const taskTitle = `Seguiment pressupost ${proposal.reference}`;
    try {
      const prismaAny = prisma as any;
      const existingTask = await prismaAny.task.findFirst({
        where: {
          customerId: proposal.customerId,
          proposalId: proposal.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
        select: { id: true },
      });
      if (!existingTask) {
        await prismaAny.task.create({
          data: {
            customerId: proposal.customerId,
            leadId: proposal.leadId || null,
            bookingId: proposal.bookingId || null,
            proposalId: proposal.id,
            title: taskTitle,
            description: 'Contactar client per confirmar resposta al pressupost enviat.',
            dueDate,
            status: 'OPEN',
            priority: 'MEDIUM',
            createdBy: 'Sistema',
          },
        });
      }
    } catch {
      // Fallback legacy si encara no existeix taula tasks.
      if (proposal.lead?.id) {
        const existingLegacy = await prisma.leadTask.findFirst({
          where: {
            leadId: proposal.lead.id,
            title: taskTitle,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
          select: { id: true },
        });
        if (!existingLegacy) {
          await prisma.leadTask.create({
            data: {
              leadId: proposal.lead.id,
              title: taskTitle,
              description: 'Contactar client per confirmar resposta al pressupost enviat.',
              dueDate,
              status: 'OPEN',
              priority: 'MEDIUM',
              createdBy: 'Sistema',
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, proposal });
  } catch (error) {
    log.error('Error enviant pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/send:POST', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error enviant pressupost' }, { status: 500 });
  }
}
