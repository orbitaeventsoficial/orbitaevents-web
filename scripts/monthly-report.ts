/**
 * Informe mensual comparatiu
 * ===========================
 * Genera un resum del mes actual vs. anterior:
 * leads, reserves, ingressos, conversió, fonts.
 *
 * Executar:
 *   npx tsx scripts/monthly-report.ts              # Mes actual
 *   npx tsx scripts/monthly-report.ts 2026-02      # Mes específic
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseMonth(arg?: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based

  if (arg && /^\d{4}-\d{2}$/.test(arg)) {
    const [y, m] = arg.split('-').map(Number);
    year = y;
    month = m - 1;
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const label = start.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  return { start, end, label };
}

function prevMonth(d: Date): { start: Date; end: Date; label: string } {
  const prev = new Date(d);
  prev.setMonth(prev.getMonth() - 1);
  return parseMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
}

function pct(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+∞%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(0)}%`;
}

async function getStats(start: Date, end: Date) {
  const [
    leads,
    bookings,
    wonLeads,
    lostLeads,
    revenue,
    sourceBreakdown,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.lead.count({ where: { status: 'WON', updatedAt: { gte: start, lt: end } } }),
    prisma.lead.count({ where: { status: 'LOST', updatedAt: { gte: start, lt: end } } }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: start, lt: end }, status: { notIn: ['CANCELLED'] } },
      _sum: { total: true },
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { createdAt: { gte: start, lt: end } },
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.total) || 0;
  const conversionRate = (wonLeads + lostLeads) > 0
    ? (wonLeads / (wonLeads + lostLeads)) * 100
    : 0;

  return {
    leads,
    bookings,
    wonLeads,
    lostLeads,
    totalRevenue,
    conversionRate,
    sources: sourceBreakdown.map((s) => ({
      source: s.source || 'desconegut',
      count: s._count,
    })),
  };
}

async function main() {
  const arg = process.argv[2];
  const current = parseMonth(arg);
  const previous = prevMonth(current.start);

  console.log(`📊 Informe mensual: ${current.label}\n`);

  const [cur, prev] = await Promise.all([
    getStats(current.start, current.end),
    getStats(previous.start, previous.end),
  ]);

  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Mètrica               ${current.label.padEnd(18)} ${previous.label.padEnd(18)} Canvi`);
  console.log('  ─────────────────────  ──────────────────  ──────────────────  ──────');

  const rows = [
    ['Leads entrants', cur.leads, prev.leads],
    ['Reserves creades', cur.bookings, prev.bookings],
    ['Leads guanyats', cur.wonLeads, prev.wonLeads],
    ['Leads perduts', cur.lostLeads, prev.lostLeads],
    ['Conversio (%)', cur.conversionRate, prev.conversionRate],
    ['Ingressos (EUR)', cur.totalRevenue, prev.totalRevenue],
  ] as const;

  for (const [label, curVal, prevVal] of rows) {
    const curStr = typeof curVal === 'number' && label.includes('EUR')
      ? curVal.toLocaleString('ca-ES') + ' EUR'
      : typeof curVal === 'number' && label.includes('%')
      ? curVal.toFixed(1) + '%'
      : String(curVal);

    const prevStr = typeof prevVal === 'number' && label.includes('EUR')
      ? prevVal.toLocaleString('ca-ES') + ' EUR'
      : typeof prevVal === 'number' && label.includes('%')
      ? prevVal.toFixed(1) + '%'
      : String(prevVal);

    const change = pct(Number(curVal), Number(prevVal));
    console.log(`  ${String(label).padEnd(23)} ${curStr.padEnd(20)} ${prevStr.padEnd(20)} ${change}`);
  }

  // Fonts
  if (cur.sources.length > 0) {
    console.log('\n  📡 Fonts de leads:');
    for (const s of cur.sources) {
      const bar = '█'.repeat(Math.min(30, Math.round((s.count / cur.leads) * 30)));
      console.log(`    ${s.source.padEnd(15)} ${String(s.count).padEnd(4)} ${bar}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');

  // Alertes
  const alerts: string[] = [];
  if (cur.leads < prev.leads * 0.7) alerts.push('Caiguda significativa de leads (-30%)');
  if (cur.conversionRate < prev.conversionRate * 0.8) alerts.push('Conversio en descens');
  if (cur.totalRevenue < prev.totalRevenue * 0.7) alerts.push('Ingressos en descens significatiu');
  if (cur.leads > prev.leads * 1.3) alerts.push('Creixement notable de leads (+30%)');

  if (alerts.length > 0) {
    console.log('\n  Alertes:');
    for (const a of alerts) {
      console.log(`    ⚠️  ${a}`);
    }
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
