const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER || 'orbita'}:${process.env.ADMIN_PASS || 'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const sizes = [
    { name: '1080p', width: 1920, height: 1080 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: 'laptop-768', width: 1366, height: 768 },
  ];
  for (const s of sizes) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: 1, extraHTTPHeaders: { Authorization: `Basic ${token}` } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const m = await page.evaluate(() => ({ docH: document.documentElement.scrollHeight, winH: window.innerHeight }));
    const fits = m.docH <= m.winH;
    await page.screenshot({ path: `.codex-captures/lead-fit-${s.name}.png` });
    console.log(`${s.name} (${s.width}x${s.height}): docH=${m.docH} winH=${m.winH} → ${fits ? 'CAP sense scroll' : 'NO cap, sobra ' + (m.docH - m.winH) + 'px'}`);
    await ctx.close();
  }
  await browser.close();
})();
