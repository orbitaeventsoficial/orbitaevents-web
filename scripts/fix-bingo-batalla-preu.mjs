/**
 * Correcció Bingo/Batalla Musical (Masquerade) — ordre del propietari 2026-06-09.
 *
 * Decisió: bingo i batalla = 1,5h, AMB tècnic de so inclòs i assignable.
 * Preu: cost 200 (160 animació + 40 tècnic) → PVP resellPrice(200) = 240.
 *
 * Accions (idempotent, NO destructiu — només updates + isActive=false):
 *  - Bingo Musical i Batalla Musical (cat "Animació adulta") → cost 200, PVP 240,
 *    crew amb tècnic inclòs, durada 1h 30. El configurador el desdobla en
 *    Carlos/equip + línia de tècnic inclosa per decidir qui el fa/cobra.
 *  - Desactiva el duplicat "Bingo musical" (cat "Bingo").
 *  - Desactiva "Tècnic de so (bingo)" (ja inclòs al preu, no es desglossa).
 *
 * Executar: node scripts/fix-bingo-batalla-preu.mjs
 */
import { PrismaClient } from '@prisma/client';
import { resellPrice } from '../lib/constants/pricing.ts';

const prisma = new PrismaClient();
const COST = 200;
const PVP = resellPrice(COST); // 240
const CREW = 'Presentador + tècnic de so + equip propi';
const DURATION = '1h 30';

async function main() {
  console.log(`Objectiu: cost ${COST}€ → PVP ${PVP}€ (tècnic inclòs).`);

  // 1. Actualitzar els canònics (cat "Animació adulta").
  const canonical = await prisma.collaboratorProduct.findMany({
    where: { category: 'Animació adulta', name: { in: ['Bingo Musical', 'Batalla Musical'] } },
  });
  for (const p of canonical) {
    await prisma.collaboratorProduct.update({
      where: { id: p.id },
      data: { costPrice: COST, sellPrice: PVP, crew: CREW, durationLabel: DURATION, isActive: true },
    });
    console.log(`✓ ${p.name}: ${p.costPrice}€/${p.sellPrice}€ → ${COST}€/${PVP}€`);
  }

  // 2. Desactivar duplicats i l'antic tècnic ofert com extra independent (no esborrar).
  const toDisable = await prisma.collaboratorProduct.findMany({
    where: {
      isActive: true,
      OR: [
        { category: 'Bingo' },                 // duplicat "Bingo musical"
        { name: { contains: 'Tècnic de so (bingo)' } },
      ],
    },
  });
  for (const p of toDisable) {
    await prisma.collaboratorProduct.update({ where: { id: p.id }, data: { isActive: false } });
    console.log(`• Desactivat (sobrant): ${p.name} [${p.category}]`);
  }

  console.log(`\nResum: ${canonical.length} actualitzats, ${toDisable.length} desactivats.`);
}

main()
  .catch((e) => { console.error('✗ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
