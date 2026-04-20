#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_PATHS = ['app', 'lib'];
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_FILES = new Set(['pnpm-lock.yaml', 'package-lock.json']);

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
  if (normalized.endsWith('/scripts/check-patches.mjs')) return true;
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

function detectRepeatedPluralTernary(lines) {
  const pattern = /\$\{[^}]*===\s*1\s*\?\s*['"`][^'"`]*['"`]\s*:\s*['"`][^'"`]*['"`][^}]*\}/g;
  let count = 0;
  const firstLines = [];
  lines.forEach((line, idx) => {
    const matches = line.match(pattern);
    if (!matches) return;
    count += matches.length;
    if (firstLines.length < 4) firstLines.push({ line: idx + 1, sample: line.trim().slice(0, 160) });
  });
  if (count <= 3) return [];
  return [{
    line: firstLines[0].line,
    label: 'REPEATED_INLINE_PLURAL_TERNARY',
    sample: firstLines[0].sample,
    hint: `${count} ternaris de pluralització al mateix fitxer — considera extreure un helper`,
  }];
}

function detectDuplicatePushBlocks(lines) {
  const blocks = new Map();
  const blockSize = 4;
  for (let i = 0; i < lines.length; i += 1) {
    const first = lines[i].trim();
    if (first.length < 20) continue;
    if (!/\.push\s*\(\s*\{/.test(first)) continue;
    const chunk = lines.slice(i, i + blockSize).map((line) => line.trim()).join(' | ');
    if (!blocks.has(chunk)) blocks.set(chunk, []);
    blocks.get(chunk).push(i + 1);
  }
  const findings = [];
  for (const [chunk, occurrences] of blocks.entries()) {
    if (occurrences.length < 2) continue;
    findings.push({
      line: occurrences[0],
      label: 'DUPLICATE_PUSH_BLOCK',
      sample: chunk.slice(0, 180),
      hint: `bloc push() idèntic (4 línies) repetit a ${occurrences.join(', ')}`,
    });
  }
  return findings;
}

function detectEmptyCatch(lines) {
  const findings = [];
  const content = lines.join('\n');
  const pattern = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length;
    findings.push({
      line: lineNum,
      label: 'EMPTY_CATCH',
      sample: match[0],
      hint: "catch buit — com a mínim logueja l'error o documenta per què s'ignora",
    });
  }
  return findings;
}

function detectTodoMarkers(lines) {
  const findings = [];
  const pattern = /\/\/\s*(TODO|FIXME|HACK|XXX)\b[^\n]*/i;
  lines.forEach((line, idx) => {
    const match = line.match(pattern);
    if (!match) return;
    findings.push({
      line: idx + 1,
      label: 'TODO_MARKER',
      sample: match[0].trim().slice(0, 180),
      hint: 'marcador TODO/FIXME/HACK — resol-ho o obre issue',
    });
  });
  return findings;
}

function detectNarrowFixComments(lines) {
  const findings = [];
  const pattern = /\/\/[^\n]*(quick\s*fix|parche|parxe|temporal(?!\w)|no\s*tocar|workaround)/i;
  lines.forEach((line, idx) => {
    const match = line.match(pattern);
    if (!match) return;
    findings.push({
      line: idx + 1,
      label: 'NARROW_FIX_COMMENT',
      sample: line.trim().slice(0, 180),
      hint: "comentari que admet parche — reavalua l'arrel",
    });
  });
  return findings;
}

const DETECTORS = [
  detectRepeatedPluralTernary,
  detectDuplicatePushBlocks,
  detectEmptyCatch,
  detectTodoMarkers,
  detectNarrowFixComments,
];

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
    console.log('No files selected for patch-smell scan.');
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
    console.log(`Patch-smell scan clean. Files checked: ${files.length}`);
    process.exit(0);
  }

  const totalFindings = problems.reduce((acc, item) => acc + item.findings.length, 0);
  console.error(`Patch smells detected: ${totalFindings} finding(s) across ${problems.length} file(s).`);
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