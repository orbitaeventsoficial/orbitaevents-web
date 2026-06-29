import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.audit-shots');
fs.mkdirSync(OUT, { recursive: true });

// auth
let user = 'admin', pass = '';
for (const f of ['.env.local', '.env']) {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')) {
      const m = line.match(/^\s*(ADMIN_USER|ADMIN_PASS\w*)\s*=\s*(.*)\s*$/);
      if (m) { const v = m[2].replace(/^["']|["']$/g, ''); if (m[1] === 'ADMIN_USER') user = v; else if (!pass) pass = v; }
    }
  } catch {}
}

// descobreix rutes admin estàtiques (page.tsx, sense [param]/_/())
function discover(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('[') || e.name.startsWith('_') || e.name.startsWith('(')) continue;
    const full = path.join(dir, e.name);
    const route = `${base}/${e.name}`;
    if (fs.existsSync(path.join(full, 'page.tsx'))) out.push(route);
    discover(full, route, out);
  }
  return out;
}

const IDS = {
  lead: 'cmpyhlaox0001puw1jpc8cvad',
  booking: 'cmq49d2vz0002raqv76qdlwka',
  customer: 'cmpyhlb4p0003puw1xsmyhe7g',
  pack: 'cmq9h2e4m000v2afjlu50q3ci',
  inventory: 'cmmkqgcdy000mlubze9q6kul7',
  proposal: 'cmq0y8ohw000913pq08sughjf',
  collaborator: 'tino-lloguer',
  blog: 'cmmxx2cxy000xv198665782gm',
};

const staticRoutes = discover(path.join(ROOT, 'app/admin'), '/admin').sort();
const paramRoutes = [
  `/admin/leads/${IDS.lead}`,
  `/admin/bookings/${IDS.booking}`,
  `/admin/clientes/${IDS.customer}`,
  `/admin/packs/${IDS.pack}`,
  `/admin/inventory/${IDS.inventory}`,
  `/admin/presupuestos/${IDS.proposal}`,
  `/admin/collaborators/${IDS.collaborator}`,
  `/admin/blog/${IDS.blog}`,
];
const all = [...staticRoutes, ...paramRoutes];

const BASE = process.env.AUDIT_BASE || 'http://localhost:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  httpCredentials: { username: user, password: pass },
  viewport: { width: 1440, height: 1200 },
});
const page = await ctx.newPage();
const report = [];
for (const r of all) {
  const name = r.replace(/^\//, '').replace(/\//g, '__');
  try {
    const resp = await page.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2800); // deixa que els fetch client renderitzin
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    report.push(`${resp?.status() ?? '?'} ${r}`);
  } catch (e) {
    report.push(`FAIL ${r}: ${e.message.split('\n')[0].slice(0, 50)}`);
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, '_report.txt'), report.join('\n'));
console.log(report.join('\n'));
console.log(`\n${all.length} rutes · captures a .audit-shots/`);
