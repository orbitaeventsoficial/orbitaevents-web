/**
 * Diagnòstic d'estat del negoci
 * ===============================
 * Genera un informe realista de com està el negoci *ara mateix* a Railway.
 * No és un audit tècnic — és una radiografia del flux comercial: captació,
 * conversió, ingressos, orígens, ritme. Serveix per prendre decisions de
 * màrqueting amb dades reals, no per intuïció.
 *
 * Executar: npx tsx scripts/business-state.ts
 */

import { PrismaClient, LeadStatus, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

type Section = {
  title: string;
  lines: string[];
};

function fmtEur(n: number): string {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}

function bar(n: number, max: number, width = 20): string {
  if (max === 0) return ' '.repeat(width);
  const filled = Math.round((n / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function hr(): string {
  return '─'.repeat(68);
}

async function main() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY);
  const oneYearAgo = new Date(now.getTime() - 365 * DAY);

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           DIAGNÒSTIC D\'ESTAT DEL NEGOCI — ÒRBITA EVENTS          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`Generat: ${now.toLocaleString('ca-ES')}\n`);

  // ─── Connexió ──────────────────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.error('❌ No es pot connectar a la BD. Revisa DATABASE_URL.');
    process.exit(1);
  }

  const sections: Section[] = [];

  // ─── 1. CAPTACIÓ ────────────────────────────────────────────────────────
  const [
    leadsTotal,
    leadsLast7d,
    leadsLast30d,
    leadsLast90d,
    leadsLastYear,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: oneYearAgo } } }),
  ]);

  const capturaLines = [
    `Total històric:        ${leadsTotal} leads`,
    `Últim any:             ${leadsLastYear} leads (${(leadsLastYear / 12).toFixed(1)}/mes mitjana)`,
    `Últims 90 dies:        ${leadsLast90d} leads (${(leadsLast90d / 3).toFixed(1)}/mes)`,
    `Últims 30 dies:        ${leadsLast30d} leads`,
    `Últims 7 dies:         ${leadsLast7d} leads`,
  ];

  // Diagnòstic visual de ritme
  if (leadsLast7d === 0) {
    capturaLines.push('');
    capturaLines.push('🏜️  SEQUERA — 0 leads en 7 dies. Focus: atraure, no gestionar.');
  } else if (leadsLast7d <= 2) {
    capturaLines.push('');
    capturaLines.push('⚠️  FAMINE — volum insuficient per sostenir el negoci.');
  } else if (leadsLast7d <= 5) {
    capturaLines.push('');
    capturaLines.push('📉 BAIX — els canals actuals no donen prou.');
  } else if (leadsLast7d <= 10) {
    capturaLines.push('');
    capturaLines.push('✅ SALUDABLE — volum estable. Palanca: conversió.');
  } else {
    capturaLines.push('');
    capturaLines.push('🚀 CREIXENT — palanca: escalar canals rendibles.');
  }

  sections.push({ title: '1. CAPTACIÓ — quants leads entren', lines: capturaLines });

  // ─── 2. ORIGEN DELS LEADS ──────────────────────────────────────────────
  const sourceGroups = await prisma.lead.groupBy({
    by: ['source'],
    where: { createdAt: { gte: ninetyDaysAgo } },
    _count: { source: true },
  });

  const sourceTotal = sourceGroups.reduce((sum, g) => sum + g._count.source, 0);
  const sourceLines: string[] = [];

  if (sourceTotal === 0) {
    sourceLines.push('(cap lead als últims 90 dies)');
  } else {
    const sorted = [...sourceGroups].sort((a, b) => b._count.source - a._count.source);
    const maxCount = sorted[0]._count.source;
    for (const g of sorted) {
      const pad = g.source.padEnd(14);
      const count = String(g._count.source).padStart(4);
      sourceLines.push(`${pad} ${bar(g._count.source, maxCount)} ${count}  ${fmtPct(g._count.source, sourceTotal)}`);
    }
  }

  sections.push({ title: '2. ORIGEN DELS LEADS (últims 90 dies)', lines: sourceLines });

  // ─── 3. ESTAT DELS LEADS (embut) ───────────────────────────────────────
  const statusGroups = await prisma.lead.groupBy({
    by: ['status'],
    where: { createdAt: { gte: ninetyDaysAgo } },
    _count: { status: true },
  });

  const statusMap = new Map<LeadStatus, number>();
  for (const g of statusGroups) statusMap.set(g.status, g._count.status);

  const embudeOrder: LeadStatus[] = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'];
  const embudLines: string[] = [];
  const embudMax = Math.max(1, ...embudeOrder.map((s) => statusMap.get(s) ?? 0));

  for (const status of embudeOrder) {
    const count = statusMap.get(status) ?? 0;
    const pad = status.padEnd(14);
    embudLines.push(`${pad} ${bar(count, embudMax)} ${String(count).padStart(4)}  ${fmtPct(count, sourceTotal)}`);
  }

  const won90d = statusMap.get('WON') ?? 0;
  const lost90d = statusMap.get('LOST') ?? 0;
  const closed90d = won90d + lost90d;
  const conversionRate = closed90d > 0 ? Math.round((won90d / closed90d) * 100) : 0;

  embudLines.push('');
  embudLines.push(
    `Conversió WON/(WON+LOST): ${won90d}/${closed90d} = ${conversionRate}%${
      closed90d === 0 ? ' (cap cas tancat)' : ''
    }`
  );

  sections.push({ title: '3. EMBUT DE LEADS (estat, 90d)', lines: embudLines });

  // ─── 4. RESERVES I INGRESSOS ───────────────────────────────────────────
  const [
    bookingsTotal,
    bookingsLast30d,
    bookingsLast90d,
    bookingsUpcoming,
    revenueAgg,
    revenue90dAgg,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
    prisma.booking.count({
      where: {
        eventDate: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
      },
    }),
    prisma.booking.aggregate({
      _sum: { total: true },
      where: { status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] } },
    }),
    prisma.booking.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] },
        createdAt: { gte: ninetyDaysAgo },
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const revenue90d = revenue90dAgg._sum.total ?? 0;
  const avgTicket = bookingsTotal > 0 ? totalRevenue / bookingsTotal : 0;

  const reservesLines = [
    `Reserves totals:         ${bookingsTotal}`,
    `Reserves últims 90d:     ${bookingsLast90d}`,
    `Reserves últims 30d:     ${bookingsLast30d}`,
    `Events futurs oberts:    ${bookingsUpcoming}`,
    '',
    `Ingressos totals:        ${fmtEur(totalRevenue)}`,
    `Ingressos últims 90d:    ${fmtEur(revenue90d)}`,
    `Ticket mig:              ${fmtEur(avgTicket)}`,
  ];

  sections.push({ title: '4. RESERVES I INGRESSOS', lines: reservesLines });

  // ─── 5. CONVERSIÓ GLOBAL (LEAD → BOOKING) ──────────────────────────────
  // Bookings amb leadId (vingueren d'un lead) vs directes
  const [bookingsFromLead, bookingsDirect] = await Promise.all([
    prisma.booking.count({
      where: { leadId: { not: null }, createdAt: { gte: ninetyDaysAgo } },
    }),
    prisma.booking.count({
      where: { leadId: null, createdAt: { gte: ninetyDaysAgo } },
    }),
  ]);

  const leadToBookingRate =
    leadsLast90d > 0 ? Math.round((bookingsFromLead / leadsLast90d) * 100) : 0;

  const conversioLines = [
    `Leads últims 90d:                  ${leadsLast90d}`,
    `Reserves d'aquests leads:          ${bookingsFromLead}`,
    `Reserves directes (sense lead):    ${bookingsDirect}`,
    '',
    `Conversió Lead→Booking (90d):      ${leadToBookingRate}%`,
  ];

  if (leadsLast90d > 0 && leadToBookingRate < 10) {
    conversioLines.push('');
    conversioLines.push('⚠️  Conversió molt baixa. Revisa resposta, pricing, seguiment.');
  }

  sections.push({ title: '5. CONVERSIÓ GLOBAL (90d)', lines: conversioLines });

  // ─── 6. LEADS ESTANCATS ────────────────────────────────────────────────
  const [staleNew, staleContacted, staleQuote, oldestNew] = await Promise.all([
    prisma.lead.count({
      where: {
        status: 'NEW',
        createdAt: { lt: new Date(now.getTime() - 2 * DAY) },
      },
    }),
    prisma.lead.count({
      where: {
        status: 'CONTACTED',
        updatedAt: { lt: new Date(now.getTime() - 5 * DAY) },
      },
    }),
    prisma.lead.count({
      where: {
        status: 'QUOTE_SENT',
        updatedAt: { lt: new Date(now.getTime() - 7 * DAY) },
      },
    }),
    prisma.lead.findFirst({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, name: true },
    }),
  ]);

  const estancatsLines = [
    `NEW > 2 dies sense contactar:      ${staleNew}`,
    `CONTACTED > 5 dies sense activitat: ${staleContacted}`,
    `QUOTE_SENT > 7 dies sense resposta: ${staleQuote}`,
  ];

  if (oldestNew) {
    const days = Math.floor((now.getTime() - oldestNew.createdAt.getTime()) / DAY);
    estancatsLines.push('');
    estancatsLines.push(`El més antic en NEW: ${oldestNew.name} (${days} dies)`);
  }

  sections.push({ title: '6. LEADS ESTANCATS', lines: estancatsLines });

  // ─── 7. CLIENTS I REPETICIÓ ────────────────────────────────────────────
  const [customersTotal, customersRepeat] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({
      where: { bookings: { some: {} } },
    }),
  ]);

  // Clients amb més d'1 booking
  const customersWithMultipleBookings = await prisma.customer.findMany({
    where: { bookings: { some: {} } },
    select: { _count: { select: { bookings: true } } },
  });
  const repeatCustomers = customersWithMultipleBookings.filter((c) => c._count.bookings > 1).length;

  const clientsLines = [
    `Clients totals:          ${customersTotal}`,
    `Amb alguna reserva:      ${customersRepeat}`,
    `Repetidors (>1 reserva): ${repeatCustomers}`,
  ];

  if (customersRepeat > 0) {
    const repeatRate = Math.round((repeatCustomers / customersRepeat) * 100);
    clientsLines.push(`Taxa de repetició:       ${repeatRate}%`);
  }

  sections.push({ title: '7. CLIENTS I REPETICIÓ', lines: clientsLines });

  // ─── 8. VEREDICTE ──────────────────────────────────────────────────────
  const veredicteLines: string[] = [];

  if (leadsLast90d === 0) {
    veredicteLines.push('🏜️  Cap lead en 90 dies. El problema no és el CRM — és la captació.');
    veredicteLines.push('    Acció: /admin/manual → Fase 0 i Fase 1 del pla.');
  } else if (leadsLast30d === 0) {
    veredicteLines.push('⚠️  Cap lead en 30 dies. Ritme aturat.');
    veredicteLines.push('    Acció: revisa Google Business, Instagram, ressenyes, partners.');
  } else if (leadsLast7d === 0) {
    veredicteLines.push('📉 Cap lead aquesta setmana però hi ha flux recent.');
    veredicteLines.push('    Acció: reforç puntual dels canals que ja funcionaven.');
  } else if (leadToBookingRate < 10 && leadsLast90d >= 10) {
    veredicteLines.push('🔧 Hi ha leads però no es converteixen bé.');
    veredicteLines.push('    Acció: revisa SLA de resposta, pricing, qualitat del pressupost.');
  } else if (bookingsUpcoming === 0 && bookingsTotal > 0) {
    veredicteLines.push('📅 Agenda buida — no hi ha events futurs oberts.');
    veredicteLines.push('    Acció: activació de la base de clients existents + captació nova.');
  } else {
    veredicteLines.push('✅ Flux operatiu. Revisa palanques de creixement a /admin/reporting.');
  }

  sections.push({ title: '8. VEREDICTE', lines: veredicteLines });

  // ─── Render ────────────────────────────────────────────────────────────
  for (const section of sections) {
    console.log(`\n${section.title}`);
    console.log(hr());
    for (const line of section.lines) console.log(line);
  }

  console.log('');
  console.log(hr());
  console.log('Fi del diagnòstic. Per veure el panell visual: /admin (dashboard).');
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error executant el diagnòstic:', e);
  await prisma.$disconnect();
  process.exit(1);
});
