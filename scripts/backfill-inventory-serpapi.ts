// scripts/backfill-inventory-serpapi.ts
// Cerca preu+foto+enllaç reals (SerpApi Google Shopping) per als items sense preu.
// Mode revisió (default): mostra el millor candidat, NO escriu.
// Mode aplicar (--apply): escriu preu + font(enllaç) + foto, respectant el model #1199.
// Quota SerpApi: 1 cerca per item. Usar amb mesura (tier 100/mes compartit).
import { prisma } from '@/lib/prisma';
import { searchReplacementCandidates } from '@/lib/services/inventoryReplacementSearchService';

const APPLY = process.argv.includes('--apply');
// Consulta de cerca per codi (sufix per millorar el match dels genèrics).
const QUERY_HINT: Record<string, string> = {
  'AUR-001': 'Pioneer HDJ-CX auriculares DJ',
  'CAM-001': 'GoPro Hero 11 Black',
  'BSH-001': 'foco LED bateria uplighter DJ',
  'BSH-002': 'foco LED bateria uplighter DJ',
  'USB-001': 'luz USB gooseneck cabina DJ',
  'TRI-001': 'tripode altavoz PA soporte',
  'TRI-002': 'tripode altavoz PA soporte',
  'TRI-003': 'tripode iluminacion soporte',
  'TRI-004': 'tripode iluminacion soporte',
  'ALL-001': 'alargador cable 50 metros bobina',
  'ALL-002': 'alargador regleta multienchufe 3m',
  'ALL-003': 'alargador regleta multienchufe 3m',
  'ALL-004': 'alargador regleta multienchufe 3m',
  'DMX-001': 'cable DMX iluminacion lote',
  'HP-ESC1': 'escoba decorativa atrezzo',
  'HP-ESC2': 'escoba decorativa atrezzo',
  'HP-ESC3': 'escoba decorativa atrezzo',
  'HP-ESC4': 'escoba decorativa atrezzo',
  'HP-GAB1': 'jaula decorativa vintage',
  'HP-MIR1': 'espejo rococo decorativo',
  'HP-QUA1': 'cuadro decorativo 70cm',
  'HW-FAN1': 'fantasma gigante decoracion halloween',
  'HW-FAN2': 'fantasma gigante decoracion halloween',
  'LIQ-001': 'liquido maquina de humo 5L',
};

// Overrides manuals: guanyen sobre SerpApi (variant equivocada o sense resultat).
const MANUAL: Record<string, { price: number; source: string }> = {
  'CAM-001': { price: 389.99, source: 'Nootica.es: GoPro Hero11 Black (nova, reposició) (2026-06-28)' },
  'HW-FAN1': { price: 45, source: 'Estimació reposició atrezzo Halloween — sense resultat Shopping (2026-06-28)' },
  'HW-FAN2': { price: 45, source: 'Estimació reposició atrezzo Halloween — sense resultat Shopping (2026-06-28)' },
};

function eur(n: number | null) { return n != null ? n.toFixed(2) + '€' : '—'; }

async function main() {
  console.log(`── Backfill inventari via SerpApi ${APPLY ? '(APLICANT)' : '(REVISIÓ, no escriu)'} ──\n`);
  const items = await prisma.inventoryItem.findMany({
    where: { OR: [{ purchasePrice: null }, { purchasePrice: 0 }] },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
  console.log(`Items sense preu: ${items.length}\n`);

  let applied = 0;
  for (const it of items) {
    const code = it.code ?? '';
    const override = MANUAL[code];
    console.log(`【${code}】 ${it.name}`);

    if (override) {
      console.log(`   ✋ override manual → ${eur(override.price)}`);
      if (APPLY) {
        await prisma.inventoryItem.update({
          where: { id: it.id },
          data: { purchasePrice: override.price, value: override.price, purchasePriceSource: override.source, purchasePriceSourceCheckedAt: new Date() },
        });
        applied++;
      }
      console.log('');
      continue;
    }

    const q = QUERY_HINT[code] || it.name;
    const r = await searchReplacementCandidates(q, 3);
    const best = r.candidates.find((c) => c.price != null) ?? r.candidates[0] ?? null;
    console.log(`   q: "${q}"`);
    if (!r.ok) { console.log(`   ❌ ${r.error}\n`); continue; }
    if (!best) { console.log(`   (sense candidats)\n`); continue; }
    console.log(`   → ${eur(best.price)} · ${best.source ?? '?'} · ${best.title.slice(0, 45)}`);
    console.log(`     foto: ${best.thumbnail ? 'sí' : 'no'} · enllaç: ${best.link ? 'sí' : 'no'}`);

    if (APPLY && best.price != null) {
      const source = `SerpApi/Google Shopping: ${best.source ?? '?'} — ${best.title.slice(0, 60)} (${new Date().toISOString().slice(0, 10)})`;
      await prisma.inventoryItem.update({
        where: { id: it.id },
        data: {
          purchasePrice: best.price,
          value: best.price,
          purchasePriceSource: source,
          purchasePriceSourceCheckedAt: new Date(),
          ...(best.thumbnail ? { imageUrl: best.thumbnail } : {}),
        },
      });
      applied++;
    }
    console.log('');
  }
  console.log(APPLY ? `\n✅ Aplicats ${applied} items.` : `\n(revisió; re-executa amb --apply per escriure)`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
