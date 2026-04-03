// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n';
import { PORTFOLIO_CATEGORIES } from '@/app/config/portfolio-images';
import { listPortfolioEvents } from '@/lib/services/portfolioEventService';
import { getEnabledZoneLandingSlugs } from '@/lib/coverage';
import { getSiteUrl } from '@/lib/site';

async function getPortfolioEventRoutes(): Promise<{ categorySlug: string; slug: string; updatedAt?: string }[]> {
  try {
    const result = await listPortfolioEvents({ published: true, limit: 500 });
    return result.events.map((event) => ({
      categorySlug: event.categorySlug,
      slug: event.slug,
      updatedAt: event.updatedAt?.toISOString?.() || undefined,
    }));
  } catch {
    return [];
  }
}

async function getBlogSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const base = getSiteUrl();
    const res = await fetch(`${base}/api/public/blog?limit=50&locale=es`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.posts || []).map((p: { slug: string; updatedAt?: string }) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const [enabledZoneSlugs, blogSlugs, portfolioEventRoutes] = await Promise.all([
    getEnabledZoneLandingSlugs(),
    getBlogSlugs(),
    getPortfolioEventRoutes(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/configurador`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/boda-halloween`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tematica-mon-magic`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tematica-halloween`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/servicios`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/servicios/bodas`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/servicios/discomovil`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/empresas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/fiestas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/animacion-infantil`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/produccion`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/servicios/alquiler`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/opiniones`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/sensorial`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/aviso-legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const zonePages: MetadataRoute.Sitemap = enabledZoneSlugs.map((slug) => ({
    url: `${base}/servicios/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const localizedPages: MetadataRoute.Sitemap = [];
  const secondaryLocales = locales.filter((locale) => locale !== defaultLocale);
  const pagesToLocalize = [...staticPages, ...zonePages].filter((page) => !page.url.includes('/legal/'));

  pagesToLocalize.forEach((page) => {
    secondaryLocales.forEach((locale) => {
      const localizedUrl = page.url.replace(base, `${base}/${locale}`);
      localizedPages.push({
        ...page,
        url: localizedUrl,
        priority: (page.priority || 0.5) * 0.9,
      });
    });
  });

  const portfolioPages: MetadataRoute.Sitemap = PORTFOLIO_CATEGORIES.map((category) => category.slug).map((slug) => ({
    url: `${base}/portfolio/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const localizedPortfolioPages: MetadataRoute.Sitemap = [];
  PORTFOLIO_CATEGORIES.map((category) => category.slug).forEach((slug) => {
    secondaryLocales.forEach((locale) => {
      localizedPortfolioPages.push({
        url: `${base}/${locale}/portfolio/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      });
    });
  });

  const portfolioEventPages: MetadataRoute.Sitemap = portfolioEventRoutes.map(({ categorySlug, slug, updatedAt }) => ({
    url: `${base}/portfolio/${categorySlug}/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.62,
  }));

  const localizedPortfolioEventPages: MetadataRoute.Sitemap = [];
  portfolioEventRoutes.forEach(({ categorySlug, slug, updatedAt }) => {
    secondaryLocales.forEach((locale) => {
      localizedPortfolioEventPages.push({
        url: `${base}/${locale}/portfolio/${categorySlug}/${slug}`,
        lastModified: updatedAt ? new Date(updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.56,
      });
    });
  });

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map(({ slug, updatedAt }) => ({
    url: `${base}/blog/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }));

  const localizedBlogPages: MetadataRoute.Sitemap = [];
  blogSlugs.forEach(({ slug, updatedAt }) => {
    secondaryLocales.forEach((locale) => {
      localizedBlogPages.push({
        url: `${base}/${locale}/blog/${slug}`,
        lastModified: updatedAt ? new Date(updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.58,
      });
    });
  });

  return [
    ...staticPages,
    ...zonePages,
    ...localizedPages,
    ...portfolioPages,
    ...localizedPortfolioPages,
    ...portfolioEventPages,
    ...localizedPortfolioEventPages,
    ...blogPages,
    ...localizedBlogPages,
  ];
}
