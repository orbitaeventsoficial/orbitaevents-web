/**
 * Recalcular marges de totes les reserves
 * =========================================
 * Actualitza els camps financers calculats de cada reserva.
 *
 * Executar: npx tsx scripts/recalculate-margins.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VAT_RATE = 0.21;
const DEPOSIT_PERCENT = 0.30;

async function main() {
  console.log('💰 Recalculant marges de totes les reserves...\n');

  // Obtenir cost/km actual
  const fuelSetting = await prisma.setting.findUnique({ where: { key: 'fuel.costPerKm' } });
  const costPerKm = fuelSetting ? parseFloat(fuelSetting.value) : 0.15;
  const freeKmSetting = await prisma.setting.findUnique({ where: { key: 'pricing.freeKm' } });
  const freeKm = freeKmSetting ? parseInt(freeKmSetting.value) : 25;

  console.log(`  Config: ${costPerKm.toFixed(4)} €/km, ${freeKm} km gratuïts\n`);

  const bookings = await prisma.booking.findMany({
    where: { status: { notIn: ['CANCELLED'] } },
    select: {
      id: true, reference: true, total: true, subtotal: true,
      discount: true, vatAmount: true, depositAmount: true,
      remainingAmount: true, depositPaid: true, remainingPaid: true,
      distanceKm: true,
    },
  });

  let updated = 0;
  let issues: string[] = [];

  for (const b of bookings) {
    const subtotal = Number(b.subtotal) || 0;
    const discount = Number(b.discount) || 0;
    const netSubtotal = subtotal - discount;
    const vatAmount = parseFloat((netSubtotal * VAT_RATE).toFixed(2));
    const total = parseFloat((netSubtotal + vatAmount).toFixed(2));
    const depositAmount = parseFloat((total * DEPOSIT_PERCENT).toFixed(2));
    const remainingAmount = parseFloat((total - depositAmount).toFixed(2));

    // Cost desplaçament
    const distanceKm = Number(b.distanceKm) || 0;
    const extraKm = Math.max(0, distanceKm - freeKm);
    const travelCost = parseFloat((extraKm * costPerKm * 2).toFixed(2)); // Anada i tornada

    const currentTotal = Number(b.total) || 0;
    const needsUpdate = Math.abs(currentTotal - total) > 0.01 ||
      Math.abs((Number(b.vatAmount) || 0) - vatAmount) > 0.01 ||
      Math.abs((Number(b.depositAmount) || 0) - depositAmount) > 0.01;

    if (needsUpdate) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { vatAmount, total, depositAmount, remainingAmount },
      });
      updated++;
      console.log(`  ↻ ${b.reference}: ${currentTotal}€ → ${total}€ (IVA: ${vatAmount}€)`);
    }

    // Detectar anomalies
    if (total <= 0 && subtotal > 0) issues.push(`${b.reference}: total 0€ amb subtotal ${subtotal}€`);
    if (b.depositPaid && (Number(b.depositAmount) || 0) <= 0) issues.push(`${b.reference}: dipòsit pagat però import 0€`);
  }

  console.log(`\n✅ ${updated} reserves actualitzades (de ${bookings.length} total)`);

  if (issues.length > 0) {
    console.log(`\n⚠️  ${issues.length} anomalies detectades:`);
    for (const issue of issues) console.log(`   - ${issue}`);
  }
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
