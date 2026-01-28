import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'public', 'img', 'portfolio');
const MAX_WIDTH = 1600;
const QUALITY = 80;
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return null;

  const image = sharp(filePath);
  const metadata = await image.metadata();
  const width = metadata.width || MAX_WIDTH;
  const pipeline = image
    .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: QUALITY });

  const outputPath = filePath.replace(/\.(jpe?g|png)$/i, '.webp');
  await pipeline.toFile(outputPath);
  return { input: filePath, output: outputPath, width };
}

async function main() {
  const files = await walk(ROOT);
  let processed = 0;

  for (const filePath of files) {
    try {
      const result = await optimizeImage(filePath);
      if (result) processed += 1;
    } catch (error) {
      console.error(`[optimize] Failed: ${filePath}`, error?.message || error);
    }
  }

  console.log(`[optimize] Done. Processed ${processed} images.`);
}

main().catch((error) => {
  console.error('[optimize] Fatal error', error);
  process.exit(1);
});
