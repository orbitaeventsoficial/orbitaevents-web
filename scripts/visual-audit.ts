/**
 * Visual audit script — captures screenshots of all public pages
 * Run: npx playwright test scripts/visual-audit.ts
 * Or: npx tsx scripts/visual-audit.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3099';
const OUT_DIR = path.join(process.cwd(), 'screenshots');

// Public pages (no DB needed for most)
const PUBLIC_PAGES = [
  { name: '01-home-ca', url: '/ca', wait: 3000 },
  { name: '02-home-es', url: '/es', wait: 3000 },
  { name: '03-servicios', url: '/ca/serveis', wait: 2000 },
  { name: '04-halloween', url: '/ca/tematica-halloween', wait: 2000 },
  { name: '05-configurador', url: '/ca/configurador', wait: 3000 },
  { name: '06-contacte', url: '/ca/contacte', wait: 2000 },
  { name: '07-blog', url: '/ca/blog', wait: 2000 },
  { name: '08-faq', url: '/ca/faq', wait: 2000 },
  { name: '09-legal-cookies', url: '/ca/legal/cookies', wait: 1500 },
  { name: '10-legal-privacitat', url: '/ca/legal/privacidad', wait: 1500 },
  { name: '11-legal-termes', url: '/ca/legal/terminos', wait: 1500 },
];

// Mobile viewport
const MOBILE_PAGES = [
  { name: '20-mobile-home', url: '/ca', wait: 3000 },
  { name: '21-mobile-configurador', url: '/ca/configurador', wait: 3000 },
  { name: '22-mobile-contacte', url: '/ca/contacte', wait: 2000 },
];

// Admin pages (will show loading or login, but we can see the layout)
const ADMIN_PAGES = [
  { name: '30-admin-login', url: '/admin/login', wait: 2000 },
  { name: '31-admin-dashboard', url: '/admin', wait: 3000 },
  { name: '32-admin-bookings', url: '/admin/bookings', wait: 2000 },
  { name: '33-admin-leads', url: '/admin/leads', wait: 2000 },
  { name: '34-admin-clientes', url: '/admin/clientes', wait: 2000 },
  { name: '35-admin-blog', url: '/admin/blog', wait: 2000 },
  { name: '36-admin-inventory', url: '/admin/inventory', wait: 2000 },
  { name: '37-admin-economia', url: '/admin/economia', wait: 2000 },
  { name: '38-admin-calendar', url: '/admin/calendar', wait: 2000 },
  { name: '39-admin-canvas', url: '/admin/canvas', wait: 2000 },
];

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Desktop screenshots
  console.log('📸 Desktop screenshots...');
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const desktopPage = await desktopCtx.newPage();

  for (const pg of [...PUBLIC_PAGES, ...ADMIN_PAGES]) {
    try {
      console.log(`  → ${pg.name}: ${pg.url}`);
      await desktopPage.goto(`${BASE}${pg.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      await desktopPage.waitForTimeout(pg.wait);
      await desktopPage.screenshot({
        path: path.join(OUT_DIR, `${pg.name}.png`),
        fullPage: true,
      });
    } catch (err) {
      console.log(`  ⚠️ ${pg.name}: ${(err as Error).message?.slice(0, 80)}`);
      // Try partial screenshot
      try {
        await desktopPage.screenshot({
          path: path.join(OUT_DIR, `${pg.name}-partial.png`),
          fullPage: false,
        });
      } catch { /* skip */ }
    }
  }
  await desktopCtx.close();

  // Mobile screenshots
  console.log('\n📱 Mobile screenshots...');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileCtx.newPage();

  for (const pg of MOBILE_PAGES) {
    try {
      console.log(`  → ${pg.name}: ${pg.url}`);
      await mobilePage.goto(`${BASE}${pg.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      await mobilePage.waitForTimeout(pg.wait);
      await mobilePage.screenshot({
        path: path.join(OUT_DIR, `${pg.name}.png`),
        fullPage: true,
      });
    } catch (err) {
      console.log(`  ⚠️ ${pg.name}: ${(err as Error).message?.slice(0, 80)}`);
    }
  }
  await mobileCtx.close();

  await browser.close();
  console.log(`\n✅ Screenshots saved to ${OUT_DIR}`);
}

run().catch(console.error);
