import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'blog' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

async function getBlogPosts(locale: string) {
  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
    },
    include: {
      translations: {
        where: { locale },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 20,
  });

  return posts;
}

export default async function BlogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const posts = await getBlogPosts(locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      {/* Hero */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              {locale === 'ca' ? 'Blog' : 'Blog'}
            </h1>
            <p className="mt-4 text-lg text-white/80 md:text-xl">
              {locale === 'ca'
                ? 'Novetats, consells i tendències en esdeveniments i música'
                : 'Novedades, consejos y tendencias en eventos y música'}
            </p>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-white/60">
                {locale === 'ca' ? 'Encara no hi ha articles' : 'Aún no hay artículos'}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const translation = post.translations[0];
                if (!translation) return null;

                return (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="group overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-all hover:border-purple-500/50 hover:bg-white/10"
                  >
                    {post.featuredImage && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={post.featuredImage}
                          alt={translation.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="mb-3 flex items-center gap-3 text-sm text-white/60">
                        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                          {post.category}
                        </span>
                        {post.readingTime && (
                          <span>{post.readingTime} min lectura</span>
                        )}
                      </div>

                      <h2 className="mb-3 text-xl font-bold text-white group-hover:text-purple-400">
                        {translation.title}
                      </h2>

                      <p className="mb-4 text-white/70">{translation.excerpt}</p>

                      <div className="flex items-center justify-between text-sm text-white/60">
                        <span>{post.author}</span>
                        <span>
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                            locale === 'ca' ? 'ca-ES' : 'es-ES'
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
