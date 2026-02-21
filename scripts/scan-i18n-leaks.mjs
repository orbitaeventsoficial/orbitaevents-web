/**
 * Scan i18n key leaks on rendered pages.
 *
 * Usage:
 *   SCAN_BASE_URL=https://orbitaevents.com node scripts/scan-i18n-leaks.mjs
 *   node scripts/scan-i18n-leaks.mjs --baseUrl=http://localhost:3000
 */

const DEFAULT_BASE_URL = process.env.SCAN_BASE_URL || 'http://localhost:3000';
const argv = process.argv.slice(2);
const argBase = argv.find((a) => a.startsWith('--baseUrl='))?.split('=')[1];
const baseUrl = (argBase || DEFAULT_BASE_URL).replace(/\/+$/, '');

const baseRoutes = [
  '/',
  '/servicios',
  '/servicios/fiestas',
  '/servicios/discomovil',
  '/servicios/bodas',
  '/servicios/empresas',
  '/configurador',
  '/tematica-halloween',
  '/tematica-mon-magic',
  '/opiniones',
];
const localePrefixes = ['', '/ca', '/es', '/en'];
const routes = [...new Set(localePrefixes.flatMap((prefix) => baseRoutes.map((r) => `${prefix}${r === '/' ? '' : r}` || '/')))];

const checks = [
  { name: 'i18n-key', regex: /\b(configurator|pages|services)\.[a-z0-9_.-]+\b/gi },
  { name: 'calendar-key', regex: /\bcalendar\.(status|legend)\.[a-z0-9_.-]+\b/gi },
  { name: 'runtime-error', regex: /(Unhandled Runtime Error|NotFoundError:\s*Failed to execute 'removeChild')/gi },
];

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

async function scanRoute(route) {
  const url = `${baseUrl}${route}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    return { route, ok: false, status: res.status, leaks: [] };
  }
  const html = await res.text();
  const cleaned = stripScriptsAndStyles(html);
  const issues = [];
  for (const check of checks) {
    const hits = cleaned.match(check.regex) || [];
    const uniqueHits = [...new Set(hits.map((v) => normalizeWhitespace(v)).filter(Boolean))];
    if (uniqueHits.length > 0) {
      issues.push({ type: check.name, hits: uniqueHits });
    }
  }
  return { route, ok: true, status: res.status, issues };
}

async function scanPacksApi(locale = 'ca') {
  const url = `${baseUrl}/api/public/packs?locale=${encodeURIComponent(locale)}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    return { ok: false, status: res.status, leaks: [] };
  }
  const data = await res.json();
  const packs = Array.isArray(data?.packs) ? data.packs : [];
  const leakRegex = /\b(configurator|pages|services)\.[a-z0-9_.-]+\b/i;
  const leaks = [];
  for (const pack of packs) {
    const fields = [pack?.name, pack?.tagline, ...(Array.isArray(pack?.features) ? pack.features : [])];
    for (const field of fields) {
      const text = String(field || '');
      if (leakRegex.test(text)) {
        leaks.push({ packId: pack?.id, slug: pack?.slug, value: text });
      }
    }
  }
  return { ok: true, status: res.status, leaks };
}

async function main() {
  console.log(`[i18n-scan] Base URL: ${baseUrl}`);
  const results = [];
  for (const route of routes) {
    try {
      const result = await scanRoute(route);
      results.push(result);
      if (!result.ok) {
        console.log(`[i18n-scan] ${route} -> HTTP ${result.status}`);
      } else if (result.issues.length > 0) {
        const total = result.issues.reduce((acc, i) => acc + i.hits.length, 0);
        console.log(`[i18n-scan] ${route} -> ${total} issues`);
      } else {
        console.log(`[i18n-scan] ${route} -> OK`);
      }
    } catch (error) {
      results.push({ route, ok: false, status: 0, leaks: [] });
      console.log(`[i18n-scan] ${route} -> ERROR ${String(error)}`);
    }
  }

  const failedHttp = results.filter((r) => !r.ok);
  const leaked = results.filter((r) => r.ok && r.issues.length > 0);
  const apiChecks = await Promise.all(['ca', 'es', 'en'].map((locale) => scanPacksApi(locale)));
  const apiFailures = apiChecks.filter((check) => !check.ok);
  const apiLeaks = apiChecks.filter((check) => check.ok && check.leaks.length > 0);

  if (failedHttp.length || leaked.length || apiFailures.length || apiLeaks.length) {
    console.error('\n[i18n-scan] FAIL');
    if (failedHttp.length) {
      console.error('Pages unavailable:');
      failedHttp.forEach((r) => console.error(`- ${r.route} (status ${r.status})`));
    }
    if (leaked.length) {
      console.error('Page issues:');
      leaked.forEach((r) => {
        console.error(`- ${r.route}`);
        r.issues.forEach((issue) => {
          issue.hits.slice(0, 10).forEach((hit) => console.error(`  · [${issue.type}] ${hit}`));
        });
      });
    }
    if (apiFailures.length) {
      console.error('Packs API unavailable in some locale checks.');
    }
    if (apiLeaks.length) {
      console.error('Packs API leaked keys:');
      apiLeaks.forEach((result) => {
        result.leaks.slice(0, 20).forEach((leak) => {
          console.error(`  · pack=${leak.packId} slug=${leak.slug} value="${leak.value}"`);
        });
      });
    }
    process.exit(1);
  }

  console.log('\n[i18n-scan] PASS: no leaks detected.');
}

main().catch((error) => {
  console.error('[i18n-scan] Fatal error:', error);
  process.exit(1);
});
