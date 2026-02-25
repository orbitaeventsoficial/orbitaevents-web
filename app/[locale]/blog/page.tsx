// app/[locale]/blog/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS — Blog públic (index)
// ═══════════════════════════════════════════════════════════════════════════

import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { SITE_CONFIG } from '@/app/config/site-config';
import BlogTracking from '@/app/components/blog/BlogTracking';
import { toIntlLocale } from '@/lib/constants';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { canonical: `/${locale}/blog` },
    openGraph: {
      title: t('meta.ogTitle'),
      description: t('meta.description'),
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Blog Òrbita Events' }],
    },
  };
}

interface BlogPost {
  id: string;
  slug: string;
  category: string;
  featuredImage?: string;
  publishedAt?: string;
  readingTime?: number;
  translations: { title: string; excerpt: string }[];
}

async function getPosts(locale: string): Promise<BlogPost[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(
      `${baseUrl}/api/public/blog?locale=${locale}&page=1&limit=9`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  bodas: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  eventos: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  consejos: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  tendencias: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tecnologia: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  general: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function PostCard({
  post,
  locale,
  readMoreLabel,
  minutesUnit,
}: {
  post: BlogPost;
  locale: string;
  readMoreLabel: string;
  minutesUnit: string;
}) {
  const translation = post.translations[0];
  if (!translation) return null;
  const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  const emoji =
    post.category === 'bodas' ? '💍' :
    post.category === 'tecnologia' ? '🎧' :
    post.category === 'tendencias' ? '✨' : '🎵';

  return (
    <Link
      href={`/blog/${post.slug}`}
      data-blog-cta={`blog_card_${post.slug}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-48 bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={translation.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl opacity-20">{emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${categoryColor}`}>
            {post.category}
          </span>
          {post.readingTime && (
            <span className="text-white/40 text-xs">{post.readingTime} {minutesUnit}</span>
          )}
          {post.publishedAt && (
            <span className="text-white/40 text-xs ml-auto">
              {new Date(post.publishedAt).toLocaleDateString(toIntlLocale(locale), { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>

        <h2 className="font-bold text-white text-lg leading-snug mb-3 group-hover:text-amber-300 transition-colors line-clamp-2">
          {translation.title}
        </h2>

        <p className="text-white/60 text-sm leading-relaxed line-clamp-3">
          {translation.excerpt}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-amber-400 text-sm font-semibold group-hover:gap-3 transition-all">
          <span>{readMoreLabel}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = await getPosts(locale);

  // JSON-LD CollectionPage schema for blog index
  const canonicalUrl = `https://orbitaevents.com/${locale}/blog`;
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('meta.title'),
    description: t('meta.description'),
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.business.name,
      logo: {
        '@type': 'ImageObject',
        url: 'https://orbitaevents.com/img/orbitawordmark.svg',
      },
    },
    ...(posts.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: posts.map((post, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `https://orbitaevents.com/${locale}/blog/${post.slug}`,
              name: post.translations[0]?.title || post.slug,
            })),
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    <main className="min-h-screen bg-[#0A0A0A]">
      <BlogTracking page="index" />
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.06),transparent_60%)]" />
        <div className="relative container mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-6">
            📝 {t('badge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            {t('title1')}{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t('title2')}
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 pb-24">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">✍️</div>
            <h2 className="text-2xl font-bold text-white mb-3">{t('empty.title')}</h2>
            <p className="text-white/60 mb-8">{t('empty.subtitle')}</p>
            <Link
              href="/contacto"
              data-blog-cta="blog_empty_contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors"
            >
              {t('empty.cta')}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  locale={locale}
                  readMoreLabel={t('readMore')}
                  minutesUnit={t('minutesUnit')}
                />
              ))}
            </div>

            <div className="mt-16 text-center border-t border-white/10 pt-16">
              <p className="text-white/60 mb-6">{t('ctaText')}</p>
              <Link
                href="/configurador"
                data-blog-cta="blog_footer_configurator"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-opacity"
              >
                {t('ctaButton')}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
    </>
  );
}
