// Treu del portfoli les peces que apunten a fitxers que ja no existeixen.
//
// El 7 de juliol es van pujar 18 peces (fotos i vídeos) de Bodes i Discomòbil
// des del gestor d'imatges. El fitxer es va perdre i només va quedar l'apunt a
// la base de dades. Com que l'apunt mana per damunt dels fitxers del web, les
// dues famílies ensenyen caixes buides i amaguen les fotos bones.
//
// Aquest guió NO esborra res que funcioni: demana cada fitxer al web de veritat
// i només treu l'apunt si el web respon que no el troba.
//
// Còpia de seguretat: es desa a scripts/.copia-portfolio-media.json abans de
// tocar res. Per desfer-ho, es tornen a inserir aquelles files.
//
//   node --env-file=.env.local scripts/netejar-portfolio-media-mort.mjs
//
// Amb --de-veritat esborra. Sense res, només ensenya què faria.

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const WEB = process.env.SITE_URL || 'https://orbitaevents.com';
const ESBORRAR = process.argv.includes('--de-veritat');
const COPIA = 'scripts/.copia-portfolio-media.json';

const prisma = new PrismaClient();
const peces = await prisma.portfolioMedia.findMany({ orderBy: [{ slug: 'asc' }, { sortOrder: 'asc' }] });

console.log(`Peces al portfoli: ${peces.length}. Comprovant-les al web ${WEB}…\n`);

const mortes = [];
for (const peca of peces) {
  const adreca = peca.mediaUrl.startsWith('http') ? peca.mediaUrl : `${WEB}${peca.mediaUrl}`;
  let codi = 0;
  try {
    codi = (await fetch(adreca, { method: 'GET', headers: { Range: 'bytes=0-0' } })).status;
  } catch {
    codi = 0;
  }
  const viva = codi >= 200 && codi < 400;
  if (!viva) mortes.push(peca);
  console.log(`${viva ? 'viva  ' : 'MORTA '} ${String(codi).padStart(3)}  ${peca.slug.padEnd(12)} ${peca.mediaType.padEnd(6)} ${peca.mediaUrl.split('/').pop()}`);
}

console.log(`\nMortes: ${mortes.length} de ${peces.length}.`);

if (mortes.length === 0) {
  console.log('No hi ha res per treure.');
} else if (!ESBORRAR) {
  console.log('Assaig: no s\'ha tocat res. Torna-hi amb --de-veritat per treure-les.');
} else {
  writeFileSync(COPIA, JSON.stringify(mortes, null, 1));
  console.log(`Còpia de seguretat desada a ${COPIA}`);
  const fetes = await prisma.$transaction(async (tx) => {
    const r = await tx.portfolioMedia.deleteMany({ where: { id: { in: mortes.map((m) => m.id) } } });
    return r.count;
  });
  console.log(`Tretes ${fetes} peces. Ara aquestes famílies tornen a llegir els fitxers del web.`);
}

await prisma.$disconnect();
