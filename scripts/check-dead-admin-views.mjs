#!/usr/bin/env node
/**
 * qa:no-dead-admin-views
 * ----------------------------------------------------------------------------
 * REACHABILITY REAL des dels punts d'entrada de Next (no només "arrels orfes").
 *
 * Construeix el graf d'imports de tot el codi (app/ + components/ + lib/),
 * fa BFS des dels fitxers d'entrada de Next (page/layout/route/loading/error/
 * not-found/template/default/global-error + middleware), i marca com a MORT
 * qualsevol component `.tsx` sota `app/admin/**` que NO s'hi pugui arribar.
 *
 * Això tanca el forat del primer disseny (#1026), que només caçava l'ARREL
 * d'una illa: ara una illa transitiva (illa A importada només per illa B, totes
 * dues mortes) també cau, perquè cap de les dues és accessible des d'una ruta.
 *
 * NO substitueix la fitxa forense (docs/admin-fitxes-pantalles.md): el guard
 * cobreix REACHABILITY; la fitxa cobreix el que el guard no pot veure (CSS↔DOM,
 * duplicacions semàntiques, hardcoded, cablejat de dades punta a punta).
 *
 * Allowlist: scripts/dead-admin-views-allowlist.json (justificació obligatòria).
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const SCAN_DIRS = ['app', 'components', 'lib'].map((d) => path.join(repoRoot, d));
const EXTS = ['.tsx', '.ts', '.jsx', '.js'];

const NEXT_ENTRY = new Set([
  'page', 'layout', 'loading', 'error', 'not-found', 'template', 'default',
  'global-error', 'route', 'sitemap', 'robots', 'manifest', 'head',
  'opengraph-image', 'twitter-image', 'icon', 'apple-icon',
]);

const ALLOWLIST_PATH = path.join(repoRoot, 'scripts', 'dead-admin-views-allowlist.json');
function loadAllowlist() {
  try {
    const raw = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
    return new Set((raw.allow || []).map((e) => e.path));
  } catch {
    return new Set();
  }
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (EXTS.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

function baseName(file) {
  return path.basename(file).replace(/\.(tsx|ts|jsx|js)$/, '');
}

// Resol un especificador d'import a un fitxer real del repo, o null si és
// un paquet o no es pot resoldre.
function resolveSpec(spec, fromFile) {
  let bases = [];
  if (spec.startsWith('.')) {
    bases = [path.resolve(path.dirname(fromFile), spec)];
  } else if (spec.startsWith('@/')) {
    const rest = spec.slice(2);
    // Àlies de tsconfig: @/* → ./* o app/*; @/lib → lib o app/lib; @/components → components o app/components.
    bases = [
      path.join(repoRoot, rest),
      path.join(repoRoot, 'app', rest),
    ];
  } else {
    return null; // paquet de node_modules
  }
  for (const base of bases) {
    for (const ext of ['', ...EXTS]) {
      const f = base + ext;
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
    }
    for (const idx of EXTS.map((e) => path.join(base, 'index' + e))) {
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
    }
  }
  return null;
}

// Imports estàtics amb la clàusula sencera (per saber QUÈ s'importa i si s'usa).
const STATIC_IMPORT_RE = /import\s+(type\s+)?([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g;
// Re-exports + side-effect imports + dynamic/require: sempre compten com a aresta
// (no tenen binding local que es pugui "no usar", o no es pot determinar amb confiança).
const ALWAYS_EDGE_RE = /(?:export\s+[^'";]*?from|import\s*\(|require\s*\(|^\s*import\s+['"])\s*\(?\s*['"]([^'"]+)['"]/gm;
const BARE_IMPORT_RE = /import\s+['"]([^'"]+)['"]/g;

// Extreu els identificadors locals d'una clàusula d'import: default, namespace i named.
function importedBindings(clause) {
  const names = [];
  // default: `import Foo` o `import Foo, { ... }`
  const def = clause.match(/^\s*([A-Za-z_$][\w$]*)\s*(,|$)/);
  if (def) names.push(def[1]);
  // namespace: `* as Foo`
  const ns = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (ns) names.push(ns[1]);
  // named: `{ a, b as c }`
  const braces = clause.match(/\{([^}]*)\}/);
  if (braces) {
    for (const part of braces[1].split(',')) {
      const name = part.split(/\s+as\s+/).pop().trim();
      if (name) names.push(name);
    }
  }
  return names;
}

// Cos del fitxer sense les línies d'import/re-export (perquè el path o el binding
// de la pròpia clàusula no comptin com a "ús").
function stripImports(src) {
  return src
    .replace(/import\s+(?:type\s+)?[^'";]+?\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+[^'";]*?\s+from\s+['"][^'"]+['"];?/g, '');
}

function extractDeps(file) {
  const src = fs.readFileSync(file, 'utf8');
  const body = stripImports(src);
  const deps = new Set();

  // 1. Arestes que sempre compten (re-export, dynamic import, require, side-effect).
  for (const re of [ALWAYS_EDGE_RE, BARE_IMPORT_RE]) {
    let m;
    while ((m = re.exec(src)) !== null) {
      const r = resolveSpec(m[1], file);
      if (r) deps.add(r);
    }
  }

  // 2. Imports estàtics amb binding: només compten si el binding s'usa al COS.
  let m;
  while ((m = STATIC_IMPORT_RE.exec(src)) !== null) {
    const clause = m[2];
    const spec = m[3];
    const resolved = resolveSpec(spec, file);
    if (!resolved) continue;
    const names = importedBindings(clause);
    if (names.length === 0) { deps.add(resolved); continue; } // no es pot determinar → conservador
    const used = names.some((name) => {
      const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return re.test(body);
    });
    if (used) deps.add(resolved);
    // si cap binding s'usa al cos → import mort → no és aresta (el destí queda orfe i es caça)
  }

  return [...deps];
}

// 1. Graf d'imports de tot el codi.
const allFiles = SCAN_DIRS.flatMap((d) => walk(d));
const middleware = path.join(repoRoot, 'middleware.ts');
if (fs.existsSync(middleware)) allFiles.push(middleware);
const graph = new Map();
for (const f of allFiles) graph.set(f, extractDeps(f));

// 2. Roots = fitxers d'entrada de Next.
const roots = allFiles.filter((f) => NEXT_ENTRY.has(baseName(f)) || f === middleware);

// 3. BFS → conjunt accessible.
const reachable = new Set();
const queue = [...roots];
while (queue.length) {
  const f = queue.pop();
  if (reachable.has(f)) continue;
  reachable.add(f);
  for (const dep of graph.get(f) || []) if (!reachable.has(dep)) queue.push(dep);
}

// 4. Candidats: components .tsx sota app/admin, app/components o components/
//    (admin + front-office), no especials, no accessibles des de cap ruta.
const CANDIDATE_DIRS = [
  ADMIN_DIR,
  path.join(repoRoot, 'app', 'components'),
  path.join(repoRoot, 'components'),
];
const allowlist = loadAllowlist();
// Tipus de definició (.d.ts) i config no són candidats: no es "renderitzen" ni
// s'importen necessàriament per ruta. Sí ho són components .tsx i mòduls de
// dades .ts (constants/helpers/types) que, si no els importa ningú accessible,
// són illes mortes — el cas de nav-items.ts/inbox-types.ts (#1104).
const dead = allFiles.filter((f) => {
  if (!CANDIDATE_DIRS.some((d) => f.startsWith(d + path.sep))) return false;
  if (!/\.(tsx|ts)$/.test(f) || f.endsWith('.d.ts')) return false;
  if (NEXT_ENTRY.has(baseName(f))) return false;
  if (reachable.has(f)) return false;
  const rel = path.relative(repoRoot, f).replace(/\\/g, '/');
  return !allowlist.has(rel);
});

if (dead.length === 0) {
  process.stdout.write('[no-dead-admin-views] OK — tots els components admin i de front-office són accessibles des d\'una ruta\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-dead-admin-views] FAIL — ${dead.length} component(s) (admin/front) no accessible(s) des de cap ruta (codi mort):\n`,
  );
  for (const f of dead.sort()) process.stderr.write(`  ${path.relative(repoRoot, f).replace(/\\/g, '/')}\n`);
  process.stderr.write(
    '\nUn component que no s\'arriba des de cap page/layout/route de Next és codi mort (illa),\n' +
    'inclosa una illa transitiva (importada només per altre codi mort). Vegeu incidència #1020.\n' +
    'Opcions: (1) cablejar-lo a una ruta viva, (2) esborrar-lo, o (3) si és prototip protegit,\n' +
    'afegir-lo a scripts/dead-admin-views-allowlist.json amb justificació.\n' +
    'El guard cobreix reachability; la fitxa forense (docs/admin-fitxes-pantalles.md) cobreix la resta.\n',
  );
  process.exit(1);
}
