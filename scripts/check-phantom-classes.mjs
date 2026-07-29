#!/usr/bin/env node
// Guard: detecta classes BEM fantasma a l'admin — `className` LITERAL amb una classe
// BEM (`prefix__nom`) que no té cap regla `.classe {}` en cap CSS.
// Origen: Canvi #1173 (botó-void de ComposeForm + 5 variants nb__/bd__ sense regla),
// bugs visuals reals (l'estil no s'aplica) que cap guard caçava.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

/**
 * @param {string[]} cssFiles - CSS on es DEFINEIXEN classes
 * @param {string[]} tsxFiles - TSX d'admin on es busquen USOS
 * @returns {{className:string, locations:string[]}[]}
 */
export function findPhantomClasses(cssFiles, tsxFiles, root = process.cwd()) {
  const defined = new Set();
  for (const f of cssFiles) {
    const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/\.([a-zA-Z][\w-]*(?:__[\w-]+)?(?:--[\w-]+)?)/g)) {
      defined.add(m[1]);
    }
  }

  const used = new Map(); // class -> locations[]
  for (const f of tsxFiles) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`$]*)`\}|\{'([^']*)'\})/g)) {
        const raw = m[1] ?? m[2] ?? m[3] ?? '';
        for (const cls of raw.split(/\s+/)) {
          if (!cls.includes('__')) continue; // només BEM local (ignora Tailwind/utils)
          if (/[${}()[\]]/.test(cls)) continue; // interpolacions / dinàmiques
          if (!used.has(cls)) used.set(cls, []);
          used.get(cls).push(`${path.relative(root, f)}:${i + 1}`);
        }
      }
    });
  }

  const phantom = [];
  for (const [cls, locs] of used) {
    if (!defined.has(cls)) phantom.push({ className: cls, locations: locs });
  }
  return phantom;
}

function main() {
  const root = process.cwd();
  const cssFiles = walk(path.join(root, 'app'), ['.css']);
  // Cobertura: admin + front públic (app/ + components/) EXCEPTE la fitxa tècnica
  // protegida app/studio (règim propi via qa:studio-integrity i deute conegut).
  const studioDir = `${path.sep}studio${path.sep}`;
  const tsxFiles = [
    ...walk(path.join(root, 'app'), ['.tsx']),
    ...walk(path.join(root, 'components'), ['.tsx']),
  ].filter((f) => !f.includes(studioDir));
  const phantom = findPhantomClasses(cssFiles, tsxFiles, root);

  if (phantom.length === 0) {
    console.log('[no-phantom-classes] OK — cap classe BEM fantasma (admin + front públic).');
    return;
  }

  console.error(
    `[no-phantom-classes] ${phantom.length} classe(s) BEM usades al TSX admin SENSE regla CSS (l'estil no s'aplica):\n`,
  );
  for (const { className, locations } of phantom.sort((a, b) => b.locations.length - a.locations.length)) {
    console.error(`  .${className} — ${locations.length} ús(os)`);
    console.error(`      ${locations.slice(0, 5).join(', ')}${locations.length > 5 ? ' …' : ''}`);
  }
  console.error('\n  Defineix la regla `.classe {}` al CSS corresponent o usa una classe canònica existent.');
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
