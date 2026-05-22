#!/usr/bin/env node
/**
 * qa:no-img-tag
 * Detecta etiquetes <img> natives en fitxers .tsx de app/ i lib/.
 *
 * Raó: Next.js exigeix usar <Image> de next/image per a optimització
 * automàtica (redimensionat, WebP/AVIF, lazy loading, LCP). Un <img> natiu
 * omet tota aquesta capa i pot impactar directament Core Web Vitals i
 * temps de càrrega. CLAUDE.md §Performance: "next/image a 25 components".
 *
 * Excepcions acceptades: tests, comentaris.
 * Fitxers .ts no es revisen perquè els serveis d'email generen HTML amb
 * <img> dins template literals (HTML vàlid, no JSX).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPES = ['app', 'lib'];
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.'];

function* walkDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile()) {
      if (!entry.name.endsWith('.tsx')) continue;
      if (TEST_FILE_PATTERNS.some((p) => entry.name.includes(p))) continue;
      yield full;
    }
  }
}

const IMG_PATTERN = /<img[\s>/]/;

const violations = [];
let filesChecked = 0;

function isInsideLineComment(line, index) {
  const commentIndex = line.indexOf('//');
  return commentIndex !== -1 && commentIndex < index;
}

function isInsideInlineBlockComment(line, index, startToken, endToken) {
  const start = line.lastIndexOf(startToken, index);
  if (start === -1) return false;
  const end = line.lastIndexOf(endToken, index);
  return end === -1 || end < start;
}

function isCommentedImg(line) {
  const imgIndex = line.search(IMG_PATTERN);
  if (imgIndex === -1) return true;
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  if (trimmed.startsWith('{/*')) return true;
  return (
    isInsideLineComment(line, imgIndex)
    || isInsideInlineBlockComment(line, imgIndex, '{/*', '*/}')
    || isInsideInlineBlockComment(line, imgIndex, '/*', '*/')
  );
}

for (const scope of SCOPES) {
  const scopeDir = path.join(ROOT, scope);
  if (!fs.existsSync(scopeDir)) continue;
  for (const file of walkDir(scopeDir)) {
    filesChecked++;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const lines = fs.readFileSync(file, 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!IMG_PATTERN.test(line)) continue;
      if (isCommentedImg(line)) continue;

      const trimmed = line.trimStart();
      violations.push({ file: rel, line: i + 1, sample: trimmed.slice(0, 120) });
    }
  }
}

if (violations.length > 0) {
  console.error(`[no-img-tag] FAIL: ${violations.length} etiqueta(es) <img> nativa detectada(es):`);
  for (const { file, line, sample } of violations) {
    console.error(`  ${file}:${line}  ${sample}`);
  }
  console.error(
    "\nSubstitueix <img> per <Image> de next/image:\n  import Image from 'next/image';\n  <Image src={src} alt={alt} width={w} height={h} />",
  );
  process.exit(1);
}

console.log(`[no-img-tag] OK: ${filesChecked} fitxers .tsx revisats, cap <img> nativa.`);
