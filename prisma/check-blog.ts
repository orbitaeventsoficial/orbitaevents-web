import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.blogPost.count();
    console.log('Total blog posts:', count);

    const published = await prisma.blogPost.count({ where: { isPublished: true } });
    console.log('Published:', published);

    const posts = await prisma.blogPost.findMany({
      select: { slug: true, isPublished: true, category: true },
      orderBy: { publishedAt: 'desc' },
      take: 30,
    });
    posts.forEach(p => console.log(`  ${p.isPublished ? '✅' : '❌'} [${p.category}] ${p.slug}`));
  } catch (e: any) {
    console.log('DB Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
