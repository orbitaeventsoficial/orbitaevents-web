const { chromium } = require('playwright');
(async () => {
  const token = Buffer.from(`${process.env.ADMIN_USER||'orbita'}:${process.env.ADMIN_PASS||'Orbitaevents040120+++'}`).toString('base64');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ extraHTTPHeaders: { Authorization: `Basic ${token}` } });
  const page = await ctx.newPage();
  const client = await ctx.newCDPSession(page);
  await client.send('DOM.enable'); await client.send('CSS.enable');
  await page.goto('http://localhost:3000/admin/bookings/cmn3m5vfd002il4j1u2cbx00g', { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForTimeout(6000);
  const { root } = await client.send('DOM.getDocument', { depth: -1 });
  const q = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.bd__root' });
  const m = await client.send('CSS.getMatchedStylesForNode', { nodeId: q.nodeId });
  const hits = [];
  for (const r of (m.matchedCSSRules||[])) {
    const bg = (r.rule.style.cssProperties||[]).find(p => /^background(-color)?$/.test(p.name));
    if (bg) hits.push(`${r.rule.selectorList.text}  {${bg.name}: ${bg.value}}`);
  }
  // inline
  if (m.inlineStyle) { const bg=(m.inlineStyle.cssProperties||[]).find(p=>/^background/.test(p.name)); if(bg) hits.push(`INLINE {${bg.name}: ${bg.value}}`); }
  console.log(hits.join('\n') || 'cap regla background');
  await browser.close();
})();
