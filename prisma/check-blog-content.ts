import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.blogPost.findMany({
    include: {
      translations: { where: { locale: 'es' } },
    },
    orderBy: { publishedAt: 'desc' },
  });

  console.log('Blog post content lengths:\n');
  for (const post of posts) {
    const t = post.translations[0];
    if (!t) continue;
    const words = t.content.split(/\s+/).length;
    const h2Count = (t.content.match(/<h2/g) || []).length;
    const h3Count = (t.content.match(/<h3/g) || []).length;
    const hasLinks = t.content.includes('<a ');
    console.log(`[${post.category.padEnd(11)}] ${post.slug}`);
    console.log(`             ${words} words | ${h2Count} h2 | ${h3Count} h3 | links: ${hasLinks ? 'yes' : 'no'} | readTime: ${post.readingTime}min`);
  }

  await prisma.$disconnect();
}

main();
