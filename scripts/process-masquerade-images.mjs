/**
 * Processa les imatges dels productes de Carlos (Masquerade) perquè un reverse image
 * search NO les associï al seu portal i SENSE el logo de Masquerade visible.
 *
 * Mapeig correcte (del Word de Carlos):
 *   image3 → animacio-1-personatge (animador sol)
 *   image4 → animacio-2-personatges (animador + Mickey)
 *   image1 → secret-pirates (portada pirates; crop superior per treure el logo Masquerade)
 *   image2 → NO s'usa (és el logo de l'empresa)
 *
 * Transformacions: crop selectiu (treu logo) + recrop aspect ratio + ajust to/llum
 * + recompressió JPEG + strip EXIF.
 *
 * Ús: node scripts/process-masquerade-images.mjs [SRC_DIR]
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = process.argv[2] || '/tmp/docx-extract/word/media';
const OUT_DIR = path.join(process.cwd(), 'public', 'img', 'collaborators', 'masquerade');

// cropFrac: regió a conservar [leftFrac, topFrac, widthFrac, heightFrac] sobre l'original.
// Serveix per treure el logo de Masquerade abans del recrop final.
const JOBS = [
  { src: 'image3.jpg', out: 'animacio-1-personatge.jpg', crop: [0.05, 0.02, 0.90, 0.96], q: 84 },
  { src: 'image4.jpg', out: 'animacio-2-personatges.jpg', crop: [0.02, 0.02, 0.96, 0.96], q: 84 },
  // Pirates: el logo Masquerade és a dalt a l'esquerra. Conservem la franja central
  // (personatges + mar), que l'exclou.
  { src: 'image1.jpg', out: 'secret-pirates.jpg', crop: [0.0, 0.16, 1.0, 0.52], q: 82 },
];

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const job of JOBS) {
    const srcPath = path.join(SRC_DIR, job.src);
    if (!existsSync(srcPath)) {
      console.error(`✗ No trobat: ${srcPath}`);
      continue;
    }

    const meta = await sharp(srcPath).metadata();
    const W = meta.width || 1000;
    const H = meta.height || 1000;
    const [lf, tf, wf, hf] = job.crop;
    const region = {
      left: Math.round(W * lf),
      top: Math.round(H * tf),
      width: Math.round(W * wf),
      height: Math.round(H * hf),
    };

    await sharp(srcPath)
      .extract(region)
      .resize(1000, 1000, { fit: 'cover', position: 'centre' })
      .modulate({ brightness: 1.04, saturation: 1.08, hue: 6 })
      .gamma(1.05)
      .jpeg({ quality: job.q, progressive: true, mozjpeg: true })
      .toFile(path.join(OUT_DIR, job.out));

    console.log(`✓ ${job.src} → masquerade/${job.out} (crop ${job.crop.join(',')})`);
  }

  console.log('\nFet. Imatges netes, sense logo Masquerade.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
