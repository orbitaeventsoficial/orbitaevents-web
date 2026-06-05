#!/usr/bin/env node
/**
 * Substitueix valors hardcoded als CSS d'admin pels tokens canònics de Studio.
 * Usage: node scripts/migrate-css-to-tokens.mjs [fitxer.css ...]
 * Sense arguments: processa tots els CSS admin (excl. shell/theme/control-room).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ─── Taula de substitució ────────────────────────────────────────────────────
// L'ordre importa: valors més específics primer (rgba exacta abans que hex).
const SUBSTITUTIONS = [
  // ── Superfícies (hex) ───────────────────────────────────────────────────
  [/#0a0a0c\b/gi,   'var(--ax-canvas)'],
  [/#09090b\b/gi,   'var(--ax-canvas)'],
  [/#07070a\b/gi,   'var(--ax-canvas)'],
  [/#0d0d10\b/gi,   'var(--ax-side)'],
  [/#131318\b/gi,   'var(--ax-panel)'],
  [/#141519\b/gi,   'var(--ax-panel)'],
  [/#1d1e25\b/gi,   'var(--ax-raised)'],
  [/#202127\b/gi,   'var(--ax-raised)'],
  [/#252638\b/gi,   'var(--ax-elevated)'],
  [/#222336\b/gi,   'var(--ax-elevated)'],
  [/#08080a\b/gi,   'var(--ax-sunk)'],
  [/#070709\b/gi,   'var(--ax-sunk)'],
  [/#10100f\b/gi,   'var(--ax-sunk)'],

  // ── Textos (hex) ────────────────────────────────────────────────────────
  [/#ece7df\b/gi,   'var(--ax-t)'],
  [/#ccc8c2\b/gi,   'var(--ax-t)'],
  [/#f1ece4\b/gi,   'var(--ax-t)'],
  [/#b6aea2\b/gi,   'var(--ax-t2)'],
  [/#948e86\b/gi,   'var(--ax-t2)'],
  [/#837c70\b/gi,   'var(--ax-t3)'],
  [/#635e58\b/gi,   'var(--ax-t3)'],

  // ── Gold (hex) ──────────────────────────────────────────────────────────
  [/#f0d99a\b/gi,   'var(--ax-gold-bright)'],
  [/#a9863f\b/gi,   'var(--ax-gold-edge)'],
  [/#b97935\b/gi,   'var(--ax-gold-edge)'],
  [/#b8923f\b/gi,   'var(--ax-gold-edge)'],
  [/#2a210e\b/gi,   'var(--ax-gold-ink)'],
  [/#d7b86e\b/gi,   'var(--ax-gold)'],
  [/#d0ad62\b/gi,   'var(--ax-gold)'],
  [/#d4a857\b/gi,   'var(--ax-gold)'],
  [/#c9a84c\b/gi,   'var(--ax-gold)'],
  [/#c8a84b\b/gi,   'var(--ax-gold)'],
  [/#c4a455\b/gi,   'var(--ax-gold)'],

  // ── Status (hex) ────────────────────────────────────────────────────────
  [/#3ec57b\b/gi,   'var(--o-success)'],
  [/#35c878\b/gi,   'var(--o-success)'],
  [/#27ae60\b/gi,   'var(--o-success)'],
  [/#22a65f\b/gi,   'var(--o-success)'],
  [/#3fa06a\b/gi,   'var(--o-stage-won)'],
  [/#1f7a4c\b/gi,   'var(--o-stage-won-strong)'],
  [/#e2596a\b/gi,   'var(--o-danger)'],
  [/#e05252\b/gi,   'var(--o-danger)'],
  [/#e05a4a\b/gi,   'var(--o-danger)'],
  [/#c0392b\b/gi,   'var(--o-danger)'],
  [/#e8a93a\b/gi,   'var(--o-warning)'],
  [/#e0922b\b/gi,   'var(--o-stage-new)'],
  [/#e8932a\b/gi,   'var(--o-stage-new)'],
  [/#d08f45\b/gi,   'var(--o-stage-new)'],
  [/#b45309\b/gi,   'var(--o-stage-new-strong)'],
  [/#5fb7e8\b/gi,   'var(--o-info)'],
  [/#5bc0de\b/gi,   'var(--o-info)'],
  [/#4db6f0\b/gi,   'var(--o-info)'],
  [/#9d83c2\b/gi,   'var(--o-stage-contacted)'],
  [/#86a0bd\b/gi,   'var(--o-stage-contacted)'],
  [/#6a4f9c\b/gi,   'var(--o-stage-contacted-strong)'],
  [/#6f8aa6\b/gi,   'var(--o-stage-contacted-strong)'],
  [/#8a817a\b/gi,   'var(--o-stage-lost)'],
  [/#7b7770\b/gi,   'var(--o-stage-lost)'],
  [/#5e5952\b/gi,   'var(--o-stage-lost-strong)'],
  [/#5d564f\b/gi,   'var(--o-stage-lost-strong)'],

  // ── Overlays canvas (rgba amb 10,10,12) ─────────────────────────────────
  [/rgba\(\s*10\s*,\s*10\s*,\s*12\s*,\s*0\.8[0-9]+\s*\)/gi, 'var(--ax-overlay-sm)'],
  [/rgba\(\s*10\s*,\s*10\s*,\s*12\s*,\s*0\.9[0-9]+\s*\)/gi, 'var(--ax-overlay-md)'],
  [/rgba\(\s*10\s*,\s*10\s*,\s*12\s*,\s*1?\s*\)/gi,          'var(--ax-canvas)'],

  // ── Overlays negres purs ─────────────────────────────────────────────────
  [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:0\.3[0-9]+|\.3[0-9]+)\s*\)/gi, 'var(--ax-overlay-lg)'],
  [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:0\.[5-9][0-9]*|1\.?0?)\s*\)/gi, 'var(--ax-overlay-xl)'],

  // ── Fills (rgba blancs/càlids) ───────────────────────────────────────────
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.0[12]\s*\)/gi,  'var(--ax-fill-1)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.0[34]\s*\)/gi,  'var(--ax-fill-2)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.0[56]\s*\)/gi,  'var(--ax-fill-3)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.0[78]\s*\)/gi,  'var(--ax-fill-4)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.1[0-5]\s*\)/gi, 'var(--ax-fill-5)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.20?\s*\)/gi,    'var(--ax-line2)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.2[1-9]\s*\)/gi, 'var(--ax-line3)'],
  [/rgba\(\s*236\s*,\s*233\s*,\s*227\s*,\s*0\.10?\s*\)/gi,    'var(--ax-line)'],
  // rgba 255,255,255 variants — aproximem a fills
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.01[0-9]?\s*\)/gi, 'var(--ax-fill-1)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.02[0-9]?\s*\)/gi, 'var(--ax-fill-1)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.03[0-9]?\s*\)/gi, 'var(--ax-fill-2)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.04[0-9]?\s*\)/gi, 'var(--ax-fill-2)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05[0-9]?\s*\)/gi, 'var(--ax-fill-3)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.06[0-9]?\s*\)/gi, 'var(--ax-fill-3)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.07[0-9]?\s*\)/gi, 'var(--ax-fill-4)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08[0-9]?\s*\)/gi, 'var(--ax-fill-4)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.09[0-9]?\s*\)/gi, 'var(--ax-fill-4)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1[0-2]\s*\)/gi,   'var(--ax-fill-5)'],

  // ── Gold semitransparent ─────────────────────────────────────────────────
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.0[3-7]\s*\)/gi,  'var(--ax-gold-tint-1)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.0[89]\s*\)/gi,   'var(--ax-gold-tint-1)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.1[0-5]\s*\)/gi,  'var(--ax-gold-tint-2)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.1[6-9]\s*\)/gi,  'var(--ax-gold-tint-2)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.2[0-5]\s*\)/gi,  'var(--ax-gold-tint-3)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.3[0-9]\s*\)/gi,  'var(--ax-gold-tint-4)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.4[0-9]\s*\)/gi,  'var(--ax-gold-tint-5)'],
  [/rgba\(\s*215\s*,\s*184\s*,\s*110\s*,\s*0\.5[0-9]\s*\)/gi,  'var(--ax-gold-tint-5)'],

  // ── Estat success ─────────────────────────────────────────────────────────
  [/rgba\(\s*62\s*,\s*197\s*,\s*123\s*,\s*0\.[012][0-9]*\s*\)/gi, 'var(--ax-success-bg)'],
  [/rgba\(\s*62\s*,\s*197\s*,\s*123\s*,\s*0\.[23][0-9]*\s*\)/gi,  'var(--ax-success-border)'],
  [/rgba\(\s*62\s*,\s*197\s*,\s*123\s*,\s*0\.[4-9]\s*\)/gi,       'var(--o-success)'],

  // ── Estat warning ─────────────────────────────────────────────────────────
  [/rgba\(\s*232\s*,\s*169\s*,\s*58\s*,\s*0\.[012][0-9]*\s*\)/gi, 'var(--ax-warning-bg)'],
  [/rgba\(\s*232\s*,\s*169\s*,\s*58\s*,\s*0\.[23][0-9]*\s*\)/gi,  'var(--ax-warning-border)'],
  [/rgba\(\s*232\s*,\s*169\s*,\s*58\s*,\s*0\.[4-9]\s*\)/gi,       'var(--o-warning)'],

  // ── Estat danger ──────────────────────────────────────────────────────────
  [/rgba\(\s*226\s*,\s*89\s*,\s*106\s*,\s*0\.[012][0-9]*\s*\)/gi, 'var(--ax-danger-bg)'],
  [/rgba\(\s*226\s*,\s*89\s*,\s*106\s*,\s*0\.[23][0-9]*\s*\)/gi,  'var(--ax-danger-border)'],
  [/rgba\(\s*226\s*,\s*89\s*,\s*106\s*,\s*0\.[4-9]\s*\)/gi,       'var(--o-danger)'],

  // ── Estat info ────────────────────────────────────────────────────────────
  [/rgba\(\s*95\s*,\s*183\s*,\s*232\s*,\s*0\.[012][0-9]*\s*\)/gi, 'var(--ax-info-bg)'],
  [/rgba\(\s*95\s*,\s*183\s*,\s*232\s*,\s*0\.[23][0-9]*\s*\)/gi,  'var(--ax-info-border)'],
  [/rgba\(\s*95\s*,\s*183\s*,\s*232\s*,\s*0\.[4-9]\s*\)/gi,       'var(--o-info)'],

  // ── VIP purple ────────────────────────────────────────────────────────────
  [/rgba\(\s*167\s*,\s*139\s*,\s*250\s*,\s*0\.[01][0-9]*\s*\)/gi, 'var(--ax-vip-soft)'],
  [/rgba\(\s*167\s*,\s*139\s*,\s*250\s*,\s*[^)]+\)/gi,             'var(--ax-vip)'],
  [/#a5b4fc\b/gi, 'var(--ax-vip)'],
  [/#c4b5fd\b/gi, 'var(--ax-vip)'],
  [/#dbd0ff\b/gi, 'var(--ax-vip-text)'],

  // ── Danger/warning/info al 40-60% ────────────────────────────────────────
  [/rgba\(\s*232\s*,\s*169\s*,\s*58\s*,\s*0\.[4-9][0-9]?\s*\)/gi,  'var(--ax-warning-strong)'],
  [/rgba\(\s*226\s*,\s*89\s*,\s*106\s*,\s*0\.[4-9][0-9]?\s*\)/gi,  'var(--ax-danger-strong)'],
  [/rgba\(\s*95\s*,\s*183\s*,\s*232\s*,\s*0\.[4-9][0-9]?\s*\)/gi,  'var(--ax-info-strong)'],
  [/rgba\(\s*62\s*,\s*197\s*,\s*123\s*,\s*0\.[4-9][0-9]?\s*\)/gi,  'var(--ax-success-strong)'],
  // Danger reds alternatius
  [/rgba\(\s*244\s*,\s*92\s*,\s*92\s*,\s*[^)]+\)/gi,  'var(--ax-danger-border)'],

  // ── Text colors en superfície d'estat ─────────────────────────────────────
  [/rgba\(\s*253\s*,\s*192\s*,\s*198\s*,\s*[^)]+\)/gi,        'var(--ax-danger-text)'],
  [/rgba\(\s*255\s*,\s*220\s*,\s*150\s*,\s*[^)]+\)/gi,        'var(--ax-warning-text)'],

  // ── Colors d'estat de forma de text directe ───────────────────────────────
  [/#ffd8dd\b/gi, 'var(--ax-danger-text)'],
  [/#ffe0a0\b/gi, 'var(--ax-warning-text)'],
  [/#e57373\b/gi, 'var(--o-danger)'],
  [/#6fcf97\b/gi, 'var(--o-success)'],
  [/rgba\(\s*220\s*,\s*60\s*,\s*60\s*,\s*[^)]+\)/gi, 'var(--ax-danger-bg)'],

  // ── Fills addicionals alta opacitat ──────────────────────────────────────
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.14\s*\)/gi,          'var(--ax-fill-6)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.[2-9][0-9]?\s*\)/gi, 'var(--ax-fill-bright)'],
  // Indigo/violet (a5b4fc / 99,102,241 / 139,92,246)
  [/rgba\(\s*139\s*,\s*92\s*,\s*246\s*,\s*0\.[01][0-9]*\s*\)/gi,  'var(--ax-vip-soft)'],
  [/rgba\(\s*139\s*,\s*92\s*,\s*246\s*,\s*[^)]+\)/gi,              'var(--ax-vip)'],
  [/rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.[012][0-9]*\s*\)/gi, 'var(--ax-vip-soft)'],
  [/rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*[^)]+\)/gi,             'var(--ax-vip)'],

  // ── Overlays foscos restants (format sense 0 prefix) ─────────────────────
  [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*\.9\s*\)/gi,  'var(--ax-overlay-xl)'],
  [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*\.82\s*\)/gi, 'var(--ax-overlay-md)'],
  [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.18\s*\)/gi,'var(--ax-overlay-lg)'],
  [/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.24\s*\)/gi,'var(--ax-overlay-lg)'],

  // ── Warm white fills (leads theme rgba(246,243,234,...)) ──────────────────
  [/rgba\(\s*246\s*,\s*243\s*,\s*234\s*,\s*0\.1[0-5]\s*\)/gi, 'var(--ax-fill-5)'],
  [/rgba\(\s*246\s*,\s*243\s*,\s*234\s*,\s*0\.[01][0-9]*\s*\)/gi, 'var(--ax-line)'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1\s*\)/gi, 'var(--ax-fill-5)'],

  // ── Superfícies dark que no s'han capturat ────────────────────────────────
  [/#18181c\b/gi, 'var(--ax-panel)'],
  [/#111117\b/gi, 'var(--ax-panel)'],
  [/#1a1a2e\b/gi, 'var(--ax-raised)'],

  // ── Negre i blanc absoluts → tokens canònics ─────────────────────────────
  [/(?<![0-9a-fA-F])#000\b/g, 'var(--ax-ink)'],
  [/(?<![0-9a-fA-F])#fff\b/gi,'var(--ax-light)'],

  // ── Font sizes → tokens ──────────────────────────────────────────────────
  [/\bfont-size:\s*9(?:\.5)?px/gi,  'font-size: var(--o-text-micro)'],
  [/\bfont-size:\s*10(?:\.5)?px/gi, 'font-size: var(--o-text-micro)'],
  [/\bfont-size:\s*11(?:\.(?:5|7|8))?px/gi, 'font-size: var(--o-text-xs)'],
  [/\bfont-size:\s*12(?:\.5)?px/gi, 'font-size: var(--o-text-2xs)'],
  [/\bfont-size:\s*13(?:\.5)?px/gi, 'font-size: var(--o-text-sm)'],
  [/\bfont-size:\s*14(?:\.8)?px/gi, 'font-size: var(--o-text-base)'],
  [/\bfont-size:\s*15(?:\.(?:5|8))?px/gi, 'font-size: var(--o-text-md)'],
  [/\bfont-size:\s*16px/gi,         'font-size: var(--o-text-md-2)'],
  [/\bfont-size:\s*17px/gi,         'font-size: var(--o-text-md-2)'],
  [/\bfont-size:\s*18px/gi,         'font-size: var(--o-text-lg)'],
  [/\bfont-size:\s*19px/gi,         'font-size: var(--o-text-lg)'],
  [/\bfont-size:\s*20px/gi,         'font-size: var(--o-text-lg)'],
  [/\bfont-size:\s*22px/gi,         'font-size: var(--o-text-xl)'],
  [/\bfont-size:\s*24px/gi,         'font-size: var(--o-text-xl-2)'],
  [/\bfont-size:\s*25px/gi,         'font-size: var(--o-text-xl-2)'],
  [/\bfont-size:\s*26px/gi,         'font-size: var(--o-text-xl-2)'],
  [/\bfont-size:\s*27px/gi,         'font-size: var(--o-text-xl-2)'],
  [/\bfont-size:\s*28px/gi,         'font-size: var(--o-text-xl-2)'],
  [/\bfont-size:\s*30px/gi,         'font-size: var(--o-text-2xl)'],
  [/\bfont-size:\s*32px/gi,         'font-size: var(--o-text-2xl)'],
  [/\bfont-size:\s*34px/gi,         'font-size: var(--o-text-2xl)'],
  [/\bfont-size:\s*36px/gi,         'font-size: var(--o-text-3xl)'],
  [/\bfont-size:\s*52px/gi,         'font-size: var(--o-text-3xl)'],

  // ── Border-radius → tokens ───────────────────────────────────────────────
  [/\bborder-radius:\s*2px/gi,   'border-radius: var(--o-r-xs)'],
  [/\bborder-radius:\s*3px/gi,   'border-radius: var(--o-r-xs)'],
  [/\bborder-radius:\s*4px/gi,   'border-radius: var(--o-r-xs)'],
  [/\bborder-radius:\s*5px/gi,   'border-radius: var(--o-r-xs)'],
  [/\bborder-radius:\s*6px/gi,   'border-radius: var(--o-r-sm)'],
  [/\bborder-radius:\s*7px/gi,   'border-radius: var(--o-r-sm)'],
  [/\bborder-radius:\s*8px/gi,   'border-radius: var(--o-r-sm-2)'],
  [/\bborder-radius:\s*9px/gi,   'border-radius: var(--o-r-sm-2)'],
  [/\bborder-radius:\s*10px/gi,  'border-radius: var(--o-r-md)'],
  [/\bborder-radius:\s*11px/gi,  'border-radius: var(--o-r-md)'],
  [/\bborder-radius:\s*12px/gi,  'border-radius: var(--o-r-md-2)'],
  [/\bborder-radius:\s*13px/gi,  'border-radius: var(--o-r-md-2)'],
  [/\bborder-radius:\s*14px/gi,  'border-radius: var(--o-r-lg)'],
  [/\bborder-radius:\s*15px/gi,  'border-radius: var(--o-r-lg)'],
  [/\bborder-radius:\s*16px/gi,  'border-radius: var(--o-r-lg)'],
  [/\bborder-radius:\s*20px/gi,  'border-radius: var(--o-r-xl)'],
  [/\bborder-radius:\s*99px/gi,  'border-radius: var(--o-r-pill)'],
  [/\bborder-radius:\s*999px/gi, 'border-radius: var(--o-r-pill)'],
  [/\bborder-radius:\s*9999px/gi,'border-radius: var(--o-r-pill)'],
];

// ─── Fitxers a processar ──────────────────────────────────────────────────────
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
  path.join(ROOT, 'app', 'studio', 'orbita-tokens.css'), // source of truth, no tocar
]);

const targets = process.argv.slice(2).length > 0
  ? process.argv.slice(2).map(f => path.resolve(ROOT, f))
  : collectCssFiles(path.join(ROOT, 'app', 'admin')).filter(f => !SKIP.has(f));

let totalReplaced = 0;

for (const file of targets) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let src = fs.readFileSync(file, 'utf8');
  let count = 0;

  // Aplicar substitucions fora de comentaris
  // Primer neutralitzem comentaris, substituïm, restaurem
  const comments = [];
  const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, m => {
    comments.push(m);
    return `/*COMMENT${comments.length - 1}*/`;
  });

  let result = withoutComments;
  for (const [pattern, replacement] of SUBSTITUTIONS) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) count++;
  }

  // Restaurar comentaris
  result = result.replace(/\/\*COMMENT(\d+)\*\//g, (_, i) => comments[Number(i)]);

  if (result !== src) {
    fs.writeFileSync(file, result);
    console.log(`✓ ${rel}: ${count} patrons substituïts`);
    totalReplaced += count;
  } else {
    console.log(`  ${rel}: sense canvis`);
  }
}

console.log(`\nTotal patrons substituïts: ${totalReplaced}`);
