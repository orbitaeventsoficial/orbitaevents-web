/**
 * Captura de la safata #821 (mirall IMAP/SMTP) per validació visual.
 * Run: npx tsx scripts/capture-safata-821.ts
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'orbita';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Orbitaevents040120+++';
const OUT_DIR = path.join(process.cwd(), 'screenshots', 'safata-821');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const admin = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const page = await admin.newPage();

  try {
    await page.goto(`${BASE}/admin/inbox`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(OUT_DIR, '01-safata-overview.png'), fullPage: false });
    console.log('OK 01-safata-overview');

    // Sidebar amb carpetes carregades (esperem que carreguin)
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, '02-safata-folders-loaded.png'), fullPage: false });
    console.log('OK 02-safata-folders-loaded');

    // Composer nou modal
    const composeBtn = await page.locator('text=Nou correu').first();
    if (await composeBtn.count() > 0) {
      await composeBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, '03-composer-new.png'), fullPage: false });
      console.log('OK 03-composer-new');
      // Tancar
      const closeBtn = await page.locator('.sf__modal .sf__detail-close').first();
      if (await closeBtn.count() > 0) await closeBtn.click();
    }

    // Click sobre Entrades (default ja és aquest)
    const lead = await page.locator('.sf__lead').first();
    if (await lead.count() > 0) {
      await lead.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT_DIR, '04-lead-detail.png'), fullPage: false });
      console.log('OK 04-lead-detail');
    }

    // Click a Enviats (IMAP)
    const sentNav = await page.locator('.sf__navitem-label:has-text("Enviats")').first();
    if (await sentNav.count() > 0) {
      await sentNav.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(OUT_DIR, '05-sent-folder.png'), fullPage: false });
      console.log('OK 05-sent-folder');

      // Seleccionar primer email per veure detall + pill X-Orbita + cos
      const firstSent = await page.locator('.sf__lead-body').first();
      if (await firstSent.count() > 0) {
        await firstSent.click();
        // Esperar IMAP fetch del cos (pot trigar 1-3s segons servidor)
        await page.waitForTimeout(6000);
        await page.screenshot({ path: path.join(OUT_DIR, '06-sent-detail.png'), fullPage: false });
        console.log('OK 06-sent-detail');
      }
    }

    // Click a Entrada IMAP
    const inboxNav = await page.locator('.sf__navitem-label:has-text("Entrada")').nth(1); // 1 = bústia (0 = web)
    if (await inboxNav.count() > 0) {
      await inboxNav.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(OUT_DIR, '07-inbox-imap.png'), fullPage: false });
      console.log('OK 07-inbox-imap');

      // Seleccionar checkbox d'un email per veure barra accions
      const checkbox = await page.locator('.sf__lead-checkbox').first();
      if (await checkbox.count() > 0) {
        await checkbox.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT_DIR, '08-bulk-actions.png'), fullPage: false });
        console.log('OK 08-bulk-actions');
      }
    }

  } catch (e) {
    console.error('FAIL:', (e as Error).message);
  }

  await browser.close();
  console.log(`Captures a ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
