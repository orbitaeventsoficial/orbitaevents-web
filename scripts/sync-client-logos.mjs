import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const LOGOS_DIR = path.join(ROOT, 'public', 'img', 'logos');
const CONFIG_PATH = path.join(ROOT, 'app', 'config', 'client-logos.ts');
const CANONICAL_RE = /^cliente(\d+)\.webp$/i;
const IMAGE_RE = /\.(png|jpe?g|webp|avif)$/i;

function sortByName(a, b) {
  return a.localeCompare(b, 'en', { sensitivity: 'base' });
}

async function listFiles() {
  const entries = await fs.readdir(LOGOS_DIR, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

function nextIndexFrom(files) {
  const indexes = files
    .map((name) => name.match(CANONICAL_RE))
    .filter(Boolean)
    .map((match) => Number.parseInt(match[1], 10))
    .filter(Number.isFinite);
  return indexes.length ? Math.max(...indexes) + 1 : 1;
}

async function convertToCanonical(inputName, index) {
  const inputPath = path.join(LOGOS_DIR, inputName);
  const targetName = `cliente${index}.webp`;
  const outputPath = path.join(LOGOS_DIR, targetName);
  const tempPath = `${outputPath}.tmp`;

  await sharp(inputPath).webp({ quality: 90 }).toFile(tempPath);
  await fs.rename(tempPath, outputPath);
  await fs.unlink(inputPath);

  return { inputName, targetName };
}

async function writeFileIfChanged(targetPath, content) {
  const current = await fs.readFile(targetPath, 'utf8').catch(() => null);
  if (current === content) {
    return false;
  }

  await fs.writeFile(targetPath, content, 'utf8');
  return true;
}

async function writeConfig(canonicalFiles) {
  const logoPaths = canonicalFiles
    .map((name) => `  '/img/logos/${name}',`)
    .join('\n');

  const content = `export const CLIENT_LOGOS = [\n${logoPaths}\n] as const;\n`;
  return writeFileIfChanged(CONFIG_PATH, content);
}

async function run() {
  const files = (await listFiles()).sort(sortByName);
  const canonical = files.filter((name) => CANONICAL_RE.test(name)).sort((a, b) => {
    const aIndex = Number.parseInt(a.match(CANONICAL_RE)[1], 10);
    const bIndex = Number.parseInt(b.match(CANONICAL_RE)[1], 10);
    return aIndex - bIndex;
  });

  const pending = files.filter((name) => IMAGE_RE.test(name) && !CANONICAL_RE.test(name));
  let next = nextIndexFrom(canonical);
  const converted = [];

  for (const file of pending) {
    const result = await convertToCanonical(file, next);
    converted.push(result);
    next += 1;
  }

  const finalFiles = (await listFiles())
    .filter((name) => CANONICAL_RE.test(name))
    .sort((a, b) => {
      const aIndex = Number.parseInt(a.match(CANONICAL_RE)[1], 10);
      const bIndex = Number.parseInt(b.match(CANONICAL_RE)[1], 10);
      return aIndex - bIndex;
    });

  const configUpdated = await writeConfig(finalFiles);

  if (converted.length === 0) {
    console.log(configUpdated ? 'No new logos to convert. client-logos.ts updated.' : 'No new logos to convert. client-logos.ts unchanged.');
    return;
  }

  for (const item of converted) {
    console.log(`${item.inputName} -> ${item.targetName}`);
  }

  console.log(configUpdated ? `Updated ${CONFIG_PATH}` : `${CONFIG_PATH} unchanged`);
}

run().catch((error) => {
  console.error('sync-client-logos failed:', error);
  process.exit(1);
});
