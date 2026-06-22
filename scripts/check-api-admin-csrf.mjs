#!/usr/bin/env node
/**
 * qa:api-admin-csrf
 * Tota ruta /api/admin/* amb handler mutador ha de validar CSRF amb
 * verifyCsrf a CADA handler HTTP exportat que escriu estat.
 *
 * Complementa qa:api-admin-auth: l'autenticació protegeix qui entra; el CSRF
 * protegeix que un POST/PUT/PATCH/DELETE admin no es pugui disparar des d'un
 * origen aliè. Els comentaris es neutralitzen perquè un verifyCsrf comentat no
 * compti.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_API_DIR = path.join(repoRoot, 'app', 'api', 'admin');
const ALLOWLIST_PATH = path.join(repoRoot, 'scripts', 'api-admin-csrf-allowlist.txt');

const SKIP_SEGMENTS = new Set(['node_modules', '.next', '__tests__', 'dist', 'build', '.git']);
const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
let mutatingHandlerCount = 0;

function readAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return new Set();
  const raw = fs.readFileSync(ALLOWLIST_PATH, 'utf-8');
  return new Set(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
  );
}

const allowlist = readAllowlist();

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
  const fileHasCsrf = /\bverifyCsrf\s*\(/.test(src);

  const matches = [...src.matchAll(HANDLER_RE)];
  if (matches.length === 0) continue;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const method = m[1] || m[2];
    if (!MUTATING_METHODS.has(method)) continue;

    mutatingHandlerCount++;
    const start = m.index ?? 0;
    const nextStart = i + 1 < matches.length ? (matches[i + 1].index ?? src.length) : src.length;

    const braceIdx = findHandlerBodyBrace(src, start, nextStart);
    if (braceIdx === -1) {
      if (!fileHasCsrf) {
        violations.push(`${rel} -> ${method}() sense verifyCsrf`);
      }
      continue;
    }

    const end = findBlockEnd(src, braceIdx);
    const body =
      end > nextStart ? src.slice(braceIdx, nextStart) : src.slice(braceIdx, end + 1);

    if (!/\bverifyCsrf\s*\(/.test(body)) {
      violations.push(`${rel} -> ${method}() sense verifyCsrf`);
    }
  }
}

const activeAllowlisted = violations.filter((v) => allowlist.has(v));
const newViolations = violations.filter((v) => !allowlist.has(v));
const staleAllowlistEntries = [...allowlist].filter((v) => !violations.includes(v));

if (newViolations.length > 0 || staleAllowlistEntries.length > 0) {
  if (newViolations.length > 0) {
    console.error(
      `[api-admin-csrf] FAIL: ${newViolations.length} handler(s) mutadors /api/admin/* sense verifyCsrf no inventariats:`,
    );
    for (const v of newViolations) {
      console.error(`  - ${v}`);
    }
  }
  if (staleAllowlistEntries.length > 0) {
    console.error(
      `[api-admin-csrf] FAIL: ${staleAllowlistEntries.length} entrada/es stale a scripts/api-admin-csrf-allowlist.txt:`,
    );
    for (const v of staleAllowlistEntries) {
      console.error(`  - ${v}`);
    }
  }
  console.error(
    'Tot POST/PUT/PATCH/DELETE admin ha de validar verifyCsrf(req) dins del handler. Si és deute preexistent, inventaria el handler exacte a la baseline i obre tall de sanejament per òrgan.',
  );
  process.exit(1);
}

console.log(
  `[api-admin-csrf] OK: ${mutatingHandlerCount} handler(s) mutadors /api/admin/* (${fileCount} fitxers) revisats; ${activeAllowlisted.length} deute(s) CSRF preexistent(s) inventariat(s).`,
);
