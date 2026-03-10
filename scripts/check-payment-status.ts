/**
 * Semàfor de pagaments — estat cobraments
 * =========================================
 * Mostra l'estat de pagament de totes les reserves actives amb colors semàfor.
 *
 * Executar: npx tsx scripts/check-payment-status.ts
 *
 * Semàfor:
 *   🟢 Verd — Tot cobrat (dipòsit + resta)
 *   🟡 Groc — Dipòsit cobrat, falta resta
 *   🔴 Vermell — Res cobrat
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚦 Semàfor de pagaments\n');

  const bookings = await prisma.booking.findMany({
    where: { status: { notIn: ['CANCELLED', 'COMPLETED'] } },
    orderBy: { eventDate: 'asc' },
    select: {
      reference: true, clientName: true, eventDate: true, eventLocation: true,
      total: true, depositAmount: true, remainingAmount: true,
      depositPaid: true, remainingPaid: true, status: true,
    },
  });

  if (bookings.length === 0) {
    console.log('  Cap reserva activa.');
    return;
  }

  let green = 0, yellow = 0, red = 0;

  console.log('  Estat  Ref            Client                    Data         Total    Pendent    Lloc');
  console.log('  ─────  ─────────────  ────────────────────────  ───────────  ───────  ─────────  ────────────');

  for (const b of bookings) {
    const total = Number(b.total) || 0;
    const deposit = Number(b.depositAmount) || 0;
    const remaining = Number(b.remainingAmount) || 0;

    let icon: string;
    let pending: number;

    if (b.depositPaid && b.remainingPaid) {
      icon = '🟢'; green++;
      pending = 0;
    } else if (b.depositPaid) {
      icon = '🟡'; yellow++;
      pending = remaining;
    } else {
      icon = '🔴'; red++;
      pending = total;
    }

    const date = b.eventDate
      ? new Date(b.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    const daysUntil = b.eventDate
      ? Math.max(0, Math.floor((new Date(b.eventDate).getTime() - Date.now()) / 86400000))
      : null;

    const urgency = daysUntil !== null && daysUntil <= 7 && !b.depositPaid ? ' ⚠️' : '';

    console.log(
      `  ${icon}${urgency.padEnd(5)}` +
      `${(b.reference || '').padEnd(15)}` +
      `${(b.clientName || '').slice(0, 24).padEnd(26)}` +
      `${date.padEnd(13)}` +
      `${(total + '€').padEnd(9)}` +
      `${(pending > 0 ? pending + '€' : '—').padEnd(11)}` +
      `${b.eventLocation || ''}`
    );
  }

  console.log('\n  ───────────────────────────────────────────────');
  console.log(`  🟢 ${green} tot cobrat · 🟡 ${yellow} falta resta · 🔴 ${red} res cobrat`);
  console.log(`  Total reserves: ${bookings.length}`);

  if (red > 0) {
    const totalUnpaid = bookings
      .filter((b) => !b.depositPaid)
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    console.log(`  ⚠️  Import total sense dipòsit: ${totalUnpaid.toLocaleString('ca-ES')} €`);
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
