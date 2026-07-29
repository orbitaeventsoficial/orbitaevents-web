// scripts/backfill-inventory-images.ts
// Aconsegueix la FOTO (thumbnail) dels items que no en tenen, via SerpApi Google Shopping.
// Mode revisió (default) / --apply. 1 cerca per item sense foto.
import { prisma } from '@/lib/prisma';
import { searchReplacementCandidates } from '@/lib/services/inventoryReplacementSearchService';

const APPLY = process.argv.includes('--apply');

// Consulta millorada per als genèrics (millor match de foto).
const HINT: Record<string, string> = {
  'CTRL-001': 'Pioneer DDJ-REV7', 'CTR-001': 'Pioneer DDJ-REV7',
  'ALT-001': 'Electro-Voice ETX-12P', 'ALT-002': 'Electro-Voice ETX-12P',
  'MIC-001': 'microfono inalambrico DJ', 'CAS-001': 'UDG flight case Pioneer DDJ-REV7',
  'MOV-001': 'cabezal movil LED 150W', 'MOV-002': 'cabezal movil LED 150W',
  'MOV-003': 'cabezal movil LED 150W', 'MOV-004': 'cabezal movil LED 150W',
  'MFX-001': 'efecto LED derby DJ', 'LED-001': 'foco LED par DJ', 'LED-002': 'foco LED par DJ',
  'CO2-001': 'canon CO2 DJ efecto', 'FBX-001': 'maquina humo bajo DJ',
  'SPK-001': 'maquina chispas frias', 'SPK-002': 'maquina chispas frias',
  'CNF-001': 'canon confeti DJ', 'FUM-001': 'maquina de humo DJ',
  'CAB-001': 'cabina DJ plegable', 'TEL-001': 'tela frontal cabina DJ Vonyx',
  'TEL-002': 'tela frontal cabina DJ Vonyx', 'PC-001': 'portatil Acer',
  'USB-002': 'cable USB-A USB-B', 'LIQ-FUM-001': 'liquido maquina humo 5L',
  'LIQ-BMB-001': 'liquido burbujas 5L', 'CNF-REFILL-001': 'recambio confeti',
  'SPK-POWD-001': 'polvo chispas frias recambio',
  'HW-FAN1': 'fantasma decoracion halloween', 'HW-FAN2': 'fantasma decoracion halloween',
};

async function main() {
  console.log(`── Backfill IMATGES inventari ${APPLY ? '(APLICANT)' : '(REVISIÓ)'} ──\n`);
  const items = await prisma.inventoryItem.findMany({
    where: { imageUrl: null },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
  console.log(`Sense foto: ${items.length}\n`);
  let done = 0;
  for (const it of items) {
    const q = HINT[it.code ?? ''] || it.name;
    const r = await searchReplacementCandidates(q, 4);
    const withThumb = r.candidates.find((c) => c.thumbnail);
    console.log(`【${it.code}】 ${it.name}  → ${withThumb ? 'foto ✓' : 'sense foto'}`);
    if (APPLY && withThumb?.thumbnail) {
      await prisma.inventoryItem.update({ where: { id: it.id }, data: { imageUrl: withThumb.thumbnail } });
      done++;
    }
  }
  console.log(`\n${APPLY ? `✅ ${done} fotos aplicades` : '(revisió; --apply per escriure)'}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
