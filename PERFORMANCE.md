# Performance Optimization Guide

## Optimizations Implemented

### 1. **Image Optimization**
- ✅ Next.js Image component with automatic optimization
- ✅ WebP/AVIF format conversion
- ✅ Lazy loading with Intersection Observer
- ✅ Blur placeholders for better perceived performance
- ✅ Responsive images with srcset

**Usage**:
```tsx
import { LazyImage } from '@/components/performance/LazyImage';

<LazyImage
  src="/img/portfolio/bodas-01.webp"
  alt="Boda en Barcelona"
  width={800}
  height={600}
  lowQualitySrc="/img/portfolio/bodas-01-blur.webp"
/>
```

### 2. **Code Splitting**
- ✅ Dynamic imports for heavy components
- ✅ Route-based code splitting (automatic with App Router)
- ✅ Component-level code splitting

**Usage**:
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-side only if needed
});
```

### 3. **Font Optimization**
- ✅ Font preloading
- ✅ font-display: swap for better FCP
- ✅ Self-hosted fonts (recommended)

**Current setup** (in root layout):
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
```

### 4. **Caching Strategy**
- ✅ Static assets: 1 year cache
- ✅ Portfolio images: immutable cache
- ✅ API routes: no-cache or revalidate
- ✅ ISR (Incremental Static Regeneration) where applicable

**Configuration** (next.config.mjs):
- Portfolio images: `max-age=31536000, immutable`
- Static pages: ISR with `revalidate: 3600` (1 hour)

### 5. **Bundle Optimization**
- ✅ Tree shaking enabled
- ✅ SWC minification
- ✅ Automatic code splitting
- ✅ CSS optimization with cssnano

### 6. **Performance Monitoring**
- ✅ Vercel Speed Insights
- ✅ Vercel Analytics
- ✅ Web Vitals tracking
- ✅ Lighthouse CI configuration

### 7. **Client-Side Optimizations**
- ✅ Debounce/throttle for expensive operations
- ✅ Request idle callback for non-critical tasks
- ✅ Deferred component loading
- ✅ Prefetching critical resources

## Performance Targets

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Lighthouse Scores
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 95

## Running Performance Audits

### Local Lighthouse
```bash
# Install Lighthouse CI
pnpm add -D @lhci/cli

# Run audit
npx lhci autorun
```

### Manual Testing
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Performance" category
4. Run audit

### Production Monitoring
- Vercel Analytics: https://vercel.com/dashboard/analytics
- Speed Insights: Automatic with @vercel/speed-insights

## Best Practices

### Images
1. Always use Next.js `<Image>` component
2. Provide width/height to prevent CLS
3. Use appropriate formats (WebP for photos, SVG for icons)
4. Compress images before upload (TinyPNG, Squoosh)

### JavaScript
1. Minimize client-side JavaScript
2. Use server components where possible
3. Lazy load non-critical components
4. Avoid large dependencies

### CSS
1. Avoid large CSS frameworks
2. Use Tailwind's JIT mode
3. Purge unused CSS
4. Inline critical CSS

### API
1. Implement caching with appropriate TTL
2. Use ISR for frequently accessed pages
3. Minimize API calls on page load
4. Use pagination for large datasets

## Monitoring

### Check Performance Regularly
```bash
# Health check with response time
pnpm health

# Run E2E tests (includes performance checks)
pnpm test:e2e

# Run Lighthouse audit
npx lhci autorun
```

### Key Metrics to Monitor
- Server response time (TTFB)
- Page load time
- Time to Interactive (TTI)
- Bundle size
- API response times

## Troubleshooting

### Slow Page Load
1. Check bundle size: `pnpm build` and review `.next/analyze`
2. Audit network requests in DevTools
3. Check for render-blocking resources
4. Verify CDN is working

### High LCP
1. Optimize hero images
2. Preload critical resources
3. Reduce server response time
4. Use CDN for static assets

### High CLS
1. Add width/height to images
2. Reserve space for dynamic content
3. Avoid inserting content above fold
4. Use CSS containment

## Tools

- **Lighthouse CI**: Automated performance testing
- **WebPageTest**: Detailed performance analysis
- **Chrome DevTools**: Performance profiling
- **Vercel Analytics**: Real user monitoring
- **Bundle Analyzer**: Analyze bundle size

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
