// app/robots.ts
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';


/**
 * Genera el archivo robots.txt optimizado para SEO.
 * Permite indexacion completa y referencia sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

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
          '/*?*',
        ],
      },
      {
        // Reglas especificas para Googlebot
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Reglas para bots de imagenes
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
      {
        // Permitir crawlers de redes sociales
        userAgent: ['Twitterbot'],
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // Host principal (ayuda a consolidar senales SEO)
    host: baseUrl,
  };
}
