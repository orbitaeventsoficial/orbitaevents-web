#!/usr/bin/env node
/**
 * Automated Accessibility Fixes
 * Fixes color contrast and common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Color contrast fixes
const contrastFixes = {
  'text-white/30': 'text-white/50',
  'text-white/40': 'text-white/60',
  'placeholder-white/30': 'placeholder-white/50',
  'text-gray-400': 'text-gray-200',
  'text-gray-500': 'text-gray-300',
};

let totalFiles = 0;
let modifiedFiles = 0;
let totalFixes = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileFixCount = 0;

  // Apply contrast fixes
  for (const [oldClass, newClass] of Object.entries(contrastFixes)) {
    const regex = new RegExp(oldClass.replace('/', '\\/'), 'g');
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, newClass);
      modified = true;
      fileFixCount += matches.length;
      console.log(`  ✅ ${matches.length}x ${oldClass} → ${newClass}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    totalFixes += fileFixCount;
    console.log(`  📝 Modified: ${path.relative(rootDir, filePath)}\n`);
  }

  totalFiles++;
}

function scanDirectory(dir, depth = 0) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip certain directories
      if (file.startsWith('.') ||
          file === 'node_modules' ||
          file === '.next' ||
          file === 'dist' ||
          file === 'build') {
        continue;
      }
      scanDirectory(filePath, depth + 1);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fixFile(filePath);
    }
  }
}

console.log('🔍 Scanning for accessibility issues...\n');
console.log('📂 Directories: app/, components/\n');

scanDirectory(path.join(rootDir, 'app'));
scanDirectory(path.join(rootDir, 'components'));

console.log('═'.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`  Total files scanned: ${totalFiles}`);
console.log(`  Files modified: ${modifiedFiles}`);
console.log(`  Total fixes applied: ${totalFixes}`);
console.log(`\n✅ Done!\n`);

if (modifiedFiles > 0) {
  console.log('💡 Tip: Review changes with `git diff` before committing\n');
}
