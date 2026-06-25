#!/usr/bin/env node
// Guard: detecta tokens CSS fantasma a l'admin — `var(--x)` usats SENSE fallback
// que no estan definits en cap CSS i no s'injecten en runtime.
// Origen: Canvis #1168 (--o-stage-done) i #1169 (--o-space-*/--o-gold/--muted),
// bugs visuals reals que cap guard caçava (l'estil simplement no s'aplicava).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Variables CSS injectades per next/font en runtime sobre <html> (no viuen al CSS).
const RUNTIME_FONT_VARS = new Set([
  '--font-inter',
  '--font-display',
  '--font-plex-mono',
  '--font-bricolage',
  '--font-manrope',
]);

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function walkCss(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkCss(p, acc);
    else if (e.name.endsWith('.css')) acc.push(p);
  }
  return acc;
}

/**
 * @param {string[]} allCssFiles - tots els CSS on es poden DEFINIR tokens
 * @param {string[]} adminCssFiles - CSS d'admin on es busquen USOS
 * @returns {{token:string, locations:string[]}[]} bugs reals (sense fallback)
 */
export function findPhantomTokens(allCssFiles, adminCssFiles, root = process.cwd()) {
  const defined = new Set();
  const runtimeInjected = new Set(RUNTIME_FONT_VARS);

  for (const f of allCssFiles) {
    const raw = fs.readFileSync(f, 'utf8');
    const css = stripCssComments(raw);
    for (const m of css.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
    // tokens injectats via style inline: selector `[style*="--token"]`
    for (const m of css.matchAll(/\[style\*=["']?(--[\w-]+)/g)) runtimeInjected.add(m[1]);
  }

  const phantom = new Map(); // token -> locations[] (només usos sense fallback)
  for (const f of adminCssFiles) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    let inComment = false;
    lines.forEach((line, i) => {
      // saltar línies dins de comentaris multi-línia
      let scan = line;
      if (inComment) {
        const end = scan.indexOf('*/');
        if (end === -1) return;
        scan = scan.slice(end + 2);
        inComment = false;
      }
      scan = scan.replace(/\/\*[\s\S]*?\*\//g, '');
      const open = scan.indexOf('/*');
      if (open !== -1) { inComment = true; scan = scan.slice(0, open); }

      for (const m of scan.matchAll(/var\(\s*(--[\w-]+)\s*(,)?/g)) {
        const tok = m[1];
        const hasFallback = m[2] === ',';
        if (hasFallback) continue;
        if (defined.has(tok) || runtimeInjected.has(tok)) continue;
        if (!phantom.has(tok)) phantom.set(tok, []);
        phantom.get(tok).push(`${path.relative(root, f)}:${i + 1}`);
      }
    });
  }

  return [...phantom.entries()].map(([token, locations]) => ({ token, locations }));
}

function main() {
  const root = process.cwd();
  const allCss = walkCss(path.join(root, 'app'));
  // Cobertura: tot el CSS del repo (admin + front públic) EXCEPTE la fitxa tècnica
  // protegida `studio.css` (té règim propi via qa:studio-integrity i deute conegut).
  const targetCss = allCss.filter((f) => !f.endsWith(`${path.sep}studio.css`));
  const bugs = findPhantomTokens(allCss, targetCss, root);

  if (bugs.length === 0) {
    console.log('[no-phantom-tokens] OK — cap token CSS fantasma sense fallback (admin + front públic).');
    return;
  }

  console.error(
    `[no-phantom-tokens] ${bugs.length} token(s) fantasma SENSE fallback (l'estil no s'aplica):\n`,
  );
  for (const { token, locations } of bugs.sort((a, b) => b.locations.length - a.locations.length)) {
    console.error(`  ${token} — ${locations.length} ús(os)`);
    console.error(`      ${locations.slice(0, 5).join(', ')}${locations.length > 5 ? ' …' : ''}`);
  }
  console.error(
    '\n  Defineix el token a app/studio/orbita-tokens.css, corregeix el nom al canònic existent, o afegeix-hi un fallback.',
  );
  process.exit(1);
}

// Executar només si és el mòdul principal (no en importar des del test).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
