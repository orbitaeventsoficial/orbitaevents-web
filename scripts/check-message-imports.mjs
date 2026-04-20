import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const targets = ['app', 'lib'];
const allowed = new Set([
  'lib/pack-i18n.ts',
  'lib/equipment-i18n.ts',
  'lib/home-meta.ts',
  'lib/site-public-copy.ts',
  'lib/public-error-copy.ts',
]);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const messageImportRegex = /from\s+['"](?:@\/messages|\.\.\/messages|\.\.\/\.\.\/messages|.*messages\/(?:ca|es|en)\.json)/;
const findings = [];

function shouldSkip(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  return normalized.includes('/node_modules/') || normalized.includes('/.next/') || normalized.includes('/coverage/') || normalized.includes('/dist/');
}

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolute = path.join(dirPath, entry.name);
    const relative = path.relative(repoRoot, absolute).replace(/\\/g, '/');
    if (shouldSkip(relative)) continue;

    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }

    if (!entry.isFile() || !extensions.has(path.extname(entry.name))) continue;
    if (allowed.has(relative)) continue;

    const content = fs.readFileSync(absolute, 'utf8');
    if (messageImportRegex.test(content)) {
      findings.push(relative);
    }
  }
}

for (const target of targets) {
  const absolute = path.join(repoRoot, target);
  if (fs.existsSync(absolute)) walk(absolute);
}

if (findings.length > 0) {
  console.error('[message-imports] Direct messages imports found outside approved i18n adapters:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  console.error('\nMove message access behind a lib/* i18n/copy helper or add an explicit allowlist entry with justification.');
  process.exit(1);
}

console.log(`[message-imports] OK: direct messages imports limited to ${allowed.size} approved adapters.`);
