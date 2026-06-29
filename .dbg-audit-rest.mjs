import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.audit-shots');
fs.mkdirSync(OUT, { recursive: true });

let user = 'admin', pass = '';
for (const f of ['.env.local', '.env']) {
  try { for (const line of fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')) {
    const m = line.match(/^\s*(ADMIN_USER|ADMIN_PASS\w*)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].replace(/^["']|["']$/g, ''); if (m[1] === 'ADMIN_USER') user = v; else if (!pass) pass = v; }
  } } catch {}
}

function walk(d, base, out = []) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('[') || e.name.startsWith('_') || e.name.startsWith('(')) continue;
    const full = path.join(d, e.name), route = base + '/' + e.name;
    if (fs.existsSync(path.join(full, 'page.tsx'))) out.push(route);
    walk(full, route, out);
  }
  return out;
}

const all = walk(path.join(ROOT, 'app/admin'), '/admin').sort();
const have = new Set(fs.readdirSync(OUT).filter(f => f.endsWith('.png')).map(f => '/' + f.replace('.png', '').replace(/__/g, '/')));
const todo = all.filter(r => !have.has(r));

const BASE = 'http://localhost:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ httpCredentials: { username: user, password: pass }, viewport: { width: 1440, height: 1300 } });
const page = await ctx.newPage();
const report = [];
for (const r of todo) {
  const name = r.replace(/^\//, '').replace(/\//g, '__');
  let ok = false;
  for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
    try {
      const resp = await page.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(3500);
      await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
      report.push(`${resp?.status() ?? '?'} ${r}`);
      ok = true;
    } catch (e) {
      if (attempt === 2) report.push(`FAIL ${r}: ${e.message.split('\n')[0].slice(0, 45)}`);
      else await page.waitForTimeout(2000);
    }
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, '_report-rest.txt'), report.join('\n'));
console.log(report.join('\n'));
console.log(`\n${todo.length} pendents processades`);
