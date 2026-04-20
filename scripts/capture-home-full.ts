/**
 * Full-page captures of /ca at multiple viewports for layout analysis
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'screenshots', 'home-2026-04-09');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function capture(viewport: { width: number; height: number; name: string }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ca`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  // Dismiss cookie banner if present
  try {
    const accept = page.locator('button:has-text("Acceptar")').first();
    if (await accept.count() > 0) {
      await accept.click({ timeout: 2000 });
      await page.waitForTimeout(800);
    }
  } catch {}
  // Viewport (above-the-fold)
  await page.screenshot({ path: path.join(OUT_DIR, `${viewport.name}-viewport.png`), fullPage: false });
  // Full page
  await page.screenshot({ path: path.join(OUT_DIR, `${viewport.name}-full.png`), fullPage: true });
  // Hero only
  const hero = page.locator('[data-section-id="hero"]').first();
  if (await hero.count() > 0) {
    await hero.screenshot({ path: path.join(OUT_DIR, `${viewport.name}-hero.png`) });
  }
  console.log(`OK ${viewport.name}`);
  await ctx.close();
  await browser.close();
}

async function main() {
  await capture({ width: 1440, height: 900, name: 'desktop' });
  await capture({ width: 1024, height: 768, name: 'tablet' });
  console.log(`\nCaptures a: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
