#!/usr/bin/env node
/**
 * Migracio puntual de reserves antigues cap a BookingServiceLine.
 *
 * Per defecte es dry-run. El PROPIETARI l'ha d'executar amb --apply nomes
 * despres d'haver aplicat la migracio Prisma
 * 20260608113000_booking_partner_billing_service_lines a l'entorn.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const MIGRATIONS = [
  {
    reference: 'OE-2026-005',
    partnerCompany: 'Masquerade Events',
    clearNotes: true,
    lines: [
      {
        label: 'DJ Orbita',
        kind: 'DJ',
        revenueAmount: 300,
        costAmount: 0,
        quantity: 1,
        sortOrder: 10,
        notes: 'Migrat des de notes: Llica partner billable',
      },
      {
        label: 'Tecnic de so Orbita',
        kind: 'SOUND_TECH',
        revenueAmount: 40,
        costAmount: 0,
        quantity: 1,
        sortOrder: 20,
        notes: 'Migrat des de notes: Llica partner billable',
      },
    ],
  },
];

function formatMode() {
  return APPLY ? 'APPLY' : 'DRY-RUN';
}

async function findPartner(config) {
  const partner = await prisma.collaborator.findFirst({
    where: {
      OR: [
        { company: { equals: config.partnerCompany, mode: 'insensitive' } },
        { name: { contains: config.partnerCompany, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, company: true, email: true, phone: true },
  });

  if (!partner) {
    throw new Error(`Partner no trobat: ${config.partnerCompany}`);
  }

  return partner;
}

async function migrateBooking(config) {
  const booking = await prisma.booking.findUnique({
    where: { reference: config.reference },
    select: {
      id: true,
      reference: true,
      customerId: true,
      billedCollaboratorId: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      notes: true,
      serviceLines: {
        select: { id: true, label: true, kind: true, revenueAmount: true, costAmount: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!booking) {
    throw new Error(`Reserva no trobada: ${config.reference}`);
  }

  const partner = await findPartner(config);
  const hasServiceLines = booking.serviceLines.length > 0;

  console.log(`\n[${formatMode()}] ${booking.reference}`);
  console.log(`- Partner facturat: ${partner.company || partner.name} (${partner.id})`);
  console.log(`- customerId actual: ${booking.customerId || 'null'} -> null`);
  console.log(`- billedCollaboratorId actual: ${booking.billedCollaboratorId || 'null'} -> ${partner.id}`);
  console.log(`- serviceLines actuals: ${booking.serviceLines.length}`);

  if (hasServiceLines) {
    console.log('- SKIP create serviceLines: la reserva ja te linies; no es dupliquen.');
  } else {
    for (const line of config.lines) {
      console.log(`- create ${line.kind}: ${line.label} revenue=${line.revenueAmount} cost=${line.costAmount}`);
    }
  }

  if (config.clearNotes) {
    console.log(`- notes: ${booking.notes ? 'es netegen' : 'ja son null'}`);
  }

  if (!APPLY) {
    return { changed: false, skippedLines: hasServiceLines };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        customerId: null,
        billedCollaboratorId: partner.id,
        clientName: partner.company || partner.name,
        clientEmail: partner.email || '',
        clientPhone: partner.phone || '',
        notes: config.clearNotes ? null : booking.notes,
      },
    });

    if (!hasServiceLines) {
      await tx.bookingServiceLine.createMany({
        data: config.lines.map((line) => ({
          bookingId: booking.id,
          collaboratorId: null,
          kind: line.kind,
          label: line.label,
          revenueAmount: line.revenueAmount,
          costAmount: line.costAmount,
          quantity: line.quantity,
          hours: null,
          notes: line.notes,
          sortOrder: line.sortOrder,
        })),
      });
    }
  });

  return { changed: true, skippedLines: hasServiceLines };
}

async function main() {
  console.log(`Migracio booking partner service lines (${formatMode()})`);

  let changed = 0;
  let skippedLines = 0;

  for (const config of MIGRATIONS) {
    const result = await migrateBooking(config);
    if (result.changed) changed += 1;
    if (result.skippedLines) skippedLines += 1;
  }

  console.log(`\nResum: ${changed} reserva(es) actualitzades; ${skippedLines} reserva(es) amb serviceLines preexistents.`);
  if (!APPLY) {
    console.log('Dry-run complet. Reexecuta amb --apply per escriure els canvis.');
  }
}

function printKnownSetupError(error) {
  if (error?.code === 'P2022' && String(error?.meta?.column || '').includes('billedCollaboratorId')) {
    console.error(
      'Prerequisit pendent: la base de dades encara no te la migracio 20260608113000_booking_partner_billing_service_lines aplicada.',
    );
    console.error('Aplica primer la migracio Prisma i torna a executar aquest script en dry-run.');
    return true;
  }

  return false;
}

main()
  .catch((error) => {
    if (!printKnownSetupError(error)) {
      console.error('Error migrant booking partner service lines:', error);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
