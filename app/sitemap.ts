// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n';
import { getEnabledZoneLandingSlugs } from '@/lib/coverage';

// Categorias de portfolio para incluir en sitemap
const PORTFOLIO_SLUGS = [
  'bodas',
  'discomovil',
  'eventos-empresa',
  'fiestas-infantiles',
  'fiestas-privadas',
  'produccion-tecnica',
  'alquiler-equipo',
  'fiestas-tematicas-halloween',
  'fiestas-tematicas-mon-magic',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com';
  const now = new Date();
  const enabledZoneSlugs = await getEnabledZoneLandingSlugs();

  // Paginas estaticas con prioridades estrategicas
  const staticPages: MetadataRoute.Sitemap = [
    // Home - maxima prioridad
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },

    // Conversion - muy alta prioridad
    { url: `${base}/configurador`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },

    // Landing SEO especial (diferenciador)
    { url: `${base}/boda-halloween`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tematica-mon-magic`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tematica-halloween`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },

    // Servicios principales
    { url: `${base}/servicios`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/servicios/bodas`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/servicios/discomovil`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/empresas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/fiestas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/animacion-infantil`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/produccion`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/servicios/alquiler`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },

    // Contenido / Trust
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/opiniones`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/sensorial`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Legal
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

  // Versiones en otros idiomas (solo no-default)
  const localizedPages: MetadataRoute.Sitemap = [];
  const secondaryLocales = locales.filter((locale) => locale !== defaultLocale);

  // Solo localizar las paginas principales, no las legales
  const pagesToLocalize = [...staticPages, ...zonePages].filter(p => !p.url.includes('/legal/'));

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

  // Paginas dinamicas de portfolio
  const portfolioPages: MetadataRoute.Sitemap = PORTFOLIO_SLUGS.map(slug => ({
    url: `${base}/portfolio/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Versiones localizadas de portfolio
  const localizedPortfolioPages: MetadataRoute.Sitemap = [];
  PORTFOLIO_SLUGS.forEach(slug => {
    secondaryLocales.forEach(locale => {
      localizedPortfolioPages.push({
        url: `${base}/${locale}/portfolio/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      });
    });
  });

  return [...staticPages, ...zonePages, ...localizedPages, ...portfolioPages, ...localizedPortfolioPages];
}
