import { chromium, devices } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUT_DIR = path.join(__dirname, '..', 'screenshots-mobile');
const DEVICE = devices['iPhone 14 Pro Max'];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...DEVICE,
    locale: 'ca',
  });
  const page = await context.newPage();

  // Pre-set session flags to skip intro and cookies
  await page.goto(`${BASE_URL}/ca`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    localStorage.setItem('orbita-mobile-intro-seen', 'true');
    sessionStorage.setItem('orbita-intro-seen', 'true');
    localStorage.setItem('orbita_cookie_consent', JSON.stringify({
      necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString()
    }));
  });

  // Reload with flags set
  await page.goto(`${BASE_URL}/ca`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Wait for hero + content to render
  await page.waitForTimeout(6000);

  // 1. Hero viewport
  await page.screenshot({ path: path.join(OUT_DIR, '01-hero-mobile.png'), fullPage: false });

  // 2. Full page
  await page.screenshot({ path: path.join(OUT_DIR, '02-fullpage-mobile.png'), fullPage: true });

  // 3. Scroll through the page
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = DEVICE.viewport.height;
  const scrollSteps = Math.ceil(totalHeight / viewportHeight);

  console.log(`Total height: ${totalHeight}px, viewport: ${viewportHeight}px, steps: ${scrollSteps}`);

  for (let i = 0; i < Math.min(scrollSteps, 15); i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * viewportHeight);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUT_DIR, `scroll-${String(i).padStart(2, '0')}.png`),
      fullPage: false
    });
  }

  // 4. Also take screenshot WITH cookie banner (fresh session)
  const context2 = await browser.newContext({ ...DEVICE, locale: 'ca' });
  const page2 = await context2.newPage();
  await page2.goto(`${BASE_URL}/ca`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page2.evaluate(() => {
    localStorage.setItem('orbita-mobile-intro-seen', 'true');
    sessionStorage.setItem('orbita-intro-seen', 'true');
  });
  await page2.goto(`${BASE_URL}/ca`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page2.waitForTimeout(7000); // Wait for cookie banner to appear (2s delay + render)
  await page2.screenshot({ path: path.join(OUT_DIR, 'cookie-banner-mobile.png'), fullPage: false });

  await browser.close();
  console.log(`\n✅ Screenshots saved to ${OUT_DIR}`);
}

main().catch(console.error);
