import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.audit-shots');
fs.mkdirSync(OUT, { recursive: true });

let user = 'admin', pass = '';
for (const f of ['.env.local', '.env']) {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')) {
      const m = line.match(/^\s*(ADMIN_USER|ADMIN_PASS\w*)\s*=\s*(.*)\s*$/);
      if (m) { const v = m[2].replace(/^["']|["']$/g, ''); if (m[1] === 'ADMIN_USER') user = v; else if (!pass) pass = v; }
    }
  } catch {}
}

const routes = process.argv.slice(2).map((r) => (r.startsWith('/') ? r : '/' + r));
const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ httpCredentials: { username: user, password: pass }, viewport: { width: 1440, height: 1300 } });
const page = await ctx.newPage();
for (const r of routes) {
  const name = r.replace(/^\//, '').replace(/\//g, '__');
  try {
    const resp = await page.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    console.log(`${resp?.status() ?? '?'} ${r}`);
  } catch (e) {
    console.log(`FAIL ${r}: ${e.message.split('\n')[0].slice(0, 60)}`);
  }
}
await browser.close();
