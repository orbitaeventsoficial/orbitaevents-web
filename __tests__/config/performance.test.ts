import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Tests de configuració de performance
 * Verifica que les optimitzacions de velocitat estan correctament configurades
 */

describe('Performance config', () => {
  describe('next.config.mjs', () => {
    const configPath = path.resolve(__dirname, '../../next.config.mjs');
    let configContent: string;

    it('should exist', () => {
      expect(fs.existsSync(configPath)).toBe(true);
      configContent = fs.readFileSync(configPath, 'utf-8');
    });

    it('should have poweredByHeader disabled', () => {
      configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('poweredByHeader: false');
    });

    it('should have compression enabled', () => {
      configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('compress: true');
    });

    it('should have swcMinify enabled', () => {
      configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('swcMinify: true');
    });

    it('should disable production source maps', () => {
      configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('productionBrowserSourceMaps: false');
    });

    it('should use modern image formats (webp + avif)', () => {
      configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain("'image/webp'");
      expect(configContent).toContain("'image/avif'");
    });

    it('should have immutable cache for static assets', () => {
      configContent = fs.readFileSync(configPath, 'utf-8');
      const immutableCacheCount = (configContent.match(/max-age=31536000, immutable/g) || []).length;
      // At least: portfolio images, videos, /videos/, /img/, fonts, _next/static
      expect(immutableCacheCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Root layout preconnect hints', () => {
    const layoutPath = path.resolve(__dirname, '../../app/layout.tsx');
    let layoutContent: string;

    it('should have preconnect for Google Fonts', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('rel="preconnect" href="https://fonts.googleapis.com"');
      expect(layoutContent).toContain('rel="preconnect" href="https://fonts.gstatic.com"');
    });

    it('should have preconnect for GTM', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('rel="preconnect" href="https://www.googletagmanager.com"');
    });

    it('should have dns-prefetch for analytics', () => {
      layoutContent = fs.readFileSync(layoutPath, 'utf-8');
      expect(layoutContent).toContain('rel="dns-prefetch" href="https://www.google-analytics.com"');
    });
  });

  describe('Homepage lazy loading', () => {
    const pagePath = path.resolve(__dirname, '../../app/[locale]/page.tsx');
    let pageContent: string;

    it('should dynamic import all sections', () => {
      pageContent = fs.readFileSync(pagePath, 'utf-8');
      const dynamicImports = (pageContent.match(/dynamic\(/g) || []).length;
      // HeroElegant + ServicesGrid + CalendarioUrgencia + GoogleReviews + TrustedByLogos +
      // StatsSection + ProcessSection + PortfolioShowcase + GarantiaSection + CTAFinal +
      // FAQSection + HomePageWrapper + HomepageScrollTracker
      expect(dynamicImports).toBeGreaterThanOrEqual(10);
    });

    it('should have ssr: false for below-fold heavy sections', () => {
      pageContent = fs.readFileSync(pagePath, 'utf-8');
      // These sections are below the fold and don't need SSR
      expect(pageContent).toContain("import('@/app/components/marketing/StatsSection')");
      expect(pageContent).toContain("import('@/app/components/marketing/ProcessSection')");
      expect(pageContent).toContain("import('@/app/components/marketing/CTAFinal')");
    });

    it('should lazy load FAQ for performance', () => {
      pageContent = fs.readFileSync(pagePath, 'utf-8');
      // FAQSection is lazy loaded with ssr: false (JSON-LD schema is handled separately)
      const faqBlock = pageContent.slice(
        pageContent.indexOf("import('@/app/components/home/FAQSection')"),
        pageContent.indexOf("import('@/app/components/home/FAQSection')") + 150,
      );
      expect(faqBlock).toContain('ssr: false');
    });
  });

  describe('Hero performance', () => {
    const heroPath = path.resolve(__dirname, '../../app/components/ui/HeroElegant.tsx');
    let heroContent: string;

    it('should use metadata preload for video (not auto)', () => {
      heroContent = fs.readFileSync(heroPath, 'utf-8');
      expect(heroContent).toContain('preload="metadata"');
      expect(heroContent).not.toContain('preload="auto"');
    });

    it('should have priority on first image', () => {
      heroContent = fs.readFileSync(heroPath, 'utf-8');
      expect(heroContent).toContain('priority={slideIndex === 0}');
    });

    it('should have particles with z-index above overlays', () => {
      heroContent = fs.readFileSync(heroPath, 'utf-8');
      expect(heroContent).toMatch(/AmbientParticles.*z-\[/s);
    });

    it('should have brightness filter on images', () => {
      heroContent = fs.readFileSync(heroPath, 'utf-8');
      expect(heroContent).toContain('brightness(0.6)');
    });

    it('should use logo as poster instead of hero-poster.webp', () => {
      heroContent = fs.readFileSync(heroPath, 'utf-8');
      expect(heroContent).not.toContain('hero-poster.webp');
      expect(heroContent).toContain('orbitalockupwhite.svg');
    });
  });
});

describe('Google Reviews typography', () => {
  const reviewsPath = path.resolve(__dirname, '../../app/components/home/GoogleReviewsRotating.tsx');
  let content: string;

  it('should use Roboto font family for Google-style typography', () => {
    content = fs.readFileSync(reviewsPath, 'utf-8');
    expect(content).toContain('Roboto');
  });

  it('should NOT use italic for review text', () => {
    content = fs.readFileSync(reviewsPath, 'utf-8');
    // The blockquote should not have italic class
    const blockquoteMatch = content.match(/blockquote className="([^"]+)"/);
    expect(blockquoteMatch).toBeTruthy();
    expect(blockquoteMatch![1]).not.toContain('italic');
  });

  it('should use font-medium for author name (not font-black)', () => {
    content = fs.readFileSync(reviewsPath, 'utf-8');
    // Author h4 should be font-medium
    expect(content).toContain('font-medium text-white text-base');
  });
});
