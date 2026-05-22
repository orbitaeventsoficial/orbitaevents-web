#!/usr/bin/env node
/**
 * qa:api-admin-auth
 * Tota ruta /api/admin/* ha de verificar autenticació amb requireAuth a CADA
 * handler HTTP exportat (CLAUDE.md §Seguretat — "No hi ha excepcions").
 *
 * Endurit (#697): abans només es comprovava `content.includes('requireAuth')`,
 * que deixava passar un fitxer amb GET protegit però DELETE sense protecció
 * (fals negatiu real). Ara s'extreu el cos de cada handler per brace-matching
 * i s'exigeix una crida `requireAuth(` dins de cada un. Els comentaris es
 * neutralitzen perquè un `// requireAuth(req)` comentat no compti.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_API_DIR = path.join(repoRoot, 'app', 'api', 'admin');

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

// Blank comments (preserving newlines + length) so a commented-out
// `// requireAuth(req)` cannot satisfy the check and brace matching is sound.
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

// Skip the parameter list `(...)` after a handler match. Returns the index
// of the body's opening `{`, or -1 if none is found before `limit`. Needed
// because `function GET(req: NextRequest, { params }: Params)` has braces
// inside the param list that must not be confused with the body brace.
function findHandlerBodyBrace(src, start, limit) {
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

const HANDLER_RE = new RegExp(
  `export\\s+(?:async\\s+)?function\\s+(${HTTP_METHODS.join('|')})\\b` +
    `|export\\s+const\\s+(${HTTP_METHODS.join('|')})\\s*=`,
  'g',
);

const violations = [];
let fileCount = 0;

for (const filePath of walkRoutes(ADMIN_API_DIR)) {
  fileCount++;
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    continue;
  }

  const src = stripComments(raw);
  const rel = toPosix(path.relative(repoRoot, filePath));
  const fileHasAuth = /\brequireAuth\s*\(/.test(src);

  const matches = [...src.matchAll(HANDLER_RE)];

  if (matches.length === 0) {
    // Route file with no recognizable handler (e.g. re-export). Fall back to a
    // whole-file check so it cannot be silently unprotected.
    if (!fileHasAuth) {
      violations.push(`${rel} → cap requireAuth al fitxer`);
    }
    continue;
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const method = m[1] || m[2];
    const start = m.index ?? 0;
    const nextStart = i + 1 < matches.length ? (matches[i + 1].index ?? src.length) : src.length;

    const braceIdx = findHandlerBodyBrace(src, start, nextStart);
    if (braceIdx === -1) {
      // Handler has no own block before the next handler (delegation /
      // re-export): cannot scope, require auth somewhere in the file.
      if (!fileHasAuth) {
        violations.push(`${rel} → ${method}() sense requireAuth`);
      }
      continue;
    }

    const end = findBlockEnd(src, braceIdx);
    const body =
      end > nextStart ? src.slice(braceIdx, nextStart) : src.slice(braceIdx, end + 1);

    if (!/\brequireAuth\s*\(/.test(body)) {
      violations.push(`${rel} → ${method}() sense requireAuth`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[api-admin-auth] FAIL: ${violations.length} handler(s) /api/admin/* sense requireAuth:`,
  );
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(
    'Tota ruta /api/admin/* ha de verificar autenticació amb requireAuth a CADA handler. No hi ha excepcions. (CLAUDE.md §Seguretat)',
  );
  process.exit(1);
}

console.log(
  `[api-admin-auth] OK: totes les rutes /api/admin/* (${fileCount} fitxers) amb requireAuth a cada handler.`,
);
