#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const COVERAGE_PAIRS = [
  {
    src: path.join(repoRoot, 'lib', 'services'),
    tests: path.join(repoRoot, '__tests__', 'lib', 'services'),
    label: 'lib/services',
  },
  {
    src: path.join(repoRoot, 'lib', 'utils'),
    tests: path.join(repoRoot, '__tests__', 'lib', 'utils'),
    label: 'lib/utils',
  },
  {
    src: path.join(repoRoot, 'lib', 'hooks'),
    tests: path.join(repoRoot, '__tests__', 'lib', 'hooks'),
    label: 'lib/hooks',
  },
  {
    src: path.join(repoRoot, 'lib', 'api'),
    tests: path.join(repoRoot, '__tests__', 'lib', 'api'),
    label: 'lib/api',
  },
  {
    src: path.join(repoRoot, 'lib', 'admin'),
    tests: path.join(repoRoot, '__tests__', 'lib', 'admin'),
    label: 'lib/admin',
  },
];

function collectBasenames(dir, suffix) {
  if (!fs.existsSync(dir)) return new Set();
  const result = new Set();
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(suffix) && !entry.name.endsWith('.d.ts')) {
        result.add(entry.name.slice(0, -suffix.length));
      }
    }
  }
  walk(dir);
  return result;
}

const TEST_SUFFIXES = ['.test.ts', '.test.tsx'];

function collectTestBasenames(dir) {
  if (!fs.existsSync(dir)) return new Set();
  const result = new Set();
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        for (const suffix of TEST_SUFFIXES) {
          if (entry.name.endsWith(suffix)) {
            result.add(entry.name.slice(0, -suffix.length));
            break;
          }
        }
      }
    }
  }
  walk(dir);
  return result;
}

let totalSrc = 0;
const allMissing = [];

for (const pair of COVERAGE_PAIRS) {
  const srcs = collectBasenames(pair.src, '.ts');
  const tests = collectTestBasenames(pair.tests);
  const missing = [...srcs].filter((s) => !tests.has(s)).sort();
  totalSrc += srcs.size;
  for (const s of missing) {
    allMissing.push({ label: pair.label, name: s });
  }
}

if (allMissing.length > 0) {
  console.error(
    `[service-coverage] FAIL: ${allMissing.length} fitxer(s) sense test corresponent:`,
  );
  for (const item of allMissing) {
    console.error(
      `  - ${item.label}/${item.name}.ts → manca __tests__/${item.label}/${item.name}.test.ts`,
    );
  }
  console.error(
    'Tot fitxer a lib/services/, lib/utils/, lib/hooks/, lib/api/ i lib/admin/ ha de tenir un test a __tests__/ amb el mateix nom base.',
  );
  process.exit(1);
}

console.log(
  `[service-coverage] OK: ${totalSrc} fitxers verificats — tots tenen test corresponent.`,
);
