// app/[locale]/blog/[slug]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS — Blog post individual
// ═══════════════════════════════════════════════════════════════════════════

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { SITE_CONFIG } from '@/app/config/site-config';
import BlogTracking from '@/app/components/blog/BlogTracking';
import { PUBLIC_BLOG_CATEGORY_COLORS, toIntlLocale } from '@/lib/constants';
import { getPublicBlogPost, type PublicBlogPost } from '@/lib/blog-public';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';


export const revalidate = 3600;

async function getPost(slug: string, locale: string): Promise<PublicBlogPost | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    return await getPublicBlogPost(slug, locale);
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
  const categoryColor = PUBLIC_BLOG_CATEGORY_COLORS[post.category] || PUBLIC_BLOG_CATEGORY_COLORS.general;
  const yearsExperience = SITE_CONFIG.stats.yearsExperience;

  const canonicalUrl = absoluteUrl(`/${locale}/blog/${slug}`);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: translation.title,
    description: translation.excerpt,
    datePublished: post.publishedAt,
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.business.name,
      url: getSiteUrl(),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.business.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/img/orbitawordmark.svg'),
      },
    },
    image: post.featuredImage || absoluteUrl('/og-default.jpg'),
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <main className="min-h-screen bg-bg-main relative overflow-hidden">
        <BlogTracking page="post" slug={slug} />
        <section className="relative pt-24 pb-0 overflow-hidden">
          {post.featuredImage && (
            <div className="absolute inset-0 h-[500px]">
              <Image
                src={post.featuredImage}
                alt={translation.title}
                fill
                sizes="100vw"
                className="object-cover opacity-25"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-bg-main/50 via-bg-main/80 to-bg-main" />
              <div className="absolute inset-0 oe-vignette pointer-events-none" />
            </div>
          )}

          <div className="relative container mx-auto px-4 max-w-4xl pt-8 pb-12">
            <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
              <Link href="/" className="hover:text-white transition-colors">{tBlog('post.breadcrumbHome')}</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white transition-colors">{tBlog('post.breadcrumbBlog')}</Link>
              <span>/</span>
              <span className="text-white/80 truncate max-w-[200px]">{translation.title}</span>
            </nav>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${categoryColor}`}>
                {post.category}
              </span>
              {post.readingTime && (
                <span className="text-white/50 text-sm">⏱ {post.readingTime} {tBlog('post.readingTime', { count: post.readingTime })}</span>
              )}
              {post.publishedAt && (
                <span className="text-white/50 text-sm">
                  📅 {new Date(post.publishedAt).toLocaleDateString(toIntlLocale(locale), { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              <span className="text-white/50 text-sm">✍️ {tBlog('post.byAuthor', { author: post.author })}</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
              {translation.title}
            </h1>

            <p className="text-xl text-white/60 leading-relaxed border-l-4 border-amber-500/40 pl-6">
              {translation.excerpt}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 max-w-4xl pb-24">
          <div className="border-t border-white/10 pt-12">
            <BlogContent html={translation.content || ''} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:border-amber-500/30 hover:text-white/80 transition-all duration-300 cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center hover:border-amber-500/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] transition-all duration-500">
            <h3 className="text-2xl font-bold text-white mb-3">
              {tBlog('post.ctaTitle')}
            </h3>
            <p className="text-white/60 mb-6">
              {tBlog('post.ctaSubtitle', { years: yearsExperience })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/configurador"
                data-blog-cta="blog_post_configurator"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 font-bold rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(251,191,36,0.3)]"
              >
                {tBlog('post.ctaPrimary')}
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/blog"
                data-blog-cta="blog_post_back"
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
