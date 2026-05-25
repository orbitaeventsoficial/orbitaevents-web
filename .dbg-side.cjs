const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/studio-lab/leads', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(900);
  await p.locator('.fx__side').screenshot({ path: '.codex-captures/leads-side.png' });
  console.log('OK side');
  await b.close();
})();
