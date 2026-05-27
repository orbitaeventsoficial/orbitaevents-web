import type { Prisma, PrismaClient } from '@prisma/client';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface ArchiveLeadInput {
  leadIds: string[];
  archivedBy: 'system:lead-cleanup' | 'admin';
}

// Crea snapshots a `lead_archive` per a un conjunt de leads abans que es purguin.
// Es crida dins d'una transacció Prisma per garantir atomicitat amb el `delete`.
// El total estimat es deriva del proposal SENT/ACCEPTED més recent (mateixa
// lògica que `seasonCalendarService`).
export async function snapshotLeadsBeforeDelete(
  tx: TransactionClient,
  input: ArchiveLeadInput,
): Promise<number> {
  if (input.leadIds.length === 0) return 0;

  const leads = await tx.lead.findMany({
    where: { id: { in: input.leadIds } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      eventDate: true,
      eventLocation: true,
      guestCount: true,
      source: true,
      priority: true,
      assignedTo: true,
      lostReason: true,
      lostAt: true,
      createdAt: true,
      updatedAt: true,
      contactedAt: true,
      proposals: {
        where: { status: { in: ['SENT', 'ACCEPTED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { total: true },
      },
    },
  });

  if (leads.length === 0) return 0;

  const rows: Prisma.LeadArchiveCreateManyInput[] = leads.map((l) => ({
    leadId: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    eventType: l.eventType,
    eventDate: l.eventDate,
    eventLocation: l.eventLocation,
    guestCount: l.guestCount,
    source: l.source,
    estimatedValue: l.proposals[0]?.total ?? null,
    priority: l.priority,
    assignedTo: l.assignedTo,
    lostReason: l.lostReason,
    lostAt: l.lostAt,
    originalCreatedAt: l.createdAt,
    originalUpdatedAt: l.updatedAt,
    contactedAt: l.contactedAt,
    archivedBy: input.archivedBy,
  }));

  const result = await tx.leadArchive.createMany({ data: rows });
  return result.count;
}
