const fs = require('fs');
const { chromium } = require('playwright');

const url = process.env.DBG_DOSSIER_URL || 'http://localhost:3000/admin/dossiers?leadId=cmpwudznj00g3vigky4altclu&nom=Cristina+Rey&email=cris17_89%40hotmail.com&telefon=%2B34678509778&eventDesc=2026-07-11+%C2%B7+18%3A00-20%3A00+%C2%B7+Arenys+de+Munt+%C2%B7+150+pax';
const name = process.env.DBG_DOSSIER_NAME || 'dossier-cristina-generator';

(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  fs.mkdirSync('.codex-captures', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
    extraHTTPHeaders: { Authorization: `Basic ${token}` },
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`pageerror: ${err.message}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const screenshot = `.codex-captures/${name}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });
  const info = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    bodyText: document.body.innerText.slice(0, 6000),
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  fs.writeFileSync(`.codex-captures/${name}.json`, JSON.stringify({ info, logs }, null, 2));
  console.log(JSON.stringify({ screenshot, info, logs }, null, 2));
  await browser.close();
})();
