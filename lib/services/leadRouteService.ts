import { prisma } from '@/lib/prisma';
import { deleteLeadTasks } from '@/lib/services/tasks/taskCleanup';

type LeadPatchInput = Record<string, unknown>;

type LeadRouteResult = {
  status: number;
  body: Record<string, unknown>;
};

export async function getLeadDetail(id: string): Promise<LeadRouteResult> {
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      guestCount: true,
      budget: true,
      message: true,
      interestedPackId: true,
      interestedExtras: true,
      source: true,
      landingPage: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      status: true,
      priority: true,
      assignedTo: true,
      preferredLocale: true,
      createdAt: true,
      updatedAt: true,
      contactedAt: true,
      convertedAt: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 10 },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
      documents: { orderBy: { createdAt: 'desc' }, take: 10 },
      booking: {
        include: {
          pack: { include: { translations: { take: 1 } } },
          extras: { include: { extra: { include: { translations: { take: 1 } } } } },
        },
      },
    },
  });

  if (!lead) {
    return { status: 404, body: { error: 'Lead no trobat' } };
  }

  return { status: 200, body: { ok: true, lead } };
}

export async function updateLeadFromInput(id: string, input: LeadPatchInput): Promise<LeadRouteResult> {
  const existing = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      contactedAt: true,
    },
  });

  if (!existing) {
    return { status: 404, body: { error: 'Lead no trobat' } };
  }

  const body: Record<string, unknown> = { ...input };
  delete body.eventVenue;
  delete body.notes;

  if (body.source === null) delete body.source;
  if (body.preferredLocale === null) delete body.preferredLocale;

  if (body.eventDate && typeof body.eventDate === 'string') {
    const parsedDate = new Date(body.eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return {
        status: 400,
        body: { error: 'Data invàlida', details: { eventDate: 'Format de data incorrecte' } },
      };
    }
    body.eventDate = parsedDate;
  }

  if (body.status === 'WON' && existing.status !== 'WON') {
    body.convertedAt = new Date();
  }

  if (body.status === 'CONTACTED' && !existing.contactedAt) {
    body.contactedAt = new Date();
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: body,
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      priority: true,
      updatedAt: true,
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'lead',
      entityId: id,
      details: { changes: Object.keys(body), newStatus: typeof body.status === 'string' ? body.status : null },
    },
  });

  return { status: 200, body: { ok: true, lead } };
}

export async function deleteLeadIfAllowed(id: string): Promise<LeadRouteResult> {
  const existing = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      booking: { select: { id: true } },
    },
  });

  if (!existing) {
    return { status: 404, body: { error: 'Lead no trobat' } };
  }

  if (existing.booking) {
    return { status: 400, body: { error: 'No es pot eliminar un lead amb reserva associada' } };
  }

  await prisma.$transaction(async (tx) => {
    await tx.leadNote.deleteMany({ where: { leadId: id } });
    await tx.leadActivity.deleteMany({ where: { leadId: id } });
    await deleteLeadTasks(tx, id);
    await tx.leadDocument.deleteMany({ where: { leadId: id } });
    await tx.lead.delete({
      where: { id },
      select: { id: true },
    });
  });

  try {
    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'lead',
        entityId: id,
        details: { name: existing.name, email: existing.email },
      },
    });
  } catch {
    // Deletion is already complete; a missing adminLog should not fail the request.
  }

  return { status: 200, body: { ok: true } };
}
