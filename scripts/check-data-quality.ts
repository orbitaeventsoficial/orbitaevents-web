/**
 * Auditoria de qualitat de dades
 * ================================
 * Verifica la qualitat de les dades: camps buits, inconsistències,
 * duplicats, i dades sospitoses.
 *
 * Executar: npx tsx scripts/check-data-quality.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QualityIssue {
  entity: string;
  issue: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
  ids?: string[];
}

async function main() {
  console.log('🔬 Auditoria de qualitat de dades\n');

  const issues: QualityIssue[] = [];

  // 1. Clients sense email
  const noEmail = await prisma.customer.count({ where: { email: '' } });
  if (noEmail > 0) {
    issues.push({ entity: 'Customer', issue: 'Sense email', count: noEmail, severity: 'error' });
  }

  // 2. Clients sense nom
  const noName = await prisma.customer.count({ where: { name: '' } });
  if (noName > 0) {
    issues.push({ entity: 'Customer', issue: 'Sense nom', count: noName, severity: 'error' });
  }

  // 3. Leads sense email
  const leadsNoEmail = await prisma.lead.count({ where: { email: '' } });
  if (leadsNoEmail > 0) {
    issues.push({ entity: 'Lead', issue: 'Sense email', count: leadsNoEmail, severity: 'warning' });
  }

  // 4. Reserves amb total 0 (no cancelled)
  const zeroBookings = await prisma.booking.count({
    where: { total: 0, status: { notIn: ['CANCELLED'] } },
  });
  if (zeroBookings > 0) {
    issues.push({ entity: 'Booking', issue: 'Total 0 EUR (no cancel·lada)', count: zeroBookings, severity: 'warning' });
  }

  // 5. Reserves amb data passada i estat PENDING/CONFIRMED
  const pastActive = await prisma.booking.count({
    where: {
      eventDate: { lt: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  });
  if (pastActive > 0) {
    issues.push({ entity: 'Booking', issue: 'Data passada amb estat actiu', count: pastActive, severity: 'warning' });
  }

  // 6. Packs sense inventari associat
  const packsNoItems = await prisma.pack.findMany({
    where: { inventory: { none: {} } },
    select: { slug: true },
  });
  if (packsNoItems.length > 0) {
    issues.push({
      entity: 'Pack',
      issue: 'Sense items inventari',
      count: packsNoItems.length,
      severity: 'info',
      ids: packsNoItems.map((p) => p.slug),
    });
  }

  // 7. Emails duplicats a customers
  const dupEmails = await prisma.$queryRaw<{ email: string; cnt: bigint }[]>`
    SELECT email, COUNT(*)::bigint as cnt FROM customers
    WHERE email != '' GROUP BY email HAVING COUNT(*) > 1
  `.catch(() => []);
  if (dupEmails.length > 0) {
    const total = dupEmails.reduce((sum, d) => sum + Number(d.cnt), 0);
    issues.push({
      entity: 'Customer',
      issue: 'Emails duplicats',
      count: total,
      severity: 'warning',
      ids: dupEmails.map((d) => d.email),
    });
  }

  // 8. Inventari amb hores > vida esperada (via usageHistory aggregate)
  const overusedRows = await prisma.$queryRaw<{ code: string; total_hours: number; expected: number }[]>`
    SELECT i.code, COALESCE(SUM(u.hours), 0)::float as total_hours, COALESCE(i."expectedLifeHours", 2000)::float as expected
    FROM inventory_items i
    LEFT JOIN inventory_usage u ON u."itemId" = i.id
    WHERE i."expectedLifeHours" IS NOT NULL
    GROUP BY i.id, i.code, i."expectedLifeHours"
    HAVING COALESCE(SUM(u.hours), 0) > COALESCE(i."expectedLifeHours", 2000)
  `.catch(() => []);
  if (overusedRows.length > 0) {
    issues.push({
      entity: 'InventoryItem',
      issue: 'Hores > vida esperada',
      count: overusedRows.length,
      severity: 'warning',
      ids: overusedRows.map((i) => `${i.code}: ${i.total_hours}h/${i.expected}h`),
    });
  }

  // 9. Settings buides
  const emptySettings = await prisma.setting.count({ where: { value: '' } });
  if (emptySettings > 0) {
    issues.push({ entity: 'Setting', issue: 'Valor buit', count: emptySettings, severity: 'info' });
  }

  // 10. Reserves sense referència
  const noRef = await prisma.booking.count({ where: { reference: '' } });
  if (noRef > 0) {
    issues.push({ entity: 'Booking', issue: 'Sense referencia', count: noRef, severity: 'info' });
  }

  // Report
  console.log('═══════════════════════════════════════════════════════');
  const icons = { error: '❌', warning: '⚠️ ', info: 'ℹ️ ' };

  if (issues.length === 0) {
    console.log('  ✅ Dades en bon estat! Cap problema detectat.');
  } else {
    for (const issue of issues) {
      console.log(`  ${icons[issue.severity]} ${issue.entity}: ${issue.issue} (${issue.count})`);
      if (issue.ids && issue.ids.length <= 10) {
        for (const id of issue.ids) {
          console.log(`      → ${id}`);
        }
      } else if (issue.ids && issue.ids.length > 10) {
        for (const id of issue.ids.slice(0, 5)) {
          console.log(`      → ${id}`);
        }
        console.log(`      ... i ${issue.ids.length - 5} mes`);
      }
    }

    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const infos = issues.filter((i) => i.severity === 'info').length;

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`  ${errors} errors · ${warnings} avisos · ${infos} informatius`);
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
