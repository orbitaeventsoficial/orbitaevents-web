#!/usr/bin/env node
// qa:no-zod-parse — detecta .parse() de Zod a rutes API; el patró canònic és .safeParse()
// Raó: .parse() llença ZodError que pot no ser capturat; .safeParse() retorna un resultat
// tipat i permet retornar 400 amb un missatge controlat en lloc d'un 500 inesperat.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPE = path.join(ROOT, 'app', 'api');
const SKIP_DIRS = new Set(['__tests__', 'node_modules', '.next', '.git', 'dist', 'out']);

const PARSE_CALL = /\.parse\s*\(/;
const SAFE_PARSE_CALL = /\.safeParse\s*\(/;
const EXEMPT_PARSE = /\b(?:JSON|Date|Number|path|url|qs|querystring|cookie)\.parse\s*\(/;

function* walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkDir(full);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.spec.')
    ) {
      yield full;
    }
  }
}

const violations = [];
let filesChecked = 0;

for (const file of walkDir(SCOPE)) {
  filesChecked++;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    if (!PARSE_CALL.test(line)) continue;
    if (SAFE_PARSE_CALL.test(line)) continue;
    if (EXEMPT_PARSE.test(line)) continue;
    violations.push({ file: rel, line: i + 1, sample: trimmed.slice(0, 120) });
  }
}

if (violations.length === 0) {
  console.log(`[no-zod-parse] OK — ${filesChecked} API route file(s) checked`);
  process.exit(0);
}

process.stderr.write(
  `[no-zod-parse] FAIL — ${violations.length} .parse() call(s) trobades a rutes API\n`,
);
for (const v of violations) {
  process.stderr.write(`  ${v.file}:${v.line}  ${v.sample}\n`);
}
process.stderr.write(
  '  → Substitueix .parse() per .safeParse() i gestiona l\'error explícitament (return 400)\n',
);
process.exit(1);
