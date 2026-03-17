/**
 * Visual audit script — captures screenshots of public and admin pages
 * Run: npx tsx scripts/visual-audit.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = process.env.VISUAL_AUDIT_BASE || 'http://localhost:3099';
const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
const OUT_DIR = path.join(process.cwd(), 'screenshots');

const PUBLIC_PAGES = [
  { name: '01-home-ca', url: '/ca', wait: 3000 },
  { name: '02-home-es', url: '/es', wait: 3000 },
  { name: '03-servicios', url: '/ca/servicios', wait: 2000 },
  { name: '04-halloween', url: '/ca/tematica-halloween', wait: 2000 },
  { name: '05-configurador', url: '/ca/configurador', wait: 3000 },
  { name: '06-contacto', url: '/ca/contacto', wait: 2000 },
  { name: '07-blog', url: '/ca/blog', wait: 2000 },
  { name: '08-faq', url: '/ca/faq', wait: 2000 },
  { name: '09-legal-cookies', url: '/ca/legal/cookies', wait: 1500 },
  { name: '10-legal-privacitat', url: '/ca/legal/privacidad', wait: 1500 },
  { name: '11-legal-termes', url: '/ca/legal/terminos', wait: 1500 },
];

const MOBILE_PAGES = [
  { name: '20-mobile-home', url: '/ca', wait: 3000 },
  { name: '21-mobile-configurador', url: '/ca/configurador', wait: 3000 },
  { name: '22-mobile-contacto', url: '/ca/contacto', wait: 2000 },
];

const ADMIN_PAGES = [
  { name: '31-admin-dashboard', url: '/admin', wait: 3000 },
  { name: '32-admin-bookings', url: '/admin/bookings', wait: 2000 },
  { name: '33-admin-leads', url: '/admin/leads', wait: 2000 },
  { name: '34-admin-clientes', url: '/admin/clientes', wait: 2000 },
  { name: '35-admin-blog', url: '/admin/blog', wait: 2000 },
  { name: '36-admin-inventory', url: '/admin/inventory', wait: 2000 },
  { name: '37-admin-economia', url: '/admin/economia', wait: 2000 },
  { name: '38-admin-calendario', url: '/admin/calendario', wait: 2000 },
  { name: '39-admin-canvas', url: '/admin/canvas', wait: 2000 },
];

async function gotoStable(page: import('playwright').Page, url: string, waitMs: number) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  try {
    await page.waitForLoadState('load', { timeout: 10000 });
  } catch {
    // Some pages keep third-party requests open; DOM + a short settle is enough for screenshots.
  }

  await page.waitForTimeout(waitMs);
}

async function capturePages(page: import('playwright').Page, pages: Array<{ name: string; url: string; wait: number }>) {
  for (const pg of pages) {
    try {
      console.log(`  → ${pg.name}: ${pg.url}`);
      await gotoStable(page, `${BASE}${pg.url}`, pg.wait);
      await page.screenshot({
        path: path.join(OUT_DIR, `${pg.name}.png`),
        fullPage: true,
      });
    } catch (err) {
      console.log(`  ⚠️ ${pg.name}: ${(err as Error).message?.slice(0, 120)}`);
      try {
        await page.screenshot({
          path: path.join(OUT_DIR, `${pg.name}-partial.png`),
          fullPage: false,
        });
      } catch {
        // Ignore screenshot fallback errors.
      }
    }
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  console.log('📸 Public desktop screenshots...');
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  await capturePages(await desktopCtx.newPage(), PUBLIC_PAGES);
  await desktopCtx.close();

  console.log('\n🔐 Admin screenshots...');
  const adminCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64')}`,
    },
  });
  await capturePages(await adminCtx.newPage(), ADMIN_PAGES);
  await adminCtx.close();

  console.log('\n📱 Mobile screenshots...');
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
    hasTouch: true,
  });
  await capturePages(await mobileCtx.newPage(), MOBILE_PAGES);
  await mobileCtx.close();

  await browser.close();
  console.log(`\n✅ Screenshots saved to ${OUT_DIR}`);
}

run().catch(console.error);
