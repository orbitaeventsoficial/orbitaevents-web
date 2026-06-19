const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const docH = () => page.evaluate(() => document.documentElement.scrollHeight);
  const win = await page.evaluate(() => window.innerHeight);
  const base = await docH();
  // Obre el primer desplegable de proveïdor
  const chip = await page.$('.fxd__zenith-main .nb__cfg-grp--provider > summary');
  const chipName = chip ? await chip.innerText() : null;
  if (chip) await chip.click();
  await page.waitForTimeout(600);
  const opened = await docH();
  await page.screenshot({ path: '.codex-captures/lead-prov-open.png', fullPage: true });
  // Tanca
  if (chip) await chip.click();
  await page.waitForTimeout(600);
  const closed = await docH();
  console.log(`win=${win}`);
  console.log(`base (tancat):  docH=${base}  → ${base <= win ? 'sense scroll' : 'SCROLL'}`);
  console.log(`obert ${chipName}: docH=${opened}  → ${opened > base ? 'EMPENY avall ✓' : 'no creix'}`);
  console.log(`re-tancat:      docH=${closed}  → ${closed === base ? 'torna a lloc ✓' : 'NO torna (' + closed + ')'}`);
  await browser.close();
})();
