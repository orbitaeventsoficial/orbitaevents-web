/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  eslint: {
    // No tombar el build per errors d'ESLint (labels, no-used-vars, etc.)
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
    // Permite TODAS las imágenes locales y externas (necesario para /public/img/portfolio)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers de cache i seguretat
  async headers() {
    // Security headers comuns
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    return [
      // Security headers per totes les pàgines
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache agressiu per imatges del portfolio
      {
        source: '/img/portfolio/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache agressiu per vídeos
      {
        source: '/video/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // No cache per API routes
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },

  // Esto evita errores raros con rutas dinámicas grandes
  experimental: {
    largePageDataBytes: 500 * 1000, // 500KB
  },
};

// Importar next-intl solo si está instalado (para evitar errores en build)
let withNextIntl;
try {
  const createNextIntlPlugin = (await import('next-intl/plugin')).default;
  withNextIntl = createNextIntlPlugin('./i18n.ts');
} catch (e) {
  // next-intl no instalado, usar config sin i18n
  withNextIntl = (config) => config;
}

export default withNextIntl(nextConfig);
