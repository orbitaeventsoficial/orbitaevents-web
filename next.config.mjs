/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  eslint: {
    // Detectar errores durante el build para mantener calidad de codigo
    ignoreDuringBuilds: false,
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
    // Dominios permitidos para imagenes externas
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'orbitaevents.com',
      },
      {
        protocol: 'https',
        hostname: 'www.orbitaevents.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
    ],
  },

  // Headers de cache y seguridad
  async headers() {
    // Detectar si estamos en desarrollo
    const isDev = process.env.NODE_ENV === 'development';

    // Security headers comunes
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      // HSTS - Force HTTPS for 1 year, include subdomains, allow preload list
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          // En desarrollo, agregar 'unsafe-eval' para Next.js hot reload
          // También necesario para Cloudflare Turnstile CAPTCHA
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://cloud.umami.is`,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
          "img-src 'self' data: blob: https://orbitaevents.com https://*.supabase.co https://lh3.googleusercontent.com https://maps.googleapis.com https://*.googletagmanager.com https://*.google-analytics.com https://stats.g.doubleclick.net https://ssl.google-analytics.com https://www.google.es",
          "font-src 'self' https://fonts.gstatic.com",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com",
          "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://region1.analytics.google.com https://www.googletagmanager.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://www.google.es wss://ws-us3.pusher.com https://challenges.cloudflare.com https://cloud.umami.is",
          "worker-src 'self' blob:",
        ].join('; ')
      },
    ];

    return [
      // Security headers para todas las paginas
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache agresivo para imagenes del portfolio
      {
        source: '/img/portfolio/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache agresivo para videos
      {
        source: '/video/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // No cache para API routes + CORS restrictivo
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Vary', value: 'Origin' },
          // CORS: permitir solo requests del dominio principal
          { key: 'Access-Control-Allow-Origin', value: 'https://orbitaevents.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/umami/script.js', destination: 'https://cloud.umami.is/script.js' },
      { source: '/umami/api/send', destination: 'https://cloud.umami.is/api/send' },
    ];
  },

  // Esto evita errores raros con rutas dinamicas grandes
  experimental: {
    largePageDataBytes: 500 * 1000, // 500KB
  },
};

// Importar plugins
let withNextIntl;
try {
  const createNextIntlPlugin = (await import('next-intl/plugin')).default;
  withNextIntl = createNextIntlPlugin('./i18n.ts');
} catch (e) {
  // next-intl no instalado, usar config sin i18n
  withNextIntl = (config) => config;
}

// Aplicar plugins en orden: next-intl
const configWithIntl = withNextIntl(nextConfig);

export default configWithIntl;
