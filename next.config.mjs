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
    // Security headers comunes
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://*.sentry.io",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://orbitaevents.com https://*.supabase.co https://lh3.googleusercontent.com https://maps.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vercel.live",
          "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com https://*.sentry.io https://*.ingest.sentry.io",
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

// Importar Sentry
const { withSentryConfig } = await import('@sentry/nextjs');

// Aplicar plugins en orden: next-intl → Sentry
const configWithIntl = withNextIntl(nextConfig);

export default withSentryConfig(configWithIntl, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});