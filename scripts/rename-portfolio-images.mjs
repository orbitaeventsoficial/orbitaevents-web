// scripts/rename-portfolio-images.mjs
import fs from 'fs/promises';
import path from 'path';

const ROOT = path.join(process.cwd(), 'public', 'img', 'portfolio');
const VALID = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function renameFolder(folder) {
  const folderPath = path.join(ROOT, folder);
  const slug = slugify(folder);

  const items = await fs.readdir(folderPath);
  const images = items.filter((file) =>
    VALID.includes(path.extname(file).toLowerCase())
  );

  images.sort(); // ordre estable

  let counter = 1;

  for (const img of images) {
    const ext = path.extname(img);
    const base = path.basename(img, ext);

    // Evitar renombrar si ja està correctament format
    if (base.startsWith(slug + '-')) {
      console.log(`⏭️ Ja correcte, salto ${img}`);
      continue;
    }

    const newName = `${slug}-${counter}${ext}`;
    const oldPath = path.join(folderPath, img);
    const newPath = path.join(folderPath, newName);

    try {
      await fs.rename(oldPath, newPath);
      console.log(`✔️ ${img} → ${newName}`);
      counter++;
    } catch (err) {
      console.log(`⚠️ No puc renombrar ${img}:`, err);
    }
  }
}

async function main() {
  try {
    const folders = await fs.readdir(ROOT, { withFileTypes: true });

    for (const entry of folders) {
      if (entry.isDirectory()) {
        console.log(`\n📁 Carpeta: ${entry.name}`);
        await renameFolder(entry.name);
      }
    }

    console.log('\n✅ Rename complet');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

main();
