import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DEFAULT_PATHS = ['app', 'lib', 'messages', 'prisma'];
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.css', '.scss', '.html', '.txt', '.yml', '.yaml'
]);
const SKIP_FILES = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);
const PATTERNS = [
  { label: 'UTF8_CP1252_A_TILDE', regex: /Ã./g },
  { label: 'UTF8_CP1252_A_CIRCUMFLEX', regex: /Â./g },
  { label: 'UTF8_CP1252_E2', regex: /â[\x80-\xBF]/g },
  { label: 'BROKEN_EMOJI', regex: /ðŸ[\x80-\xBF]?/g },
  { label: 'REPLACEMENT_CHAR', regex: /�/g },
];

function parseArgs(argv) {
  const args = { changed: false, paths: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--changed') {
      args.changed = true;
      continue;
    }
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
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function shouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return true;
  if (normalized.includes('/node_modules/')) return true;
  if (normalized.includes('/.next/')) return true;
  if (normalized.includes('/coverage/')) return true;
  if (normalized.includes('/dist/')) return true;
  if (normalized.endsWith('/scripts/check-mojibake.mjs')) return true;
  if (normalized.endsWith('/docs/diario.md')) return true;
  return false;
}

function walkDir(targetPath, fileList) {
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
      continue;
    }
    if (entry.isFile() && isTextFile(fullPath)) {
      fileList.push(fullPath);
    }
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
  if (args.changed) {
    return getChangedFiles(repoRoot);
  }

  const targets = args.paths.length > 0 ? args.paths : DEFAULT_PATHS;
  const files = [];
  for (const target of targets) {
    const resolved = path.join(repoRoot, target);
    if (!fs.existsSync(resolved)) continue;
    const stats = fs.statSync(resolved);
    if (stats.isDirectory()) {
      walkDir(resolved, files);
    } else if (stats.isFile() && isTextFile(resolved) && !shouldSkip(resolved)) {
      files.push(resolved);
    }
  }
  return files;
}

function findMatches(content) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(line)) {
        findings.push({ line: index + 1, label: pattern.label, sample: line.trim().slice(0, 180) });
      }
    }
  });
  return findings;
}

function main() {
  const repoRoot = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const files = collectFiles(repoRoot, args);

  if (files.length === 0) {
    console.log('No files selected for mojibake scan.');
    process.exit(0);
  }

  const problems = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = findMatches(content);
    if (matches.length > 0) {
      problems.push({ file, matches });
    }
  }

  if (problems.length === 0) {
    console.log(`Mojibake scan clean. Files checked: ${files.length}`);
    process.exit(0);
  }

  console.error(`Mojibake detected in ${problems.length} file(s).`);
  for (const problem of problems) {
    const relativeFile = path.relative(repoRoot, problem.file).replace(/\\/g, '/');
    for (const match of problem.matches.slice(0, 10)) {
      console.error(`${relativeFile}:${match.line} [${match.label}] ${match.sample}`);
    }
    if (problem.matches.length > 10) {
      console.error(`${relativeFile}: ... ${problem.matches.length - 10} more match(es)`);
    }
  }
  process.exit(1);
}

main();

