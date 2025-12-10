// === NORMALIZADOR DE CARPETAS + RENOMBRADOR + GENERADOR DE CONFIG ===
// AUTO-GENERATED — NO EDITAR A MÀ

import { promises as fs } from "fs";
import path from "path";

const BASE = path.join(process.cwd(), "public", "img", "portfolio");
const OUTPUT = path.join(process.cwd(), "app", "config", "portfolio-images.ts");

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const slugify = (name) =>
  name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const humanize = (name) => {
  const clean = name.replace(/[_\-]+/g, " ").trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const altFor = (file, categoryName) => {
  const base = file.replace(/\.[^.]+$/, "");
  const clean = base
    .replace(/[_\-]+/g, " ")
    .replace(/\d+/g, (m) => ` ${m}`)
    .trim();

  const pretty =
    clean.charAt(0).toUpperCase() + clean.slice(1);

  return `${categoryName} – ${pretty}`;
};

function isImageFile(file) {
  return IMAGE_EXTENSIONS.some((ext) =>
    file.toLowerCase().endsWith(ext)
  );
}

// -----------------------------------------------------------------------------
// 1) Renombrador de imágenes dentro de cada carpeta
// -----------------------------------------------------------------------------

async function renameImagesInFolder(folderPath, folderName) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  const images = entries
    .filter((e) => e.isFile() && isImageFile(e.name))
    // Orden por nombre (si quieres ordenar por fecha: cambiar a mtime)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (images.length === 0) return;

  console.log(`📂 Renombrando ${images.length} imágenes en ${folderName}`);

  let index = 1;

  for (const img of images) {
    const oldName = img.name;
    const ext = path.extname(oldName).toLowerCase();
    const num = String(index).padStart(2, "0");
    const newName = `${folderName}-${num}${ext}`;

    if (newName !== oldName) {
      const oldPath = path.join(folderPath, oldName);
      const newPath = path.join(folderPath, newName);

      console.log(`   ✏️ ${oldName} → ${newName}`);
      await fs.rename(oldPath, newPath);
    }

    index++;
  }
}

// -----------------------------------------------------------------------------
// 2) Normaliza TODAS las carpetas e imágenes del portfolio
// -----------------------------------------------------------------------------

async function normalizePortfolio() {
  if (!(await exists(BASE))) {
    console.warn(`⚠️ No existe la carpeta de portfolio: ${BASE}`);
    return;
  }

  const entries = await fs.readdir(BASE, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    const folderPath = path.join(BASE, folderName);

    await renameImagesInFolder(folderPath, folderName);
  }
}

// -----------------------------------------------------------------------------
// 3) Generador de la config de categorías + imágenes
// -----------------------------------------------------------------------------

async function generateConfig() {
  const dirs = await fs.readdir(BASE, { withFileTypes: true });

  const categories = [];
  const imagesBySlug = {};

  // Orden deseado: alquiler-equipo debe ir AL FINAL
  const PRIORITY_ORDER = [
    'bodas',
    'discomovil',
    'eventos-empresa',
    'fiestas-infantiles',
    'fiestas-privadas',
    'produccion-tecnica',
    'alquiler-equipo', // AL FINAL
  ];

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const folder = dir.name;
    const slug = slugify(folder);
    const display = humanize(folder);

    const fullPath = path.join(BASE, folder);
    const files = await fs.readdir(fullPath);

    const imgs = files
      .filter((f) => isImageFile(f))
      .map((f) => ({
        src: `/img/portfolio/${folder}/${f}`,
        alt: altFor(f, display),
      }));

    if (imgs.length === 0) continue;

    categories.push({
      slug,
      name: display,
      cover: imgs[0].src, // primera imagen como portada
    });

    imagesBySlug[slug] = imgs;
  }

  // Ordenar categorías según PRIORITY_ORDER
  categories.sort((a, b) => {
    const indexA = PRIORITY_ORDER.indexOf(a.slug);
    const indexB = PRIORITY_ORDER.indexOf(b.slug);

    // Si ambos están en la lista de prioridad, ordenar según esa lista
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Si solo uno está en la lista, ese va primero
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Si ninguno está, mantener orden alfabético
    return a.slug.localeCompare(b.slug);
  });

  const output = `// AUTO-GENERATED — NO EDITAR A MANO

export const PORTFOLIO_CATEGORIES = ${JSON.stringify(categories, null, 2)};

export const PORTFOLIO_IMAGES = ${JSON.stringify(imagesBySlug, null, 2)};
`;

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, output, "utf8");

  console.log("✔ Config generada:", OUTPUT);
}

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

async function run() {
  console.log("🔄 Normalizando portfolio (carpetas + nombres)...");
  await normalizePortfolio();

  console.log("📝 Generando configuración del portfolio...");
  await generateConfig();
}

run().catch((err) => {
  console.error("❌ ERROR en generate-portfolio-config.mjs", err);
  process.exit(1);
});
