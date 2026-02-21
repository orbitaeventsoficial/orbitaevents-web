import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'app', 'config', 'packs-config.ts');

const replacements = [
  {
    from: /configurator\.pages\.parties\.discoPacks\./g,
    to: 'services.mobile.discoPacks.',
  },
  {
    from: /pages\.parties\.discoPacks\./g,
    to: 'services.mobile.discoPacks.',
  },
];

function main() {
  if (!fs.existsSync(filePath)) {
    console.error(`[fix-packs-i18n] No existeix: ${filePath}`);
    process.exit(1);
  }

  const original = fs.readFileSync(filePath, 'utf8');
  let next = original;
  let total = 0;

  for (const rule of replacements) {
    const before = next;
    next = next.replace(rule.from, rule.to);
    if (before !== next) {
      const count = (before.match(rule.from) || []).length;
      total += count;
    }
  }

  if (next !== original) {
    fs.writeFileSync(filePath, next, 'utf8');
    console.log(`[fix-packs-i18n] Autofix aplicat. Reemplaçaments: ${total}`);
  } else {
    console.log('[fix-packs-i18n] Cap canvi necessari.');
  }
}

main();

