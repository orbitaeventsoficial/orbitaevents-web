// app/robots.ts
import type { MetadataRoute } from 'next';

/**
 * Genera el archivo robots.txt optimizado para SEO.
 * Permite indexación completa y referencia sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloqueamos rutas que no queremos indexar
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '*.json',
          '/*?*', // URLs con query params (evitar duplicados)
        ],
      },
      {
        // Reglas específicas para Googlebot
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Reglas para bots de imágenes
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
      {
        // Permitir crawlers de redes sociales
        userAgent: ['Twitterbot', 'facebookexternalhit'],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // Host principal (ayuda a consolidar señales SEO)
    host: baseUrl,
  };
}
