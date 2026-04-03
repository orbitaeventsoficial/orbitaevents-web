import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check translations per locale
    const translations = await prisma.blogPostTranslation.groupBy({
      by: ['locale'],
      _count: true,
    });
    console.log('Translations per locale:');
    translations.forEach(t => console.log(`  ${t.locale}: ${t._count} translations`));

    // Check featured images
    const withImage = await prisma.blogPost.count({ where: { featuredImage: { not: null } } });
    const withoutImage = await prisma.blogPost.count({ where: { featuredImage: null } });
    console.log(`\nFeatured images: ${withImage} with, ${withoutImage} without`);

    // Show posts without images
    if (withoutImage > 0) {
      const noImg = await prisma.blogPost.findMany({
        where: { featuredImage: null },
        select: { slug: true, category: true },
      });
      console.log('Posts without featured image:');
      noImg.forEach(p => console.log(`  [${p.category}] ${p.slug}`));
    }

    // Check categories distribution
    const categories = await prisma.blogPost.groupBy({
      by: ['category'],
      _count: true,
    });
    console.log('\nCategories:');
    categories.forEach(c => console.log(`  ${c.category}: ${c._count} posts`));

    // Check if English (en) translations exist
    const enCount = await prisma.blogPostTranslation.count({ where: { locale: 'en' } });
    console.log(`\nEnglish translations: ${enCount}`);

  } catch (e: any) {
    console.log('DB Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
