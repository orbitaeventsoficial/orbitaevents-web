/**
 * Informe d'estadístiques del negoci
 * ====================================
 * Genera un resum ràpid de l'estat del negoci.
 *
 * Executar: npx tsx scripts/stats-report.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📈 Generant informe d\'estadístiques...\n');

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  // Leads
  const [totalLeads, newLeadsMonth, wonLeads, lostLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.lead.count({ where: { status: 'WON' } }),
    prisma.lead.count({ where: { status: 'LOST' } }),
  ]);
  const activeLeads = totalLeads - wonLeads - lostLeads;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  // Reserves
  const [totalBookings, confirmedBookings, completedBookings, cancelledBookings] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'PREPARING'] } } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
  ]);

  // Finances
  const bookingsWithTotals = await prisma.booking.findMany({
    where: { status: { notIn: ['CANCELLED'] } },
    select: { total: true, depositPaid: true, remainingAmount: true, depositAmount: true, eventDate: true, status: true },
  });

  let totalRevenue = 0;
  let totalPending = 0;
  let totalDeposits = 0;
  let futureRevenue = 0;

  for (const b of bookingsWithTotals) {
    const t = Number(b.total) || 0;
    totalRevenue += t;
    if (b.depositPaid) totalDeposits += Number(b.depositAmount) || 0;
    totalPending += Number(b.remainingAmount) || 0;
    if (b.eventDate && new Date(b.eventDate) >= now) futureRevenue += t;
  }

  // Reserves properes (7 dies)
  const upcoming7d = await prisma.booking.findMany({
    where: {
      eventDate: { gte: now, lte: new Date(Date.now() + 7 * 86400000) },
      status: { notIn: ['CANCELLED'] },
    },
    select: { reference: true, clientName: true, eventDate: true, eventLocation: true, status: true },
    orderBy: { eventDate: 'asc' },
  });

  // Clients
  const [totalCustomers, customersMonth] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: thisMonth } } }),
  ]);

  // Reserves per mes (any actual)
  const bookingsThisYear = await prisma.booking.findMany({
    where: { eventDate: { gte: thisYear }, status: { notIn: ['CANCELLED'] } },
    select: { eventDate: true },
  });
  const monthlyDistribution = new Array(12).fill(0);
  for (const b of bookingsThisYear) {
    if (b.eventDate) monthlyDistribution[new Date(b.eventDate).getMonth()]++;
  }

  // Output
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📊 INFORME ÒRBITA EVENTS');
  console.log(`  Data: ${now.toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  console.log('═══════════════════════════════════════════════════════');

  console.log('\n  📋 LEADS');
  console.log(`     Total: ${totalLeads} | Actius: ${activeLeads} | Guanyats: ${wonLeads} | Perduts: ${lostLeads}`);
  console.log(`     Nous aquest mes: ${newLeadsMonth}`);
  console.log(`     Taxa conversió: ${conversionRate}%`);

  console.log('\n  📅 RESERVES');
  console.log(`     Total: ${totalBookings} | Confirmades: ${confirmedBookings} | Completades: ${completedBookings} | Cancel·lades: ${cancelledBookings}`);

  console.log('\n  💰 FINANCES');
  console.log(`     Facturació total: ${totalRevenue.toLocaleString('ca-ES')} €`);
  console.log(`     Dipòsits cobrats: ${totalDeposits.toLocaleString('ca-ES')} €`);
  console.log(`     Pendent cobrar: ${totalPending.toLocaleString('ca-ES')} €`);
  console.log(`     Revenue futur: ${futureRevenue.toLocaleString('ca-ES')} €`);

  console.log('\n  👥 CLIENTS');
  console.log(`     Total: ${totalCustomers} | Nous aquest mes: ${customersMonth}`);

  if (upcoming7d.length > 0) {
    console.log('\n  📆 PRÒXIMS 7 DIES');
    for (const b of upcoming7d) {
      const d = new Date(b.eventDate!).toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      console.log(`     ${d} — ${b.clientName} @ ${b.eventLocation} [${b.status}]`);
    }
  } else {
    console.log('\n  📆 Cap reserva en els pròxims 7 dies');
  }

  const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  console.log('\n  📊 DISTRIBUCIÓ MENSUAL (any actual)');
  const maxBar = Math.max(...monthlyDistribution, 1);
  for (let i = 0; i < 12; i++) {
    const bar = '█'.repeat(Math.round((monthlyDistribution[i] / maxBar) * 20));
    const count = monthlyDistribution[i] || '';
    console.log(`     ${months[i]}: ${bar} ${count}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
