#!/usr/bin/env node
// One-time script to fix broken emoji mojibake in lib/constants/index.ts
import { readFileSync, writeFileSync } from 'fs';

const filePath = 'lib/constants/index.ts';
let content = readFileSync(filePath, 'utf8');
const before = content;

// Get hex representation of each line to find exact broken bytes
const lines = content.split('\n');

// Fix by line number (1-indexed) with exact replacements
const lineFixMap = {
  // WEDDING ring 💍 — codepoints: U+00F0 U+0178 U+2019 U+008D
  105: [/\u00F0\u0178\u2019\u008D Casament/, '💍 Casament'],
  118: [/\u00F0\u0178\u2019\u008D/, '💍'],
  // SOURCE_ICONS — already fixed by first pass
  // LEAD_STATUS_ACTION_OPTIONS
  // ❌ = U+00E2 U+009D U+0152
  675: [/\u00E2\u009D\u0152/, '❌'],
  // INVENTORY_CATEGORY_LABELS — 🏗️ = U+00F0 U+0178 U+008F U+2014 U+00EF U+00B8 U+008F
  751: [/\u00F0\u0178\u008F\u2014\u00EF\u00B8\u008F/, '🏗️'],
  // SETTINGS icons — 🏢 = U+00F0 U+0178 U+008F U+00A2
  785: [/\u00F0\u0178\u008F\u00A2/, '🏢'],
  // INTAKE_EVENT_TYPE_OPTIONS — 💍 same pattern as 105
  868: [/\u00F0\u0178\u2019\u008D/, '💍'],
  // INVENTORY_CATEGORY_OPTIONS — 🏗️ same pattern as 751
  890: [/\u00F0\u0178\u008F\u2014\u00EF\u00B8\u008F/, '🏗️'],
  // ACTIVITY_CATEGORY_OPTIONS — 📝 = U+00F0 U+0178 U+201C U+009D
  938: [/\u00F0\u0178\u201C\u009D/, '📝'],
};

let fixCount = 0;
const fixedLines = lines.map((line, i) => {
  const lineNum = i + 1;
  const fix = lineFixMap[lineNum];
  if (fix) {
    const [pattern, replacement] = fix;
    if (pattern.test(line)) {
      fixCount++;
      return line.replace(pattern, replacement);
    } else {
      console.log(`Line ${lineNum}: pattern NOT matched — ${line.trim().substring(0, 80)}`);
    }
  }
  return line;
});

const result = fixedLines.join('\n');

if (result !== before) {
  writeFileSync(filePath, result, 'utf8');
  console.log(`Fixed ${fixCount} lines with mojibake emojis.`);
} else {
  console.log('No changes made.');
}
