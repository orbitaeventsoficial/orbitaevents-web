#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_PATHS = ['app', 'lib', 'messages'];
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_FILES = new Set(['pnpm-lock.yaml', 'package-lock.json']);
const CATALAN_APOSTROPHE_WORDS = [
  "d'avui", "d'ahir", "d'event", "d'events",
  "s'aturi", "s'ha", "s'han", "s'hi",
  "l'usuari", "l'admin", "l'event", "l'equip", "l'objectiu",
  "n'hi", "m'ha", "t'ha",
  "contacta'ls", "contacta'l",
];
const CATALAN_PLURAL_TRAPS = [
  { singular: 'resposta', wrongPlural: 'respostas', hint: 'respostes' },
  { singular: 'pressupost', wrongPlural: 'pressuposts', hint: 'pressupostos' },
  { singular: 'tasca', wrongPlural: 'tascas', hint: 'tasques' },
];

function parseArgs(argv) {
  const args = { changed: false, paths: [], json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--changed') { args.changed = true; continue; }
    if (arg === '--json') { args.json = true; continue; }
    if (arg === '--paths') {
      for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j += 1) {
        args.paths.push(argv[j]);
        i = j;
      }
    }
  }
  return args;
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function shouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return true;
  if (normalized.includes('/node_modules/')) return true;
  if (normalized.includes('/.next/')) return true;
  if (normalized.includes('/coverage/')) return true;
  if (normalized.includes('/dist/')) return true;
  if (normalized.includes('/__tests__/')) return true;
  if (normalized.includes('.test.')) return true;
  if (normalized.includes('.spec.')) return true;
  if (normalized.endsWith('/scripts/check-language-quality.mjs')) return true;
  return false;
}

function walkDir(targetPath, fileList) {
  if (!fs.existsSync(targetPath)) return;
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
      continue;
    }
    if (entry.isFile() && isTextFile(fullPath)) fileList.push(fullPath);
  }
}

function getChangedFiles(repoRoot) {
  const output = execSync('git diff --name-only --diff-filter=ACMR HEAD', {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) => path.join(repoRoot, file))
    .filter((file) => fs.existsSync(file) && isTextFile(file) && !shouldSkip(file));
}

function collectFiles(repoRoot, args) {
  if (args.changed) return getChangedFiles(repoRoot);
  const targets = args.paths.length > 0 ? args.paths : DEFAULT_PATHS;
  const files = [];
  for (const target of targets) {
    const resolved = path.join(repoRoot, target);
    if (!fs.existsSync(resolved)) continue;
    const stats = fs.statSync(resolved);
    if (stats.isDirectory()) walkDir(resolved, files);
    else if (stats.isFile() && isTextFile(resolved) && !shouldSkip(resolved)) files.push(resolved);
  }
  return files;
}

function computeStringContext(line) {
  const ctx = new Array(line.length).fill(null);
  let state = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';
    if (state === null) {
      if (ch === "'" || ch === '"' || ch === '`') state = ch;
    } else if (ch === state && prev !== '\\') {
      ctx[i] = state;
      state = null;
      continue;
    }
    ctx[i] = state;
  }
  return ctx;
}

function detectCatalanApostropheInSingleQuote(lines) {
  const findings = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    const ctx = computeStringContext(line);
    const lowerLine = line.toLowerCase();
    for (const word of CATALAN_APOSTROPHE_WORDS) {
      let pos = lowerLine.indexOf(word.toLowerCase());
      while (pos !== -1) {
        if (ctx[pos] === "'") {
          findings.push({
            line: idx + 1,
            label: 'CATALAN_APOSTROPHE_IN_SINGLE_QUOTE',
            sample: trimmed.slice(0, 180),
            hint: `"${word}" dins string single-quoted — usa cometes dobles o template literal`,
          });
          return;
        }
        pos = lowerLine.indexOf(word.toLowerCase(), pos + 1);
      }
    }
  });
  return findings;
}

function detectWrongCatalanPlural(lines) {
  const findings = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    const ctx = computeStringContext(line);
    const lowerLine = line.toLowerCase();
    for (const trap of CATALAN_PLURAL_TRAPS) {
      const needle = trap.wrongPlural;
      let pos = lowerLine.indexOf(needle);
      let flagged = false;
      while (pos !== -1 && !flagged) {
        if (ctx[pos] !== null) {
          let start = pos;
          while (start > 0 && ctx[start - 1] === ctx[pos]) start -= 1;
          let end = pos + needle.length;
          while (end < line.length && ctx[end] === ctx[pos]) end += 1;
          const stringContent = line.slice(start, end);
          const stripped = stringContent.replace(/[^a-zà-ÿ]/gi, '');
          if (stripped.length > needle.length + 2) {
            findings.push({
              line: idx + 1,
              label: 'WRONG_CATALAN_PLURAL_S',
              sample: trimmed.slice(0, 180),
              hint: `"${trap.wrongPlural}" no és català — usa "${trap.hint}"`,
            });
            flagged = true;
          }
        }
        pos = lowerLine.indexOf(needle, pos + 1);
      }
      if (flagged) continue;
      const ternaryPattern = new RegExp('\\b' + trap.singular + '\\\\$\\\\{[^}]*\\\\?\\\\s*[\'\"`][\'\"`]\\\\s*:\\\\s*[\'\"`]s[\'\"`][^}]*\\\\}');
      if (ternaryPattern.test(line)) {
        findings.push({
          line: idx + 1,
          label: 'WRONG_CATALAN_PLURAL_S',
          sample: trimmed.slice(0, 180),
          hint: `ternari de pluralització sobre "${trap.singular}" genera plural incorrecte — usa "${trap.hint}"`,
        });
      }
    }
  });
  return findings;
}

const DETECTORS = [detectCatalanApostropheInSingleQuote, detectWrongCatalanPlural];

function scanFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const findings = [];
  for (const detector of DETECTORS) findings.push(...detector(lines));
  return findings;
}

function main() {
  const repoRoot = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const files = collectFiles(repoRoot, args);
  if (files.length === 0) {
    console.log('No files selected for language-quality scan.');
    process.exit(0);
  }

  const problems = [];
  for (const file of files) {
    const findings = scanFile(file);
    if (findings.length > 0) problems.push({ file, findings });
  }

  if (args.json) {
    const payload = {
      filesScanned: files.length,
      filesWithFindings: problems.length,
      totalFindings: problems.reduce((acc, item) => acc + item.findings.length, 0),
      problems,
    };
    console.log(JSON.stringify(payload, null, 2));
    process.exit(problems.length > 0 ? 1 : 0);
  }

  if (problems.length === 0) {
    console.log(`Language-quality scan clean. Files checked: ${files.length}`);
    process.exit(0);
  }

  const totalFindings = problems.reduce((acc, item) => acc + item.findings.length, 0);
  console.error(`Language-quality issues detected: ${totalFindings} finding(s) across ${problems.length} file(s).`);
  for (const problem of problems) {
    const relative = path.relative(repoRoot, problem.file).replace(/\\/g, '/');
    for (const finding of problem.findings) {
      console.error(`\n${relative}:${finding.line}  [${finding.label}]`);
      console.error(`  ${finding.sample}`);
      console.error(`  ${finding.hint}`);
    }
  }
  process.exit(1);
}

main();
