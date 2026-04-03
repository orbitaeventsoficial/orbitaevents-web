// Update all blog posts with featured images from portfolio
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map category → portfolio images (cycle through them)
const CATEGORY_IMAGES: Record<string, string[]> = {
  bodas: [
    '/img/portfolio/bodas/bodas-01.avif',
    '/img/portfolio/bodas/bodas-02.avif',
    '/img/portfolio/bodas/bodas-03.avif',
    '/img/portfolio/bodas/bodas-04.avif',
  ],
  fiestas: [
    '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-03.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-05.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-07.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-09.avif',
  ],
  consejos: [
    '/img/portfolio/discomovil/discomovil-02.avif',
    '/img/portfolio/discomovil/discomovil-06.avif',
    '/img/portfolio/discomovil/discomovil-10.avif',
    '/img/portfolio/discomovil/discomovil-14.avif',
    '/img/portfolio/discomovil/discomovil-18.avif',
  ],
  eventos: [
    '/img/portfolio/eventos-empresa/eventos-empresa-01.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-03.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-05.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-07.avif',
  ],
  empresas: [
    '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-04.avif',
    '/img/portfolio/eventos-empresa/eventos-empresa-06.avif',
  ],
  tecnologia: [
    '/img/portfolio/produccion-tecnica/produccion-tecnica-01.avif',
    '/img/portfolio/produccion-tecnica/produccion-tecnica-02.avif',
    '/img/portfolio/produccion-tecnica/produccion-tecnica-03.avif',
    '/img/portfolio/produccion-tecnica/produccion-tecnica-04.avif',
  ],
  tendencias: [
    '/img/portfolio/bodas/bodas-03.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-02.avif',
  ],
  general: [
    '/img/portfolio/discomovil/discomovil-01.avif',
    '/img/portfolio/fiestas-privadas/fiestas-privadas-04.avif',
  ],
};

// Track how many images used per category (for cycling)
const counters: Record<string, number> = {};

function getImage(category: string): string {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.general;
  const idx = counters[category] || 0;
  counters[category] = idx + 1;
  return images[idx % images.length];
}

async function main() {
  const posts = await prisma.blogPost.findMany({
    where: { featuredImage: null },
    select: { id: true, slug: true, category: true },
  });

  console.log(`Updating ${posts.length} posts with featured images...\n`);

  for (const post of posts) {
    const image = getImage(post.category);
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { featuredImage: image },
    });
    console.log(`  ✅ [${post.category}] ${post.slug} → ${image}`);
  }

  console.log(`\nDone! ${posts.length} posts updated.`);
  await prisma.$disconnect();
}

main();
