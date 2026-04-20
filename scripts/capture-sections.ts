/**
 * Captures individual sections by scrolling through the page
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'screenshots', 'sections-2026-04-10');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ca`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Dismiss cookie
  try {
    const accept = page.locator('button:has-text("Acceptar")').first();
    if (await accept.count() > 0) { await accept.click({ timeout: 2000 }); await page.waitForTimeout(500); }
  } catch {}

  // Scroll through the page, capturing at each viewport
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = 900;
  let scrollY = 0;
  let i = 0;
  while (scrollY < totalHeight) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, `scroll-${String(i).padStart(2, '0')}.png`), fullPage: false });
    console.log(`OK scroll-${i} (y=${scrollY})`);
    scrollY += viewportHeight - 100; // overlap 100px
    i++;
    if (i > 15) break;
  }

  await ctx.close();
  await browser.close();
  console.log(`\nCaptures a: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
