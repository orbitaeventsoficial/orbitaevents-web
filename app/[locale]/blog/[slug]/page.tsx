// app/[locale]/blog/[slug]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS — Blog post individual
// ═══════════════════════════════════════════════════════════════════════════

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { SITE_CONFIG } from '@/app/config/site-config';

export const revalidate = 3600;

interface BlogTranslation {
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface BlogPost {
  id: string;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  publishedAt?: string;
  readingTime?: number;
  translations: BlogTranslation[];
}

async function getPost(slug: string, locale: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(
      `${baseUrl}/api/public/blog?slug=${slug}&locale=${locale}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.post || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  const tBlog = await getTranslations({ locale, namespace: 'blog' });
  const post = await getPost(slug, locale);
  if (!post || !post.translations[0]) {
    return { title: tBlog('meta.title') };
  }
  const t = post.translations[0];
  return {
    title: t.metaTitle || t.title,
    description: t.metaDescription || t.excerpt,
    alternates: { canonical: `/${locale}/blog/${slug}` },
    openGraph: {
      title: t.metaTitle || t.title,
      description: t.metaDescription || t.excerpt,
      images: post.featuredImage
        ? [{ url: post.featuredImage, width: 1200, height: 630, alt: t.title }]
        : [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Òrbita Events' }],
    },
  };
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === 'ca' ? 'ca-ES' : locale === 'es' ? 'es-ES' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
}

// Render HTML content from DB (content stored as HTML in the seed)
function BlogContent({ html }: { html: string }) {
  return (
    <div
      className="prose prose-invert prose-lg max-w-none
        prose-headings:font-black prose-headings:text-white
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-white/75 prose-p:leading-relaxed
        prose-strong:text-white prose-strong:font-bold
        prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
        prose-ul:text-white/75 prose-ol:text-white/75
        prose-li:my-1
        prose-blockquote:border-amber-500 prose-blockquote:text-white/60"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  bodas: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  eventos: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  consejos: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  tendencias: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tecnologia: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  general: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export default async function BlogPostPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  const tBlog = await getTranslations({ locale, namespace: 'blog' });
  const post = await getPost(slug, locale);

  if (!post || !post.translations[0]) {
    notFound();
  }

  const translation = post.translations[0];
  const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;
  const yearsExperience = SITE_CONFIG.stats.yearsExperience;

  // JSON-LD for article
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: translation.title,
    description: translation.excerpt,
    author: {
      '@type': 'Organization',
      name: post.author || 'Òrbita Events',
      url: 'https://orbitaevents.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Òrbita Events',
      logo: {
        '@type': 'ImageObject',
        url: 'https://orbitaevents.com/img/logoplanetatextdreta.svg',
      },
    },
    datePublished: post.publishedAt,
    image: post.featuredImage || 'https://orbitaevents.com/og-default.jpg',
    url: `https://orbitaevents.com/${locale}/blog/${slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://orbitaevents.com/${locale}/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main className="min-h-screen bg-[#0A0A0A]">
        {/* Hero */}
        <section className="relative pt-24 pb-0 overflow-hidden">
          {post.featuredImage && (
            <div className="absolute inset-0 h-[500px]">
              <Image
                src={post.featuredImage}
                alt={translation.title}
                fill
                sizes="100vw"
                className="object-cover opacity-20"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 via-[#0A0A0A]/80 to-[#0A0A0A]" />
            </div>
          )}

          <div className="relative container mx-auto px-4 max-w-4xl pt-8 pb-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">{tBlog('post.breadcrumbHome')}</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white transition-colors">{tBlog('post.breadcrumbBlog')}</Link>
              <span>/</span>
              <span className="text-white/80 truncate max-w-[200px]">{translation.title}</span>
            </nav>

            {/* Category + meta */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${categoryColor}`}>
                {post.category}
              </span>
              {post.readingTime && (
                <span className="text-white/50 text-sm">⏱ {post.readingTime} {tBlog('post.readingTime', { count: post.readingTime })}</span>
              )}
              {post.publishedAt && (
                <span className="text-white/50 text-sm">
                  📅 {formatDate(post.publishedAt, locale)}
                </span>
              )}
              <span className="text-white/50 text-sm">✍️ {tBlog('post.byAuthor', { author: post.author })}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
              {translation.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-white/60 leading-relaxed border-l-4 border-amber-500/40 pl-6">
              {translation.excerpt}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 max-w-4xl pb-24">
          <div className="border-t border-white/10 pt-12">
            <BlogContent html={translation.content} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              {tBlog('post.ctaTitle')}
            </h3>
            <p className="text-white/60 mb-6">
              {tBlog('post.ctaSubtitle', { years: yearsExperience })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/configurador"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-opacity"
              >
                {tBlog('post.ctaPrimary')}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition-colors"
              >
                ← {tBlog('post.backToBlog')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
