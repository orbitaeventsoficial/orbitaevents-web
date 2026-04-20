/**
 * Captures: booking detail real (ID concret) + customer hub + leads list
 * Run: npx tsx scripts/capture-check-2.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
const OUT_DIR = path.join(process.cwd(), 'screenshots', 'check-2026-04-09');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const page = await ctx.newPage();

  // Get booking IDs from the list (wait longer — domcontentloaded)
  try {
    await page.goto(`${BASE}/admin/bookings`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    // Click "Veure" button on first row to get detail
    const veureLinks = await page.locator('a:has-text("Veure")').all();
    console.log(`Found ${veureLinks.length} Veure links`);
    if (veureLinks.length > 0) {
      const href = await veureLinks[0].getAttribute('href');
      console.log(`First href: ${href}`);
      if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3500);
        await page.screenshot({ path: path.join(OUT_DIR, '14-booking-detail-real.png'), fullPage: true });
        console.log('OK booking detail real');
      }
    }
  } catch (e) { console.log('FAIL booking detail: ' + (e as Error).message); }

  // Leads list
  try {
    await page.goto(`${BASE}/admin/leads`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, '12-admin-leads.png'), fullPage: true });
    console.log('OK leads list');
  } catch (e) { console.log('FAIL leads list: ' + (e as Error).message); }

  // Customer hub — listing + first detail
  try {
    await page.goto(`${BASE}/admin/clientes`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT_DIR, '13-admin-clientes.png'), fullPage: true });
    console.log('OK clientes list');

    // Try to click first row link
    const customerLinks = await page.locator('a[href^="/admin/clientes/"]').all();
    console.log(`Found ${customerLinks.length} customer links`);
    for (const link of customerLinks) {
      const href = await link.getAttribute('href');
      // Filter out "/admin/clientes" itself
      if (href && href !== '/admin/clientes' && /\/admin\/clientes\/[^/]+/.test(href)) {
        console.log(`Opening: ${href}`);
        await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3500);
        await page.screenshot({ path: path.join(OUT_DIR, '16-customer-hub.png'), fullPage: true });
        console.log('OK customer hub');
        break;
      }
    }
  } catch (e) { console.log('FAIL customer hub: ' + (e as Error).message); }

  await ctx.close();
  await browser.close();
  console.log(`\nCaptures a: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
