// @ts-check
// Verifica que tots els adminHref i href de /admin/* als constants del manual
// apunten a rutes existents a app/. Captura links trencats després d'un rename.
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_MANUAL_PATH = path.join(process.cwd(), 'lib', 'constants', 'adminManual.ts');
const APP_DIR = path.join(process.cwd(), 'app');

/** @type {(msg: string) => void} */
function fail(msg) {
  console.error(`[admin-manual-hrefs] FAIL: ${msg}`);
  process.exitCode = 1;
}

/**
 * Extreu tots els valors de href i adminHref que apunten a /admin/* del fitxer font.
 * @param {string} source
 * @returns {Set<string>}
 */
export function extractAdminHrefs(source) {
  const hrefs = new Set();
  const re = /(?:adminHref|href):\s*['"]\/admin\/([^'"?#]+)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    hrefs.add('/admin/' + m[1]);
  }
  return hrefs;
}

/**
 * Comprova si una ruta del App Router existeix com a page.tsx/page.ts.
 * Rutes amb segments dinàmics ([param]) es salten perquè no es poden verificar estàticament.
 * @param {string} href e.g. '/admin/leads'
 * @param {string} appDir
 * @returns {boolean}
 */
export function routeFileExists(href, appDir) {
  if (href.includes('[')) return true; // dinàmic — no verificable estàticament
  const rel = href.replace(/^\//, '');
  return (
    fs.existsSync(path.join(appDir, rel, 'page.tsx')) ||
    fs.existsSync(path.join(appDir, rel, 'page.ts'))
  );
}

if (!fs.existsSync(ADMIN_MANUAL_PATH)) {
  fail(`fitxer no trobat: ${ADMIN_MANUAL_PATH}`);
  process.exit(1);
}

const source = fs.readFileSync(ADMIN_MANUAL_PATH, 'utf8');
const hrefs = extractAdminHrefs(source);

let brokenCount = 0;
for (const href of [...hrefs].sort()) {
  if (!routeFileExists(href, APP_DIR)) {
    fail(`href trencat: '${href}' — no existeix app${href}/page.tsx`);
    brokenCount++;
  }
}

if (brokenCount === 0) {
  console.log(`[admin-manual-hrefs] OK: ${hrefs.size} hrefs d'admin verificats.`);
}
