import { test, expect } from '@playwright/test';

const AUTH = 'orbita:Orbitaevents040120+++';
const BASE = process.env.BASE_URL || 'http://localhost:3000';

interface PerfResult {
  page: string;
  device: string;
  ttfb: number;
  domContentLoaded: number;
  load: number;
  lcp: number | null;
  cls: number | null;
  resourceCount: number;
  transferSize: number;
}

const results: PerfResult[] = [];

const PUBLIC_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/ca/serveis', name: 'Serveis' },
  { path: '/ca/portfolio', name: 'Portfolio' },
  { path: '/ca/blog', name: 'Blog' },
  { path: '/ca/contacte', name: 'Contacte' },
  { path: '/ca/faq', name: 'FAQ' },
  { path: '/ca/tematica-halloween', name: 'Halloween' },
  { path: '/ca/tematica-mon-magic', name: 'Mon Magic' },
];

const ADMIN_PAGES = [
  { path: '/admin', name: 'Admin Home' },
  { path: '/admin/leads', name: 'Leads' },
  { path: '/admin/bookings?view=kanban', name: 'Bookings' },
  { path: '/admin/clientes', name: 'Clients' },
  { path: '/admin/economia', name: 'Economia' },
  { path: '/admin/calendario', name: 'Calendari' },
  { path: '/admin/inventory', name: 'Inventari' },
  { path: '/admin/tasks', name: 'Tasques' },
  { path: '/admin/inbox', name: 'Inbox' },
  { path: '/admin/salut', name: 'Salut' },
];

async function measurePage(
  page: import('@playwright/test').Page,
  url: string,
  pageName: string,
  device: string,
  isAdmin: boolean,
) {
  if (isAdmin) {
    const token = Buffer.from(AUTH).toString('base64');
    await page.setExtraHTTPHeaders({ Authorization: `Basic ${token}` });
  }

  // Collect performance entries
  const startNav = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  const loadTime = Date.now() - startNav;

  // Extract Web Vitals from Performance API
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // LCP
    let lcp: number | null = null;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      lcp = Math.round((lcpEntries[lcpEntries.length - 1] as PerformanceEntry & { startTime: number }).startTime);
    }

    // CLS
    let cls: number | null = null;
    const clsEntries = performance.getEntriesByType('layout-shift');
    if (clsEntries.length > 0) {
      cls = clsEntries.reduce((sum, e) => sum + ((e as PerformanceEntry & { value: number }).value || 0), 0);
      cls = Math.round(cls * 1000) / 1000;
    }

    const totalTransfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    return {
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      load: Math.round(nav.loadEventEnd - nav.startTime),
      lcp,
      cls,
      resourceCount: resources.length,
      transferSize: Math.round(totalTransfer / 1024),
    };
  });

  return {
    page: pageName,
    device,
    ttfb: perf.ttfb,
    domContentLoaded: perf.domContentLoaded,
    load: perf.load || loadTime,
    lcp: perf.lcp,
    cls: perf.cls,
    resourceCount: perf.resourceCount,
    transferSize: perf.transferSize,
  };
}

test.describe('Performance Audit — Public Pages', () => {
  for (const pg of PUBLIC_PAGES) {
    test(`[Desktop] ${pg.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const r = await measurePage(page, pg.path, pg.name, 'Desktop', false);
      results.push(r);
      console.log(`PUBLIC Desktop | ${r.page.padEnd(15)} | TTFB ${String(r.ttfb).padStart(5)}ms | DCL ${String(r.domContentLoaded).padStart(5)}ms | Load ${String(r.load).padStart(5)}ms | LCP ${String(r.lcp ?? '—').padStart(5)}ms | CLS ${String(r.cls ?? '—').padStart(5)} | ${r.resourceCount} reqs | ${r.transferSize}KB`);
      expect(r.load).toBeLessThan(15000);
      await ctx.close();
    });

    test(`[Mobile] ${pg.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Mobile' });
      const page = await ctx.newPage();
      const r = await measurePage(page, pg.path, pg.name, 'Mobile', false);
      results.push(r);
      console.log(`PUBLIC Mobile  | ${r.page.padEnd(15)} | TTFB ${String(r.ttfb).padStart(5)}ms | DCL ${String(r.domContentLoaded).padStart(5)}ms | Load ${String(r.load).padStart(5)}ms | LCP ${String(r.lcp ?? '—').padStart(5)}ms | CLS ${String(r.cls ?? '—').padStart(5)} | ${r.resourceCount} reqs | ${r.transferSize}KB`);
      expect(r.load).toBeLessThan(15000);
      await ctx.close();
    });

    test(`[Tablet] ${pg.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Mobile' });
      const page = await ctx.newPage();
      const r = await measurePage(page, pg.path, pg.name, 'Tablet', false);
      results.push(r);
      console.log(`PUBLIC Tablet  | ${r.page.padEnd(15)} | TTFB ${String(r.ttfb).padStart(5)}ms | DCL ${String(r.domContentLoaded).padStart(5)}ms | Load ${String(r.load).padStart(5)}ms | LCP ${String(r.lcp ?? '—').padStart(5)}ms | CLS ${String(r.cls ?? '—').padStart(5)} | ${r.resourceCount} reqs | ${r.transferSize}KB`);
      expect(r.load).toBeLessThan(15000);
      await ctx.close();
    });
  }
});

test.describe('Performance Audit — Admin Pages', () => {
  for (const pg of ADMIN_PAGES) {
    test(`[Desktop] ${pg.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const r = await measurePage(page, pg.path, pg.name, 'Desktop', true);
      results.push(r);
      console.log(`ADMIN Desktop  | ${r.page.padEnd(15)} | TTFB ${String(r.ttfb).padStart(5)}ms | DCL ${String(r.domContentLoaded).padStart(5)}ms | Load ${String(r.load).padStart(5)}ms | LCP ${String(r.lcp ?? '—').padStart(5)}ms | CLS ${String(r.cls ?? '—').padStart(5)} | ${r.resourceCount} reqs | ${r.transferSize}KB`);
      expect(r.load).toBeLessThan(15000);
      await ctx.close();
    });

    test(`[Mobile] ${pg.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Mobile' });
      const page = await ctx.newPage();
      const r = await measurePage(page, pg.path, pg.name, 'Mobile', true);
      results.push(r);
      console.log(`ADMIN Mobile   | ${r.page.padEnd(15)} | TTFB ${String(r.ttfb).padStart(5)}ms | DCL ${String(r.domContentLoaded).padStart(5)}ms | Load ${String(r.load).padStart(5)}ms | LCP ${String(r.lcp ?? '—').padStart(5)}ms | CLS ${String(r.cls ?? '—').padStart(5)} | ${r.resourceCount} reqs | ${r.transferSize}KB`);
      expect(r.load).toBeLessThan(15000);
      await ctx.close();
    });
  }
});
