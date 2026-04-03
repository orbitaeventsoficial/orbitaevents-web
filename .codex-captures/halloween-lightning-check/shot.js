const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  await page.goto('http://localhost:3000/tematica-halloween', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'D:/orbitaevents/.codex-captures/halloween-lightning-check/hero.png', fullPage: false });
  await browser.close();
})();
