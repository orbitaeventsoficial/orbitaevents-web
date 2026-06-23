#!/usr/bin/env node
/**
 * canonize-admin-css — afegeix el prefix canònic `html.admin-mode` als selectors
 * d'un CSS admin que no el tenen, amb un parser CSS real (postcss) per no fer
 * malbé comentaris, at-rules ni el format.
 *
 * Per què no trenca el render: prefixa TOTS els selectors del fitxer per igual →
 * l'especificitat puja uniformement i l'ordre intern es manté. L'únic efecte
 * intencionat és que les regles deixin de competir a baixa especificitat amb
 * altres fitxers (el bug del «CSS que es barreja» entre pantalles admin).
 *
 * Preserva: @keyframes (els steps no es toquen), selectors ja prefixats, i tot
 * el format/comentaris (postcss). Transforma els selectors dins @media/@supports.
 *
 * Ús: node scripts/canonize-admin-css.mjs <fitxer.css> [--dry]
 */
import fs from 'node:fs';
import postcss from 'postcss';

const PREFIX = 'html.admin-mode';

function insideKeyframes(rule) {
  let p = rule.parent;
  while (p) {
    if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true;
    p = p.parent;
  }
  return false;
}

function canonize(src) {
  const root = postcss.parse(src);
  root.walkRules((rule) => {
    if (insideKeyframes(rule)) return;
    rule.selectors = rule.selectors.map((sel) => {
      const s = sel.trim();
      if (s.length === 0) return sel;
      if (s.startsWith(PREFIX)) return sel;       // ja canònic
      if (/^(from|to|\d+%)$/i.test(s)) return sel; // step (defensiu)
      return `${PREFIX} ${s}`;
    });
  });
  return root.toString();
}

const file = process.argv[2];
if (!file) { console.error('Ús: canonize-admin-css.mjs <fitxer.css> [--dry]'); process.exit(2); }
const src = fs.readFileSync(file, 'utf8');
const result = canonize(src);
if (process.argv.includes('--dry')) { process.stdout.write(result); }
else { fs.writeFileSync(file, result); console.log(`canonitzat: ${file}`); }
