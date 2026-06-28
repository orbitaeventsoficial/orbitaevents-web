// scripts/seed-pack-inventory.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Assigna inventari als packs (model PackInventory) segons l'esborrany aprovat
// (docs/audit/esborrany-inventari-packs.md). Desbloqueja l'amortització real i el
// preu recomanat (D1). Idempotent: reconstrueix l'inventari de cada pack tractat.
//
// Ús:   node scripts/seed-pack-inventory.mjs           (aplica)
//       node scripts/seed-pack-inventory.mjs --dry     (simula, no escriu)
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY = process.argv.includes('--dry');

// Kit base (TIER 1) — el mínim per fer sonar i il·luminar un bolo. [nom exacte, qt]
const KIT_BASE = [
  ['Controladora Pioneer DDJ-REV7', 1],
  ['Auriculars Pioneer HDJ-CX', 1],
  ['EV ETX-12P 2000W', 2],
  ['Micròfon sense fils', 1],
  ['Cabina DJ Professional', 1],
  ['Tela blanca cabina', 1],
  ['Trípode #1', 2],
  ['Focus Bash LED', 2],
  ['Cablejat DMX (lot)', 1],
  ['Allargo 50 metres', 1],
  ['Allargo 3m + multiendoll #1', 1],
  ['Portàtil HP OMEN', 1],
  ['Líquid de fum', 1],
];

// Afegit TIER 2 (premium) — més llum i efectes.
const KIT_PREMIUM_ADD = [
  ['Cap Mòbil 150W LED', 2],
  ['Multiefectes LED', 1],
  ['Màquina de fum', 1],
  ["Màquina d'Espurnes Fredes", 1],
  ['Allargo 3m + multiendoll #2', 1],
  ['Líquid de fum (5L)', 1],
];

// Afegit TIER 3 (luxury) — kit complet. Cap Mòbil puja a 4 (override).
const KIT_LUXURY_ADD = [
  ['Cap Mòbil 150W LED', 4], // override: 4 caps mòbils
  ['Canó CO2', 1],
  ['Canó de Confeti', 1],
  ['Màquina de Bombolles', 1],
  ['GoPro 11', 1],
];

// Composició: l'override de quantitat guanya (es desa l'últim).
function compose(...kits) {
  const map = new Map();
  for (const kit of kits) for (const [name, qty] of kit) map.set(name, qty);
  return [...map.entries()].map(([name, quantity]) => ({ name, quantity }));
}

const TIER1 = compose(KIT_BASE);
const TIER2 = compose(KIT_BASE, KIT_PREMIUM_ADD);
const TIER3 = compose(KIT_BASE, KIT_PREMIUM_ADD, KIT_LUXURY_ADD);

// Assignació pack(slug) → kit.
const PACK_KITS = {
  'disco-basico': TIER1,
  'bodas-basico': TIER1,
  'empresas-cocktail': TIER1,
  'bingo-musical': TIER1,
  'batalla-musical': TIER1,
  'disco-premium': TIER2,
  'bodas-premium': TIER2,
  'empresas-gala': TIER2,
  'empresas-evento': TIER2,
  'disco-completo': TIER2,
  'bodas-luxury': TIER3,
};

async function main() {
  console.log(`── Seed inventari→packs ${DRY ? '(DRY RUN, no escriu)' : '(APLICANT)'} ──\n`);

  // Cau de items per nom (primer match — les quantitats es gestionen a PackInventory.quantity).
  const items = await prisma.inventoryItem.findMany({ select: { id: true, name: true } });
  const byName = new Map();
  for (const it of items) if (!byName.has(it.name)) byName.set(it.name, it.id);

  let totalLinks = 0;
  const missing = new Set();

  for (const [slug, kit] of Object.entries(PACK_KITS)) {
    const pack = await prisma.pack.findFirst({ where: { slug }, select: { id: true, slug: true } });
    if (!pack) { console.log(`⚠️  pack no trobat: ${slug}`); continue; }

    const rows = [];
    for (const { name, quantity } of kit) {
      const itemId = byName.get(name);
      if (!itemId) { missing.add(name); continue; }
      rows.push({ itemId, quantity });
    }

    if (!DRY) {
      // Reconstrucció neta: esborra l'inventari previ del pack i el recrea.
      await prisma.packInventory.deleteMany({ where: { packId: pack.id } });
      await prisma.packInventory.createMany({
        data: rows.map((r) => ({ packId: pack.id, itemId: r.itemId, quantity: r.quantity })),
      });
    }
    totalLinks += rows.length;
    console.log(`  ${slug.padEnd(20)} → ${rows.length} items (${rows.reduce((s, r) => s + r.quantity, 0)} unitats)`);
  }

  if (missing.size) {
    console.log(`\n⚠️  items no trobats per nom (revisar): ${[...missing].join(', ')}`);
  }
  console.log(`\n✅ ${DRY ? 'Simulat' : 'Aplicat'}: ${totalLinks} vincles pack↔item en ${Object.keys(PACK_KITS).length} packs.`);
  if (DRY) console.log('   (Re-executa sense --dry per aplicar.)');

  await prisma.$disconnect();
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
