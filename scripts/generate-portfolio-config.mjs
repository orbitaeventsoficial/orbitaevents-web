// === NORMALIZADOR DE CARPETAS + RENOMBRADOR + GENERADOR DE CONFIG ===
// AUTO-GENERATED — NO EDITAR A MANO

import { promises as fs } from 'fs';
import path from 'path';

const BASE = path.join(process.cwd(), 'public', 'img', 'portfolio');
const OUTPUT = path.join(process.cwd(), 'app', 'config', 'portfolio-images.ts');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const PRIORITY_ORDER = [
  'bodas',
  'discomovil',
  'eventos-empresa',
  'fiestas-infantiles',
  'fiestas-privadas',
  'produccion-tecnica',
  'alquiler-equipo',
];

const slugify = (name) =>
  name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const humanize = (name) => {
  const clean = name.replace(/[_\-]+/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const altFor = (file, categoryName) => {
  const base = file.replace(/\.[^.]+$/, '');
  const clean = base
    .replace(/[_\-]+/g, ' ')
    .replace(/\d+/g, (m) => ` ${m}`)
    .trim();

  const pretty = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${categoryName} – ${pretty}`;
};

function isImageFile(file) {
  return IMAGE_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext));
}

function isVideoFile(file) {
  return VIDEO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext));
}

// Los vídeos se reparten por la galería en lugar de amontonarse al final.
// La primera posición se reserva a una foto: es la portada de la categoría.
function mezclarFotosYVideos(photos, videos) {
  if (videos.length === 0) return photos;
  if (photos.length === 0) return videos;

  const items = [...photos];
  const paso = Math.max(1, Math.floor(photos.length / (videos.length + 1)));

  videos.forEach((video, index) => {
    const posicion = Math.min(items.length, (index + 1) * paso + index);
    items.splice(posicion, 0, video);
  });

  return items;
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function writeFileIfChanged(targetPath, content) {
  const current = await fs.readFile(targetPath, 'utf8').catch(() => null);
  if (current === content) {
    return false;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, 'utf8');
  return true;
}

async function renameImagesInFolder(folderPath, folderName) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  const images = entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (images.length === 0) return;

  console.log(`📂 Renombrando ${images.length} imágenes en ${folderName}`);

  let index = 1;
  for (const image of images) {
    const oldName = image.name;
    const ext = path.extname(oldName).toLowerCase();
    const num = String(index).padStart(2, '0');
    const newName = `${folderName}-${num}${ext}`;

    if (newName !== oldName) {
      const oldPath = path.join(folderPath, oldName);
      const newPath = path.join(folderPath, newName);
      console.log(`   ✏️ ${oldName} → ${newName}`);
      await fs.rename(oldPath, newPath);
    }

    index += 1;
  }
}

async function normalizePortfolio() {
  if (!(await exists(BASE))) {
    console.warn(`⚠️ No existe la carpeta de portfolio: ${BASE}`);
    return;
  }

  const entries = await fs.readdir(BASE, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await renameImagesInFolder(path.join(BASE, entry.name), entry.name);
  }
}

async function generateConfig() {
  const dirs = await fs.readdir(BASE, { withFileTypes: true });
  const categories = [];
  const imagesBySlug = {};

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const folder = dir.name;
    const slug = slugify(folder);
    const display = humanize(folder);
    const fullPath = path.join(BASE, folder);
    const files = await fs.readdir(fullPath);

    const photos = files
      .filter((file) => isImageFile(file))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => ({
        src: `/img/portfolio/${folder}/${file}`,
        alt: altFor(file, display),
      }));

    const videos = files
      .filter((file) => isVideoFile(file))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => ({
        src: `/img/portfolio/${folder}/${file}`,
        alt: `${display} – vídeo ${file.replace(/\.[^.]+$/, '').split('-v').pop()}`,
        type: 'video',
      }));

    if (photos.length === 0) continue;

    categories.push({
      slug,
      name: display,
      cover: photos[0].src,
    });

    imagesBySlug[slug] = mezclarFotosYVideos(photos, videos);
  }

  categories.sort((a, b) => {
    const indexA = PRIORITY_ORDER.indexOf(a.slug);
    const indexB = PRIORITY_ORDER.indexOf(b.slug);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.slug.localeCompare(b.slug);
  });

  const output = `// AUTO-GENERATED — NO EDITAR A MANO\n\nexport const PORTFOLIO_CATEGORIES = ${JSON.stringify(categories, null, 2)};\n\nexport const PORTFOLIO_IMAGES = ${JSON.stringify(imagesBySlug, null, 2)};\n`;
  const updated = await writeFileIfChanged(OUTPUT, output);
  console.log(updated ? `✔ Config generada: ${OUTPUT}` : `✔ Config sin cambios: ${OUTPUT}`);
}

async function run() {
  console.log('🔄 Normalizando portfolio (carpetas + nombres)...');
  await normalizePortfolio();

  console.log('📝 Generando configuración del portfolio...');
  await generateConfig();
}

run().catch((err) => {
  console.error('❌ ERROR en generate-portfolio-config.mjs', err);
  process.exit(1);
});
