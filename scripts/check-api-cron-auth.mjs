#!/usr/bin/env node
/**
 * qa:api-cron-auth
 * Tota ruta /api/cron/* ha de verificar el Bearer CRON_SECRET. A diferència de
 * /api/admin/*, els crons NO estan darrere del middleware Edge — no hi ha
 * defensa en profunditat: si la verificació falla, el cron és públic.
 *
 * Endurit (#698): abans només `content.includes('CRON_SECRET')`. Això deixava
 * passar el cas real més probable — definir `isAuthorized()` (que llegeix
 * CRON_SECRET) però oblidar-se de cridar-lo al handler. Ara s'exigeix que CADA
 * handler HTTP, o bé referenciï CRON_SECRET directament, o bé cridi un helper
 * (o consti de secret) del fitxer que sí que el verifica. Els comentaris es
 * neutralitzen perquè un CRON_SECRET comentat no compti.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const CRON_API_DIR = path.join(repoRoot, 'app', 'api', 'cron');

const SKIP_SEGMENTS = new Set(['node_modules', '.next', '__tests__', 'dist', 'build', '.git']);
const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

function* walkRoutes(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkRoutes(full);
    } else if (entry.isFile() && entry.name === 'route.ts') {
      yield full;
    }
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return noBlock.replace(/(^|[^:])(\/\/[^\n]*)/g, (full, pre, comment) =>
    pre + ' '.repeat(comment.length),
  );
}

function findBlockEnd(src, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return src.length;
}

// Mirror del helper de check-api-admin-auth.mjs (#701). Salta la llista
// d'arguments balancejada `(...)` abans de buscar la `{` del cos del bloc.
// Sense això, `function name(req, { params })` confonia la `{` de la
// destructuració amb el cos del helper i deixava `authNames` incomplet o
// el handler-body retallat. `limit` és el final virtual del bloc.
function findBlockOpeningBrace(src, start, limit) {
  let i = start;
  while (i < limit && src[i] !== '(') i++;
  if (i >= limit) return -1;
  let depth = 1;
  i++;
  while (i < limit && depth > 0) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    i++;
  }
  if (depth !== 0) return -1;
  while (i < limit && src[i] !== '{') i++;
  if (i >= limit) return -1;
  return i;
}

const SECRET_RE = /\bCRON_SECRET\b/;
const HANDLER_RE = new RegExp(
  `export\\s+(?:async\\s+)?function\\s+(${HTTP_METHODS.join('|')})\\b` +
    `|export\\s+const\\s+(${HTTP_METHODS.join('|')})\\s*=`,
  'g',
);
// function NAME( | const NAME = ( | const NAME = async ( | const NAME = function
const DECL_RE = /(?:function\s+([A-Za-z0-9_$]+)\s*\(|const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\(|function))/g;
const SECRET_CONST_RE = /const\s+([A-Za-z0-9_$]+)\s*=\s*process\.env\.CRON_SECRET\b/g;

const routes = [...walkRoutes(CRON_API_DIR)];
const violations = [];

for (const filePath of routes) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const src = stripComments(raw);
  const rel = toPosix(path.relative(repoRoot, filePath));

  if (!SECRET_RE.test(src)) {
    violations.push(`${rel} → cap verificació CRON_SECRET`);
    continue;
  }

  // Names that, when referenced inside a handler, imply the secret is checked:
  // (1) any function whose body references CRON_SECRET, (2) any module const
  // bound to process.env.CRON_SECRET.
  const authNames = new Set();

  let dm;
  DECL_RE.lastIndex = 0;
  while ((dm = DECL_RE.exec(src)) !== null) {
    const name = dm[1] || dm[2];
    if (!name) continue;
    const braceIdx = findBlockOpeningBrace(src, dm.index, src.length);
    if (braceIdx === -1) continue;
    const end = findBlockEnd(src, braceIdx);
    if (SECRET_RE.test(src.slice(braceIdx, end + 1))) authNames.add(name);
  }

  let sm;
  SECRET_CONST_RE.lastIndex = 0;
  while ((sm = SECRET_CONST_RE.exec(src)) !== null) {
    authNames.add(sm[1]);
  }

  const matches = [...src.matchAll(HANDLER_RE)];
  if (matches.length === 0) {
    // No recognizable handler but file has CRON_SECRET (helper-only / unusual):
    // not flaggable per-handler; file-level presence already satisfied.
    continue;
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const method = m[1] || m[2];
    const start = m.index ?? 0;
    const nextStart =
      i + 1 < matches.length ? (matches[i + 1].index ?? src.length) : src.length;

    const braceIdx = findBlockOpeningBrace(src, start, nextStart);
    if (braceIdx === -1) {
      // Delegated/re-exported handler with no own block: file-level check
      // already passed (SECRET_RE), accept.
      continue;
    }

    const end = findBlockEnd(src, braceIdx);
    const body =
      end > nextStart ? src.slice(braceIdx, nextStart) : src.slice(braceIdx, end + 1);

    let ok = SECRET_RE.test(body);
    if (!ok) {
      for (const name of authNames) {
        if (new RegExp(`\\b${name}\\s*\\(`).test(body) || new RegExp(`\\b${name}\\b`).test(body)) {
          ok = true;
          break;
        }
      }
    }
    if (!ok) {
      violations.push(`${rel} → ${method}() no verifica CRON_SECRET`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[api-cron-auth] FAIL: ${violations.length} handler(s)/ruta(es) /api/cron/* sense verificació CRON_SECRET:`,
  );
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(
    'Tota ruta /api/cron/* ha de verificar el Bearer CRON_SECRET a cada handler. Sense això el cron és accessible públicament.',
  );
  process.exit(1);
}

console.log(
  `[api-cron-auth] OK: totes les rutes /api/cron/* (${routes.length} fitxers) verifiquen CRON_SECRET a cada handler.`,
);
