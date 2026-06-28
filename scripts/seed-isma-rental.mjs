// scripts/seed-isma-rental.mjs
// Modela la realitat del so (propietari, 2026-06-28):
//  - Els EV ETX-12P són un DESIG futur (encara NO comprats) → fora dels packs + RETIRED.
//  - El so es lloga al col·laborador ISMA per 50€/bolo → es resta al marge (com Masquerade).
// Idempotent. El cost de 50€/bolo s'aplica per reserva com a línia de servei amb collaboratorId=Isma.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Col·laborador Isma (lloguer d'altaveus)
  let isma = await prisma.collaborator.findFirst({ where: { name: 'Isma' } });
  if (!isma) {
    isma = await prisma.collaborator.create({
      data: {
        name: 'Isma',
        specialty: "Lloguer d'altaveus (PA)",
        roles: ['EQUIPMENT_RENTAL'],
        pricingModel: 'DISCOUNT',
        commissionPct: 0,
        notes: 'Lloga el so per 50€/bolo (JBL + Mackie). Es resta al marge com a cost de col·laborador. Substitueix el somni dels EV ETX-12P (encara no comprats).',
        isActive: true,
        isFavorite: true,
      },
    });
    console.log(`✅ Col·laborador Isma creat: ${isma.id}`);
  } else {
    console.log(`⏭️  Isma ja existeix: ${isma.id}`);
  }

  // 2. EV ETX-12P → desig futur: fora dels packs + RETIRED
  const evs = await prisma.inventoryItem.findMany({ where: { code: { in: ['ALT-001', 'ALT-002'] } }, select: { id: true, code: true } });
  for (const ev of evs) {
    await prisma.packInventory.deleteMany({ where: { itemId: ev.id } });
    await prisma.inventoryItem.update({
      where: { id: ev.id },
      data: {
        status: 'RETIRED',
        notes: '🎯 DESIG/FUTUR — encara NO comprat. Ara el so es lloga a Isma (50€/bolo). Reactivar (status AVAILABLE + tornar als packs) quan es compri. Preu referència nou: ~1.444€.',
      },
    });
    console.log(`✅ ${ev.code} → fora dels packs + marcat FUTUR`);
  }

  console.log('\nNota: el cost de so (50€/bolo) s\'aplica per reserva com a línia de servei amb collaboratorId d\'Isma.');
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
