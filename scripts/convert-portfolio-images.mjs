// Convert portfolio images to AVIF for smaller payloads.
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'public', 'img', 'portfolio');
const MAX_WIDTH = 2000;
const AVIF_QUALITY = 45;
const AVIF_EFFORT = 8;
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function convertImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SOURCE_EXTS.has(ext)) return;

  const outputPath = filePath.slice(0, -ext.length) + '.avif';
  if (outputPath === filePath) return;

  const image = sharp(filePath).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;

  const pipeline =
    width > MAX_WIDTH
      ? image.resize({ width: MAX_WIDTH, withoutEnlargement: true })
      : image;

  await pipeline
    .avif({
      quality: AVIF_QUALITY,
      effort: AVIF_EFFORT,
      chromaSubsampling: '4:2:0',
    })
    .toFile(outputPath);

  await deleteWithRetry(filePath);
}

async function deleteWithRetry(filePath, retries = 5, delayMs = 200) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await fs.unlink(filePath);
      return;
    } catch (error) {
      if (attempt === retries || !['EBUSY', 'EPERM'].includes(error.code)) {
        console.warn(`⚠️  No pude borrar ${filePath}: ${error.message}`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  const files = await walk(ROOT);
  let converted = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!SOURCE_EXTS.has(ext)) continue;
    await convertImage(file);
    converted += 1;
  }

  console.log(`✔ Converted ${converted} images to AVIF.`);
}

main().catch((error) => {
  console.error('❌ Error converting portfolio images:', error);
  process.exit(1);
});
