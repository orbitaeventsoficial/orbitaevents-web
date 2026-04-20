/**
 * Quick capture — hero públic + admin workspaces tocats a Fase 2
 * Run: npx tsx scripts/capture-check.ts
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

  // Public hero
  const pub = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pubPage = await pub.newPage();
  await pubPage.goto(`${BASE}/ca`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await pubPage.waitForTimeout(2500);
  await pubPage.screenshot({ path: path.join(OUT_DIR, '01-hero-ca.png'), fullPage: false });
  await pubPage.screenshot({ path: path.join(OUT_DIR, '01-home-ca-full.png'), fullPage: true });
  await pub.close();

  // Admin via HTTP Basic Auth
  const admin = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const page = await admin.newPage();

  const pages = [
    { name: '10-admin-dashboard', url: '/admin' },
    { name: '11-admin-bookings', url: '/admin/bookings' },
    { name: '12-admin-leads', url: '/admin/leads' },
    { name: '13-admin-clientes', url: '/admin/clientes' },
  ];

  for (const p of pages) {
    try {
      await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT_DIR, `${p.name}.png`), fullPage: true });
      console.log(`OK ${p.name}`);
    } catch (e) {
      console.log(`FAIL ${p.name}: ${(e as Error).message}`);
    }
  }

  // Try to open first booking + first lead + first customer detail
  try {
    await page.goto(`${BASE}/admin/bookings`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    const bookingLink = await page.locator('a[href*="/admin/bookings/"]').first();
    if (await bookingLink.count() > 0) {
      const href = await bookingLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT_DIR, '14-booking-detail.png'), fullPage: true });
        console.log('OK booking detail');
      }
    }
  } catch (e) { console.log('FAIL booking detail: ' + (e as Error).message); }

  try {
    await page.goto(`${BASE}/admin/leads`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    const leadLink = await page.locator('a[href*="/admin/leads/"]').first();
    if (await leadLink.count() > 0) {
      const href = await leadLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT_DIR, '15-lead-detail.png'), fullPage: true });
        console.log('OK lead detail');
      }
    }
  } catch (e) { console.log('FAIL lead detail: ' + (e as Error).message); }

  try {
    await page.goto(`${BASE}/admin/clientes`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    const customerLink = await page.locator('a[href*="/admin/clientes/"]').first();
    if (await customerLink.count() > 0) {
      const href = await customerLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT_DIR, '16-customer-hub.png'), fullPage: true });
        console.log('OK customer hub');
      }
    }
  } catch (e) { console.log('FAIL customer hub: ' + (e as Error).message); }

  await admin.close();
  await browser.close();
  console.log(`\nCaptures a: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
