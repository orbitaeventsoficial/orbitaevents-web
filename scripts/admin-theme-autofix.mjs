#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ADMIN_DIR = path.join(ROOT, 'app', 'admin');
const GLOBALS_CSS = path.join(ROOT, 'app', 'globals.css');
const TARGET_EXT = new Set(['.ts', '.tsx']);
const MODE = process.argv.includes('--fix') ? 'fix' : 'check';
const STRICT_UI = process.argv.includes('--strict-ui');

const COLOR_FAMILIES =
  '(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';

const DISALLOWED_BASE = new RegExp(
  `^(?:bg|text|border|from|to|via|ring|ring-offset|decoration|shadow)-${COLOR_FAMILIES}(?:-[0-9]{1,3})?(?:\\/[0-9]{1,3})?$`
);
const DISALLOWED_GRADIENT_BASE = /^bg-gradient(?:-to-[trbl]{1,2})?$/;

const CLASS_CONTEXT_REGEX =
  /(?:className|class|badgeClass|dotClass|statusClass|toneClass|buttonClass|primary|secondary)\s*[:=]\s*(['"`])([\s\S]*?)\1/g;

function isDisallowedClassToken(token) {
  if (!token || token.startsWith('admin-')) return false;
  const base = token.split(':').at(-1) ?? token;
  if (DISALLOWED_GRADIENT_BASE.test(base)) return true;
  return DISALLOWED_BASE.test(base);
}

function cleanClassList(value) {
  const rawTokens = value.split(/\s+/).filter(Boolean);
  const kept = [];
  const removed = [];

  for (const token of rawTokens) {
    if (isDisallowedClassToken(token)) {
      removed.push(token);
      continue;
    }
    kept.push(token);
  }

  return { next: kept.join(' '), removed };
}

function hasPaddingToken(tokens) {
  return tokens.some((token) => /^(?:[a-z]+:)*(?:p|px|py|pt|pr|pb|pl)-/.test(token));
}

function hasOverflowGuard(tokens) {
  return tokens.some((token) => /^(?:[a-z]+:)*(?:truncate|break-words|break-all|overflow-hidden|text-ellipsis|min-w-0)$/.test(token));
}

async function walk(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, acc);
      continue;
    }
    if (entry.isFile() && TARGET_EXT.has(path.extname(entry.name))) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function run() {
  const files = await walk(ADMIN_DIR);
  let totalLeaks = 0;
  let changedFiles = 0;
  const leakLogs = [];
  const uiRiskLogs = [];
  let totalUiRisks = 0;
  let totalCssRisks = 0;

  for (const file of files) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;
    let fileLeaks = 0;

    updated = updated.replace(CLASS_CONTEXT_REGEX, (match, quote, content, offset) => {
      if (!content || content.includes('${')) return match;
      const tokens = content.split(/\s+/).filter(Boolean);
      const { next, removed } = cleanClassList(content);
      if (removed.length === 0) return match;

      fileLeaks += removed.length;
      totalLeaks += removed.length;
      leakLogs.push({
        file: path.relative(ROOT, file),
        line: lineFromIndex(original, offset),
        removed,
      });

      return match.replace(content, next);
    });

    let m;
    while ((m = CLASS_CONTEXT_REGEX.exec(original)) !== null) {
      const content = m[2];
      if (!content || content.includes('${')) continue;
      const tokens = content.split(/\s+/).filter(Boolean);
      const hasRoundedCard = tokens.some((t) => /^(?:[a-z]+:)*rounded(?:-[a-z0-9]+)?$/.test(t));
      const hasBorder = tokens.some((t) => /^(?:[a-z]+:)*border(?:-[a-z0-9/.\[\]-]+)?$/.test(t));
      const usesNowrap = tokens.some((t) => /^(?:[a-z]+:)*whitespace-nowrap$/.test(t));

      if (hasRoundedCard && hasBorder && !hasPaddingToken(tokens)) {
        totalUiRisks += 1;
        uiRiskLogs.push({
          file: path.relative(ROOT, file),
          line: lineFromIndex(original, m.index),
          kind: 'margin',
          detail: 'Container amb rounded+border sense padding (marge de seguretat absent).',
        });
      }

      if (usesNowrap && !hasOverflowGuard(tokens)) {
        totalUiRisks += 1;
        uiRiskLogs.push({
          file: path.relative(ROOT, file),
          line: lineFromIndex(original, m.index),
          kind: 'overflow',
          detail: 'whitespace-nowrap sense guard de desbordament.',
        });
      }
    }
    CLASS_CONTEXT_REGEX.lastIndex = 0;

    if (MODE === 'fix' && updated !== original) {
      await fs.writeFile(file, updated, 'utf8');
      changedFiles += 1;
    }

    if (MODE === 'check' && fileLeaks > 0) {
      // no-op, just aggregate
    }
  }

  try {
    const css = await fs.readFile(GLOBALS_CSS, 'utf8');
    const blocks = css.match(/html\.admin-mode[\s\S]*?\{[\s\S]*?\}/g) || [];
    const cssRiskLines = [];
    for (const block of blocks) {
      if (!/(linear-gradient|radial-gradient|conic-gradient)/.test(block)) continue;
      const start = css.indexOf(block);
      const line = lineFromIndex(css, Math.max(0, start));
      totalCssRisks += 1;
      cssRiskLines.push(`app/globals.css:${line}`);
    }
    if (cssRiskLines.length > 0) {
      const sample = cssRiskLines.slice(0, 40);
      for (const item of sample) {
        console.log(`[admin-theme-autofix] ${item} [css-gradient] selector admin-mode amb gradient.`);
      }
      if (cssRiskLines.length > sample.length) {
        console.log(`[admin-theme-autofix] ... ${cssRiskLines.length - sample.length} more css gradient matches omitted.`);
      }
    }
  } catch {
    // best effort, don't block.
  }

  if (totalLeaks === 0) {
    if (MODE === 'check' && (totalUiRisks > 0 || totalCssRisks > 0)) {
      const sample = uiRiskLogs.slice(0, 80);
      for (const risk of sample) {
        console.log(`[admin-theme-autofix] ${risk.file}:${risk.line} [${risk.kind}] ${risk.detail}`);
      }
      if (uiRiskLogs.length > sample.length) {
        console.log(`[admin-theme-autofix] ... ${uiRiskLogs.length - sample.length} more UI risks omitted.`);
      }
      if (STRICT_UI) {
        console.error(
          `[admin-theme-autofix] FAIL: ${totalUiRisks} UI overflow/margin risk(s), ${totalCssRisks} css gradient risk(s).`
        );
        process.exit(2);
      }
      console.warn(
        `[admin-theme-autofix] WARN: ${totalUiRisks} UI overflow/margin risk(s), ${totalCssRisks} css gradient risk(s).`
      );
    }
    console.log(`[admin-theme-autofix] OK: no hardcoded color utilities in class contexts (${MODE}).`);
    return;
  }

  const sample = leakLogs.slice(0, 80);
  for (const leak of sample) {
    console.log(
      `[admin-theme-autofix] ${leak.file}:${leak.line} -> ${leak.removed.join(', ')}`
    );
  }
  if (leakLogs.length > sample.length) {
    console.log(
      `[admin-theme-autofix] ... ${leakLogs.length - sample.length} more matches omitted.`
    );
  }

  if (MODE === 'fix') {
    console.log(
      `[admin-theme-autofix] FIXED: removed ${totalLeaks} hardcoded tokens in ${changedFiles} files.`
    );
    if (totalUiRisks > 0) {
      console.log(
        `[admin-theme-autofix] UI risks detectats (no auto-fix): ${totalUiRisks}. Executa --check per veure detalls.`
      );
    }
    return;
  }

  console.error(
    `[admin-theme-autofix] FAIL: found ${totalLeaks} hardcoded color/gradient tokens in admin class strings.`
  );
  process.exit(2);
}

run().catch((error) => {
  console.error('[admin-theme-autofix] crash:', error instanceof Error ? error.message : String(error));
  process.exit(2);
});
