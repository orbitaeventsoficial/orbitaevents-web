/**
 * Netejar registres orfes de la BD
 * ==================================
 * Detecta i opcionalment elimina registres sense relacions vàlides.
 *
 * Executar:
 *   npx tsx scripts/cleanup-orphans.ts          # Només reportar (dry-run)
 *   npx tsx scripts/cleanup-orphans.ts --fix    # Reportar + netejar
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FIX = process.argv.includes('--fix');

interface OrphanResult {
  entity: string;
  count: number;
  ids: string[];
}

async function main() {
  console.log(`🔍 Cercant registres orfes... ${FIX ? '(MODE FIX)' : '(dry-run)'}\n`);

  const orphans: OrphanResult[] = [];

  // 1. LeadNotes sense lead (via raw query)
  const orphanNoteIds = await prisma.$queryRaw<{id:string}[]>`
    SELECT ln.id FROM lead_notes ln LEFT JOIN leads l ON ln."leadId" = l.id WHERE l.id IS NULL
  `.catch(() => []);
  if (orphanNoteIds.length > 0) {
    orphans.push({ entity: 'LeadNote (sense lead)', count: orphanNoteIds.length, ids: orphanNoteIds.map((n) => n.id) });
    if (FIX) await prisma.leadNote.deleteMany({ where: { id: { in: orphanNoteIds.map((n) => n.id) } } });
  }

  // 2. LeadActivities sense lead
  const orphanActIds = await prisma.$queryRaw<{id:string}[]>`
    SELECT la.id FROM lead_activities la LEFT JOIN leads l ON la."leadId" = l.id WHERE l.id IS NULL
  `.catch(() => []);
  if (orphanActIds.length > 0) {
    orphans.push({ entity: 'LeadActivity (sense lead)', count: orphanActIds.length, ids: orphanActIds.map((a) => a.id) });
    if (FIX) await prisma.leadActivity.deleteMany({ where: { id: { in: orphanActIds.map((a) => a.id) } } });
  }

  // 3. CustomerActivities sense customer
  const orphanCustActIds = await prisma.$queryRaw<{id:string}[]>`
    SELECT ca.id FROM customer_activities ca LEFT JOIN customers c ON ca."customerId" = c.id WHERE c.id IS NULL
  `.catch(() => []);
  if (orphanCustActIds.length > 0) {
    orphans.push({ entity: 'CustomerActivity (sense customer)', count: orphanCustActIds.length, ids: orphanCustActIds.map((a) => a.id) });
    if (FIX) await prisma.customerActivity.deleteMany({ where: { id: { in: orphanCustActIds.map((a) => a.id) } } });
  }

  // 4. Proposals sense booking
  const orphanPropIds = await prisma.proposal.findMany({
    where: { bookingId: null },
    select: { id: true },
  }).catch(() => []);
  if (orphanPropIds.length > 0) {
    orphans.push({ entity: 'Proposal (sense booking)', count: orphanPropIds.length, ids: orphanPropIds.map((p) => p.id) });
    // No eliminar — proposals poden existir sense booking per disseny
  }

  // 5. PackTranslations sense pack
  const orphanPackTransIds = await prisma.$queryRaw<{id:string}[]>`
    SELECT pt.id FROM pack_translations pt LEFT JOIN packs p ON pt."packId" = p.id WHERE p.id IS NULL
  `.catch(() => []);
  if (orphanPackTransIds.length > 0) {
    orphans.push({ entity: 'PackTranslation (sense pack)', count: orphanPackTransIds.length, ids: orphanPackTransIds.map((t) => t.id) });
    if (FIX) await prisma.packTranslation.deleteMany({ where: { id: { in: orphanPackTransIds.map((t) => t.id) } } });
  }

  // 6. ExtraTranslations sense extra
  const orphanExtraTransIds = await prisma.$queryRaw<{id:string}[]>`
    SELECT et.id FROM extra_translations et LEFT JOIN extras e ON et."extraId" = e.id WHERE e.id IS NULL
  `.catch(() => []);
  if (orphanExtraTransIds.length > 0) {
    orphans.push({ entity: 'ExtraTranslation (sense extra)', count: orphanExtraTransIds.length, ids: orphanExtraTransIds.map((t) => t.id) });
    if (FIX) await prisma.extraTranslation.deleteMany({ where: { id: { in: orphanExtraTransIds.map((t) => t.id) } } });
  }

  // 7. EmailTemplates inactives
  const inactiveTemplates = await prisma.emailTemplate.findMany({
    where: { isActive: false },
    select: { id: true, slug: true, locale: true },
  });
  if (inactiveTemplates.length > 0) {
    orphans.push({ entity: 'EmailTemplate (inactives)', count: inactiveTemplates.length, ids: inactiveTemplates.map((t) => `${t.slug}:${t.locale}`) });
    // No eliminar automàticament — només reportar
  }

  // 8. AdminLogs antics (>90 dies)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const oldLogs = await prisma.adminLog.count({ where: { createdAt: { lt: cutoff } } });
  if (oldLogs > 0) {
    orphans.push({ entity: 'AdminLog (>90 dies)', count: oldLogs, ids: [] });
    if (FIX) {
      const deleted = await prisma.adminLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
      console.log(`  🗑️  ${deleted.count} AdminLogs antics eliminats`);
    }
  }

  // Resum
  console.log('═══════════════════════════════════════');
  if (orphans.length === 0) {
    console.log('✅ Cap registre orfe trobat! Tot net.');
  } else {
    let total = 0;
    for (const o of orphans) {
      total += o.count;
      const action = FIX ? '🗑️  netejat' : '⚠️  trobat';
      console.log(`  ${action}: ${o.count} ${o.entity}`);
    }
    console.log(`\n  Total: ${total} registres ${FIX ? 'netejats' : 'orfes'}`);
    if (!FIX) {
      console.log('\n  Per netejar, executa: npx tsx scripts/cleanup-orphans.ts --fix');
    }
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
