/**
 * Detector de leads estancats
 * ===========================
 * Identifica leads que necessiten atenció: sense contactar, sense activitat recent,
 * o amb dates d'event properes sense acció.
 *
 * Executar: npx tsx scripts/check-stale-leads.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔎 Detector de leads estancats\n');

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  // 1. Leads NEW sense contactar (>48h)
  const newUncontacted = await prisma.lead.findMany({
    where: {
      status: 'NEW',
      createdAt: { lt: twoDaysAgo },
    },
    select: { id: true, name: true, email: true, createdAt: true, eventDate: true, source: true },
    orderBy: { createdAt: 'asc' },
  });

  // 2. Leads CONTACTED sense activitat (>7 dies)
  const staleContacted = await prisma.lead.findMany({
    where: {
      status: 'CONTACTED',
      updatedAt: { lt: sevenDaysAgo },
    },
    select: { id: true, name: true, email: true, updatedAt: true, eventDate: true },
    orderBy: { updatedAt: 'asc' },
  });

  // 3. Leads NEGOTIATING sense activitat (>14 dies)
  const staleNegotiating = await prisma.lead.findMany({
    where: {
      status: 'NEGOTIATING',
      updatedAt: { lt: fourteenDaysAgo },
    },
    select: { id: true, name: true, email: true, updatedAt: true, eventDate: true },
    orderBy: { updatedAt: 'asc' },
  });

  // 4. Leads amb event <14 dies que no son WON ni LOST
  const urgentEventDate = new Date(now.getTime() + 14 * 86400000);
  const urgentLeads = await prisma.lead.findMany({
    where: {
      eventDate: { gte: now, lte: urgentEventDate },
      status: { notIn: ['WON', 'LOST'] },
    },
    select: { id: true, name: true, email: true, status: true, eventDate: true },
    orderBy: { eventDate: 'asc' },
  });

  // 5. Leads QUOTE_SENT sense resposta (>7 dies)
  const staleQuotes = await prisma.lead.findMany({
    where: {
      status: 'QUOTE_SENT',
      updatedAt: { lt: sevenDaysAgo },
    },
    select: { id: true, name: true, email: true, updatedAt: true, eventDate: true },
    orderBy: { updatedAt: 'asc' },
  });

  // Report
  console.log('═══════════════════════════════════════════════════════');

  type LeadRow = { id: string; name: string; email: string; eventDate: Date | null; createdAt?: Date; updatedAt?: Date; status?: string; source?: string };

  const sections: { title: string; items: LeadRow[]; dateField: 'createdAt' | 'updatedAt' | 'eventDate' }[] = [
    { title: '🆕 Leads nous sense contactar (>48h)', items: newUncontacted as LeadRow[], dateField: 'createdAt' },
    { title: '📞 Leads contactats sense seguiment (>7d)', items: staleContacted as LeadRow[], dateField: 'updatedAt' },
    { title: '📄 Pressupostos sense resposta (>7d)', items: staleQuotes as LeadRow[], dateField: 'updatedAt' },
    { title: '🤝 Negociacions estancades (>14d)', items: staleNegotiating as LeadRow[], dateField: 'updatedAt' },
    { title: '⚠️  Events en <14 dies sense confirmar', items: urgentLeads as LeadRow[], dateField: 'eventDate' },
  ];

  let totalStale = 0;

  for (const section of sections) {
    if (section.items.length === 0) continue;
    totalStale += section.items.length;
    console.log(`\n  ${section.title} (${section.items.length})`);
    console.log('  ────────────────────────────────────────');
    for (const item of section.items) {
      const dateVal = item[section.dateField] as Date | null | undefined;
      const dateStr = dateVal
        ? new Date(dateVal).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
      const daysAgo = dateVal
        ? Math.floor((now.getTime() - new Date(dateVal).getTime()) / 86400000)
        : null;
      const daysLabel = section.dateField === 'eventDate'
        ? (daysAgo !== null && daysAgo < 0 ? `en ${Math.abs(daysAgo)}d` : `fa ${daysAgo}d`)
        : `fa ${daysAgo}d`;

      console.log(`    ${(item.name || '').slice(0, 25).padEnd(27)} ${(item.email || '').slice(0, 25).padEnd(27)} ${dateStr.padEnd(14)} ${daysLabel}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  if (totalStale === 0) {
    console.log('  ✅ Cap lead estancat! Tot al dia.');
  } else {
    console.log(`  ⚠️  ${totalStale} leads necessiten atenció`);
    console.log('  Revisa la safata d\'entrades: /admin/leads');
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
