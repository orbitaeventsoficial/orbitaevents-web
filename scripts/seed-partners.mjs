#!/usr/bin/env node
/**
 * Seed inicial de partners (Fase 4 del partners-platform-checklist).
 *
 * Normalitza els partners reals del negoci com a DADES (no hardcode en
 * components). Idempotent i NO destructiu: si un partner ja existeix (per nom),
 * NO el sobreescriu — així no trepitja edicions fetes des de l'admin.
 *
 * L'executa el PROPIETARI contra Railway:
 *   node scripts/seed-partners.mjs
 *
 * Rols vàlids: PROVIDER, REFERRER, EQUIPMENT_RENTAL, CLIENT_PARTNER, CREW.
 * Els contactes (email/telèfon) es deixen buits perquè el propietari els ompli
 * a l'admin amb les dades reals.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dades de negoci (vegeu docs/partners-platform-handoff.md §Exemples reals).
const PARTNERS = [
  {
    name: 'Carlos / Masquerade',
    company: 'Masquerade Events',
    specialty: 'Animació, bingo musical, pintacares, mag',
    roles: ['PROVIDER', 'CLIENT_PARTNER', 'REFERRER'],
  },
  {
    name: 'DJ Rufo',
    company: null,
    specialty: 'DJ',
    roles: ['REFERRER'],
  },
  {
    name: 'Tino',
    company: null,
    specialty: 'Lloguer de material',
    roles: ['EQUIPMENT_RENTAL', 'REFERRER'],
  },
  {
    name: 'Tronios',
    company: 'Tronios',
    specialty: 'Material de música (cabines, fum, altaveus, grapes)',
    roles: ['PROVIDER', 'EQUIPMENT_RENTAL'],
  },
  {
    name: 'DJ Mania',
    company: 'DJ Mania',
    specialty: 'Altaveus i material electrònic',
    roles: ['PROVIDER', 'EQUIPMENT_RENTAL'],
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const partner of PARTNERS) {
    const existing = await prisma.collaborator.findFirst({
      where: { name: partner.name },
      select: { id: true },
    });

    if (existing) {
      console.log(`• Ja existeix, no es toca: ${partner.name}`);
      skipped += 1;
      continue;
    }

    await prisma.collaborator.create({
      data: {
        name: partner.name,
        company: partner.company,
        specialty: partner.specialty,
        roles: partner.roles,
      },
    });
    console.log(`✓ Creat: ${partner.name} [${partner.roles.join(', ')}]`);
    created += 1;
  }

  console.log(`\nResum: ${created} creats, ${skipped} ja existents (intactes).`);
  console.log('Ara obre /admin/collaborators per omplir contactes i revisar rols.');
}

main()
  .catch((error) => {
    console.error('✗ Error executant el seed de partners:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
