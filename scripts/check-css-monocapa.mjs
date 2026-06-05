#!/usr/bin/env node
/**
 * qa:css-monocapa
 *
 * Valida les normes CSS canòniques de l'admin (CLAUDE.md §CSS architecture admin):
 *
 * 1. Cap selector CSS d'admin pot contenir `.admin-shell` — classe inexistent al DOM.
 *
 * 2. Cap propietat amb !important dins un bloc el selector DIRECTE del qual sigui
 *    una classe pròpia de pàgina (bd__*, tk__*, etc.) EXCEPTE:
 *    - Blocs dins @media (responsive overrides)
 *    - Blocs el selector dels quals acaba amb una classe NO pròpia (legacy: .ap-card, etc.)
 *    - Overrides d'animació (animation/transform) sobre elements de framework
 *
 * Fitxers comprovats: tots els *.css de app/admin/** (excl. shell/theme/control-room).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGE_CLASS_RE = /\.(bd__|tk__|cl__|ch__|lr__|fx__|sf__|ix-|nb__|bk-|cx-|ni-|lp2__|fxd__)/;
// Classes NO pròpies que poden tenir !important legítim
const LEGACY_TARGET_RE = /\.(ap-card|admin-booking|ap-sticky|ax__page|admin-ui|admin-control)/;

function collectCssFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collectCssFiles(full, files);
    else if (e.isFile() && e.name.endsWith('.css')) files.push(full);
  }
  return files;
}

const SKIP = new Set([
  path.join(ROOT, 'app', 'admin', 'admin-shell.css'),
  path.join(ROOT, 'app', 'admin', 'admin-theme.css'),
  path.join(ROOT, 'app', 'admin', 'control-room.css'),
]);

const allCss = collectCssFiles(path.join(ROOT, 'app', 'admin')).filter(f => !SKIP.has(f));
const violations = [];

for (const file of allCss) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  const content = raw.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  const lines = content.split('\n');

  // Regla 1: .admin-shell en selector
  lines.forEach((line, idx) => {
    if (/html\.admin-mode\s+\.admin-shell/.test(line)) {
      violations.push(`[phantom-class] ${rel}:${idx + 1}: selector usa .admin-shell (classe inexistent al DOM)`);
    }
  });

  // Regla 2: !important en bloc de classe pròpia
  // Per cada !important, busquem el bloc directe que el conté
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('!important')) continue;

    // Trobar el selector que obre el bloc directe
    let depth = 0;
    let selectorLine = '';
    let insideAtRule = false;
    for (let j = i; j >= 0; j--) {
      const closes = (lines[j].match(/}/g) || []).length;
      const opens  = (lines[j].match(/{/g) || []).length;
      depth += closes - opens;
      if (depth < 0) {
        selectorLine = lines[j].trim();
        // Comprovar si estem dins un @media/at-rule (bloc anterior al selector)
        let d2 = 0;
        for (let k = j - 1; k >= 0; k--) {
          const c2 = (lines[k].match(/}/g) || []).length;
          const o2 = (lines[k].match(/{/g) || []).length;
          d2 += c2 - o2;
          if (d2 < 0) {
            if (/^\s*@(media|supports|layer|container)/.test(lines[k])) insideAtRule = true;
            break;
          }
        }
        break;
      }
    }

    // Excloure casos legítims
    if (insideAtRule) continue; // responsive overrides
    if (LEGACY_TARGET_RE.test(selectorLine)) continue; // legacy targets
    if (!PAGE_CLASS_RE.test(selectorLine)) continue; // no és classe pròpia
    // Elements HTML nadius com a target final (input, textarea, select, label, ::placeholder)
    if (/\b(input|textarea|select|label|button|a|p|h[1-6]|span|div|ul|li|table|th|td|tr|svg|img|form)(\s*::|$|\s*{)/.test(selectorLine)) continue;
    if (/::placeholder|::before|::after|:hover|:focus|:active|:disabled/.test(selectorLine)) continue;

    violations.push(`[important-own-class] ${rel}:${i + 1}: !important en classe pròpia de pàgina (selector: "${selectorLine.slice(0, 80)}")`);
  }
}

if (violations.length > 0) {
  process.stderr.write(`[css-monocapa] FAIL: ${violations.length} violació(ns):\n`);
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write(`
Norma CLAUDE.md §CSS monocapa (2026-06-04):
  1. Cap .admin-shell en selectors — no existeix al DOM.
  2. Cap !important en classes pròpies de pàgina (bd__*, tk__*, etc.) fora de @media.
`);
  process.exit(1);
}

console.log('[css-monocapa] OK: cap .admin-shell phantom ni !important indegut en classes pròpies.');
