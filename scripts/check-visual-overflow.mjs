#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_ROOTS = ['app', 'components'];
const TARGET_EXT = new Set(['.tsx', '.jsx']);
const STRICT = process.argv.includes('--strict');

const CLASS_CONTEXT_REGEX = /(?:className|class)\s*=\s*(['"`])([\s\S]*?)\1/g;

const OVERFLOW_GUARDS = [
  'min-w-0',
  'max-w-',
  'truncate',
  'break-words',
  'break-all',
  'overflow-hidden',
  'overflow-x-auto',
  'text-ellipsis',
  'whitespace-normal',
  'shrink-0',
];


async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, acc = []) {
  if (!(await exists(dir))) return acc;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, acc);
      continue;
    }
    if (entry.isFile() && TARGET_EXT.has(path.extname(entry.name))) acc.push(fullPath);
  }
  return acc;
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function hasAny(tokens, needles) {
  return tokens.some((token) => needles.some((needle) => token.includes(needle)));
}

function isLikelyIconOrPrimitive(tokens) {
  return tokens.some((token) => /^(?:[a-z]+:)*(?:h|w|size)-/.test(token)) && tokens.length <= 12;
}

function hasNearbyHorizontalScroll(text, index) {
  return text.slice(Math.max(0, index - 360), index).includes('overflow-x-auto');
}

function isOverlay(tokens) {
  return tokens.some((token) => token.endsWith('absolute') || token.endsWith('fixed'));
}

function addRisk(risks, file, text, index, kind, detail, classText) {
  risks.push({
    file: path.relative(ROOT, file),
    line: lineFromIndex(text, index),
    kind,
    detail,
    classText: classText.replace(/\s+/g, ' ').trim().slice(0, 180),
  });
}

const files = [];
for (const root of TARGET_ROOTS) {
  await walk(path.join(ROOT, root), files);
}

const risks = [];

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  let match;
  while ((match = CLASS_CONTEXT_REGEX.exec(text)) !== null) {
    const classText = match[2];
    if (!classText || classText.includes('${')) continue;
    const tokens = classText.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    const usesNowrap = tokens.some((token) => token.endsWith('whitespace-nowrap'));
    if (usesNowrap && !isOverlay(tokens) && !hasAny(tokens, OVERFLOW_GUARDS) && !isLikelyIconOrPrimitive(tokens)) {
      addRisk(risks, file, text, match.index, 'nowrap-no-guard', 'whitespace-nowrap sense truncat, break, max-width o overflow guard.', classText);
    }

    const hasWideMin = tokens.some((token) => /(?:^|:)min-w-\[(?:[5-9]\d{2}|\d{4,})/.test(token));
    const hasHorizontalScroll = hasAny(tokens, ['overflow-x-auto', 'snap-x']) || hasNearbyHorizontalScroll(text, match.index);
    if (hasWideMin && !isOverlay(tokens) && !hasHorizontalScroll) {
      addRisk(risks, file, text, match.index, 'wide-min-no-scroll', 'min-width gran sense scroll horitzontal explícit.', classText);
    }


    const isFixedGrid = tokens.some((token) => /^grid-cols-[4-9]$/.test(token));
    const hasResponsiveGrid = tokens.some((token) => /^(sm|md|lg|xl|2xl):grid-cols-/.test(token));
    if (isFixedGrid && !hasResponsiveGrid && !hasAny(tokens, ['overflow-x-auto'])) {
      addRisk(risks, file, text, match.index, 'fixed-grid-mobile', 'grid-cols alt sense breakpoint responsive ni scroll.', classText);
    }
  }
  CLASS_CONTEXT_REGEX.lastIndex = 0;
}

const sample = risks.slice(0, 120);
for (const risk of sample) {
  console.log(`[visual-overflow] ${risk.file}:${risk.line} [${risk.kind}] ${risk.detail}`);
  console.log(`  ${risk.classText}`);
}
if (risks.length > sample.length) {
  console.log(`[visual-overflow] ... ${risks.length - sample.length} riscos més omesos.`);
}

if (risks.length === 0) {
  console.log('[visual-overflow] OK: no obvious static overflow risks found.');
  process.exit(0);
}

const message = `[visual-overflow] WARN: ${risks.length} static visual/overflow risk(s) found.`;
if (STRICT) {
  console.error(message);
  process.exit(2);
}
console.warn(message);