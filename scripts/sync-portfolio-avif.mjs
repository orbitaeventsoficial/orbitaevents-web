import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'public', 'img', 'portfolio');
const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const PORTFOLIO_IMAGE_MAX_DIMENSION = 3200;
const PORTFOLIO_IMAGE_AVIF_QUALITY = 82;
const PORTFOLIO_IMAGE_AVIF_EFFORT = 6;

function slugifyAssetName(fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);

  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function convertToAvif(sourcePath, targetPath) {
  await sharp(sourcePath)
    .rotate()
    .resize({
      width: PORTFOLIO_IMAGE_MAX_DIMENSION,
      height: PORTFOLIO_IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality: PORTFOLIO_IMAGE_AVIF_QUALITY, effort: PORTFOLIO_IMAGE_AVIF_EFFORT })
    .toFile(targetPath);
}

async function syncFolder(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const sourceExt = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXTENSIONS.has(sourceExt)) continue;

    const sourcePath = path.join(folderPath, entry.name);
    const normalizedBase = slugifyAssetName(entry.name);
    if (!normalizedBase) continue;

    const targetPath = path.join(folderPath, `${normalizedBase}.avif`);
    await convertToAvif(sourcePath, targetPath);
    await fs.unlink(sourcePath);
    console.log(`✔ ${path.basename(sourcePath)} -> ${path.basename(targetPath)}`);
  }
}

async function main() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderPath = path.join(ROOT, entry.name);
    console.log(`\n📂 Sync AVIF: ${entry.name}`);
    await syncFolder(folderPath);
  }

  console.log('\n✅ Portfolio AVIF sync complet');
}

main().catch((error) => {
  console.error('❌ Error a sync-portfolio-avif.mjs', error);
  process.exit(1);
});
