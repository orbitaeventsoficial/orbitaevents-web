// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com';
  const now = new Date();

  // Páginas estáticas con prioridades estratégicas
  const staticPages: MetadataRoute.Sitemap = [
    // Home - máxima prioridad
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    
    // Conversión - muy alta prioridad
    { url: `${base}/configurador`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    
    // Landing SEO especial (diferenciador)
    { url: `${base}/boda-halloween`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tematica-mon-magic`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    
    // Servicios principales
    { url: `${base}/servicios`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/servicios/bodas`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/servicios/discomovil`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/empresas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/fiestas`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/alquiler`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/servicios/produccion`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${base}/servicios/animacion-infantil`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Landing pages por zonas - Long-tail SEO
    { url: `${base}/servicios/dj-bodas-maresme`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/dj-bodas-girona`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/dj-bodas-costa-brava`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/servicios/dj-bodas-valles`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

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

  // Versiones en otros idiomas - NOMÉS CA i ES
  const locales = ['ca', 'es'];
  const localizedPages: MetadataRoute.Sitemap = [];
  
  // Solo localizar las páginas principales, no las legales
  const pagesToLocalize = staticPages.filter(p => !p.url.includes('/legal/'));
  
  pagesToLocalize.forEach((page) => {
    locales.forEach((locale) => {
      const localizedUrl = page.url.replace(base, `${base}/${locale}`);
      localizedPages.push({
        ...page,
        url: localizedUrl,
        priority: (page.priority || 0.5) * 0.9,
      });
    });
  });

  return [...staticPages, ...localizedPages];
}
