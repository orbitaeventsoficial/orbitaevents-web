// scripts/localize-inventory-images.ts
// Descarrega les imatges externes (gstatic/SerpApi) d'inventari, les converteix a
// webp i les guarda LOCALS (uploads/inventory/{code}.webp) perquè es vegin sempre
// i no caduquin. Actualitza imageUrl a /api/uploads/...
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import {
  INVENTORY_IMAGE_MAX_DIMENSION,
  INVENTORY_IMAGE_WEBP_QUALITY,
  INVENTORY_IMAGE_USER_AGENT,
  inventoryImagePath,
} from '@/lib/inventory-image-constants';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function main() {
  const items = await prisma.inventoryItem.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, code: true, name: true, imageUrl: true },
  });
  const external = items.filter((it) => it.imageUrl && !it.imageUrl.startsWith('/api/uploads/'));
  console.log(`Items amb imatge externa a localitzar: ${external.length}\n`);

  let ok = 0, fail = 0;
  for (const it of external) {
    const code = it.code ?? it.id;
    try {
      const res = await fetch(it.imageUrl!, { headers: { 'User-Agent': INVENTORY_IMAGE_USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const webp = await sharp(buf)
        .resize(INVENTORY_IMAGE_MAX_DIMENSION, INVENTORY_IMAGE_MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: INVENTORY_IMAGE_WEBP_QUALITY })
        .toBuffer();
      const filePath = `inventory/${inventoryImagePath(code)}`;
      const full = path.join(UPLOADS_DIR, filePath);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, webp);
      await prisma.inventoryItem.update({ where: { id: it.id }, data: { imageUrl: `/api/uploads/${filePath}` } });
      console.log(`  ✅ ${code.padEnd(14)} ${it.name.slice(0, 34)}`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${code.padEnd(14)} ${it.name.slice(0, 30)} — ${(e as Error).message}`);
      fail++;
    }
  }
  console.log(`\n✅ ${ok} localitzades · ${fail} fallides`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
