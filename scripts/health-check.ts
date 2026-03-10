/**
 * Health check de la base de dades
 * ==================================
 * Verifica la integritat de les dades i genera un informe.
 *
 * Executar: npx tsx scripts/health-check.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  detail: string;
}

async function main() {
  console.log('🏥 Health check de la base de dades...\n');

  const results: CheckResult[] = [];

  // 1. Connexió BD
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({ name: 'Connexió BD', status: 'ok', detail: 'PostgreSQL connectat' });
  } catch {
    results.push({ name: 'Connexió BD', status: 'error', detail: 'No es pot connectar!' });
    printResults(results);
    return;
  }

  // 2. Comptadors bàsics
  const [leads, bookings, customers, packs, extras, settings, templates, inventory] = await Promise.all([
    prisma.lead.count(),
    prisma.booking.count(),
    prisma.customer.count(),
    prisma.pack.count(),
    prisma.extra.count(),
    prisma.setting.count(),
    prisma.emailTemplate.count(),
    prisma.inventoryItem.count(),
  ]);

  results.push({ name: 'Leads', status: leads > 0 ? 'ok' : 'warning', detail: `${leads} registres` });
  results.push({ name: 'Reserves', status: bookings > 0 ? 'ok' : 'warning', detail: `${bookings} registres` });
  results.push({ name: 'Clients', status: customers > 0 ? 'ok' : 'warning', detail: `${customers} registres` });
  results.push({ name: 'Packs', status: packs >= 3 ? 'ok' : 'warning', detail: `${packs} packs (mínim esperat: 3)` });
  results.push({ name: 'Extras', status: extras >= 5 ? 'ok' : 'warning', detail: `${extras} extras` });
  results.push({ name: 'Settings', status: settings >= 20 ? 'ok' : 'warning', detail: `${settings} configuracions` });
  results.push({ name: 'Plantilles email', status: templates >= 24 ? 'ok' : 'warning', detail: `${templates}/24 plantilles` });
  results.push({ name: 'Inventari', status: inventory >= 20 ? 'ok' : 'warning', detail: `${inventory} items` });

  // 3. Packs amb traduccions
  const packsWithoutTrans = await prisma.pack.findMany({
    where: { translations: { none: {} } },
    select: { slug: true },
  });
  results.push({
    name: 'Packs sense traducció',
    status: packsWithoutTrans.length === 0 ? 'ok' : 'error',
    detail: packsWithoutTrans.length === 0 ? 'Tots tenen traduccions' : `${packsWithoutTrans.map((p) => p.slug).join(', ')}`,
  });

  // 4. Extras amb traduccions
  const extrasWithoutTrans = await prisma.extra.findMany({
    where: { translations: { none: {} } },
    select: { slug: true },
  });
  results.push({
    name: 'Extras sense traducció',
    status: extrasWithoutTrans.length === 0 ? 'ok' : 'warning',
    detail: extrasWithoutTrans.length === 0 ? 'Tots tenen traduccions' : `${extrasWithoutTrans.map((e) => e.slug).join(', ')}`,
  });

  // 5. Reserves futures sense pack (raw query perquè packId és required al schema però pot haver-hi nulls a BD)
  const noPackRows = await prisma.$queryRaw<{count:bigint}[]>`
    SELECT COUNT(*)::bigint as count FROM bookings
    WHERE "packId" IS NULL AND "eventDate" >= NOW()
    AND status NOT IN ('CANCELLED', 'COMPLETED')
  `.catch(() => [{ count: BigInt(0) }]);
  const bookingsNoPack = Number(noPackRows[0]?.count ?? 0);
  results.push({
    name: 'Reserves futures sense pack',
    status: bookingsNoPack === 0 ? 'ok' : 'warning',
    detail: bookingsNoPack === 0 ? 'Totes tenen pack' : `${bookingsNoPack} reserves sense pack assignat`,
  });

  // 6. Leads sense score
  const leadsNoScore = await prisma.lead.count({
    where: { cachedScore: null, status: { not: 'LOST' } },
  });
  results.push({
    name: 'Leads sense score',
    status: leadsNoScore === 0 ? 'ok' : 'warning',
    detail: leadsNoScore === 0 ? 'Tots tenen score' : `${leadsNoScore} leads sense cachedScore`,
  });

  // 7. Settings clau
  const criticalKeys = ['contact.phone', 'contact.email', 'pricing.depositPercent', 'pricing.vatRate', 'company.name'];
  const existingKeys = await prisma.setting.findMany({ where: { key: { in: criticalKeys } }, select: { key: true } });
  const missingKeys = criticalKeys.filter((k) => !existingKeys.some((s) => s.key === k));
  results.push({
    name: 'Settings crítiques',
    status: missingKeys.length === 0 ? 'ok' : 'error',
    detail: missingKeys.length === 0 ? 'Totes presents' : `Falten: ${missingKeys.join(', ')}`,
  });

  // 8. Reserves amb pagament pendent properes
  const upcomingUnpaid = await prisma.booking.count({
    where: {
      eventDate: { gte: new Date(), lte: new Date(Date.now() + 14 * 86400000) },
      status: { in: ['CONFIRMED', 'PREPARING'] },
      depositPaid: false,
    },
  });
  results.push({
    name: 'Reserves <14d sense dipòsit',
    status: upcomingUnpaid === 0 ? 'ok' : 'warning',
    detail: upcomingUnpaid === 0 ? 'Tot cobrat' : `⚠️ ${upcomingUnpaid} reserves sense dipòsit!`,
  });

  // 9. Inventari amb valor 0
  const zeroValueItems = await prisma.inventoryItem.count({ where: { value: 0 } });
  results.push({
    name: 'Inventari valor 0€',
    status: zeroValueItems === 0 ? 'ok' : 'warning',
    detail: zeroValueItems === 0 ? 'Tot valorat' : `${zeroValueItems} items sense valor`,
  });

  printResults(results);
}

function printResults(results: CheckResult[]) {
  console.log('═══════════════════════════════════════════════════════');
  const icons = { ok: '✅', warning: '⚠️ ', error: '❌' };
  for (const r of results) {
    console.log(`  ${icons[r.status]} ${r.name}: ${r.detail}`);
  }
  console.log('═══════════════════════════════════════════════════════');
  const errors = results.filter((r) => r.status === 'error').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  const ok = results.filter((r) => r.status === 'ok').length;
  console.log(`\n  ${ok} ok · ${warnings} avisos · ${errors} errors`);
  if (errors === 0 && warnings === 0) console.log('  🎉 Tot perfecte!');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
