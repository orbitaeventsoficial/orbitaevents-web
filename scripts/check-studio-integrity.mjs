#!/usr/bin/env node
/**
 * qa:studio-integrity
 * ---------------------------------------------------------------------------
 * Blinda la fitxa tècnica del sistema visual (/studio) perquè no es pugui
 * "reventar": és la zona on un agent va buidar el component de 16 seccions a
 * un wireframe de 82 línies sense que res ho impedís (no estava ni a git).
 *
 * Aquest guard forma part de validate:core. Si algú redueix StudioShowroom.tsx
 * (esborra seccions, el deixa per sota del mínim) o buida studio.css, la
 * validació FALLA i el canvi no pot passar com a "fet".
 *
 * Norma: tota passa sobre /studio (prova o definitiva) ha de quedar a git i
 * documentada al diari amb número de canvi. Vegeu CLAUDE.md §Zones consolidades.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TSX = path.join(ROOT, 'app', 'studio', 'StudioShowroom.tsx');
const CSS = path.join(ROOT, 'app', 'studio', 'studio.css');
const TOKENS = path.join(ROOT, 'app', 'studio', 'orbita-tokens.css');

// Les 16 seccions canòniques de la fitxa tècnica v0.4 (id="sec-<id>").
const SECTION_IDS = [
  'marca', 'paleta', 'tipografia', 'spacing', 'iconografia', 'actius',
  'botons', 'inputs', 'cards', 'estats', 'alertes', 'responsive',
  'layout', 'veu', 'comunicacions', 'pdfs',
];

// Estructures de dades que han de seguir vives al component (contingut real).
const REQUIRED_TOKENS = ['PALETTE', 'TYPE_SCALE', 'ICONS', 'EMAIL_COMMS', 'PDF_DOCS', 'SECTIONS'];

// Mínims de superfície: per sota d'aquests valors el fitxer s'ha buidat.
const MIN_TSX_LINES = 400;
const MIN_CSS_LINES = 3000;
const MIN_SECTION_BLOCKS = 16;

const errors = [];

function read(file, label) {
  if (!fs.existsSync(file)) {
    errors.push(`${label} no existeix: ${path.relative(ROOT, file)}`);
    return null;
  }
  return fs.readFileSync(file, 'utf8');
}

const tsx = read(TSX, 'StudioShowroom.tsx');
const css = read(CSS, 'studio.css');
const tokens = read(TOKENS, 'orbita-tokens.css');

if (tsx) {
  const lines = tsx.split('\n').length;
  if (lines < MIN_TSX_LINES) {
    errors.push(`StudioShowroom.tsx té ${lines} línies (< ${MIN_TSX_LINES}). Sembla buidat/wireframitzat.`);
  }

  for (const id of SECTION_IDS) {
    if (!tsx.includes(`id="sec-${id}"`)) {
      errors.push(`Falta la secció "${id}" (id="sec-${id}") a StudioShowroom.tsx.`);
    }
  }

  const blocks = (tsx.match(/o-spec-section/g) || []).length;
  if (blocks < MIN_SECTION_BLOCKS) {
    errors.push(`Només ${blocks} usos de "o-spec-section" (< ${MIN_SECTION_BLOCKS} seccions esperades).`);
  }

  for (const token of REQUIRED_TOKENS) {
    if (!tsx.includes(token)) {
      errors.push(`Falta l'estructura de dades "${token}" a StudioShowroom.tsx.`);
    }
  }
}

if (css) {
  const lines = css.split('\n').length;
  if (lines < MIN_CSS_LINES) {
    errors.push(`studio.css té ${lines} línies (< ${MIN_CSS_LINES}). Sembla buidat.`);
  }
  for (const cls of ['.o-spec-shell', '.o-spec-section', '.o-pdfdoc']) {
    if (!css.includes(cls)) {
      errors.push(`Falta la classe ${cls} a studio.css.`);
    }
  }
}

if (tokens) {
  for (const token of ['--o-bg', '--o-admin-canvas', '--ax-canvas', '--canvas', '--gold', '--o-stage-new']) {
    if (!tokens.includes(token)) {
      errors.push(`Falta el token compartit "${token}" a orbita-tokens.css.`);
    }
  }
  for (const selector of ['.o-studio-root', '.ax-root', '.fx-root.is-contrast']) {
    if (!tokens.includes(selector)) {
      errors.push(`Falta el selector compartit "${selector}" a orbita-tokens.css.`);
    }
  }
}

if (errors.length > 0) {
  console.error('✗ check-studio-integrity: la fitxa tècnica /studio s\'ha degradat:\n');
  for (const e of errors) console.error(`  · ${e}`);
  console.error('\n/studio és zona protegida (CLAUDE.md §Zones consolidades). No la buidis.');
  console.error('Recupera-la des de git (git checkout app/studio/) i documenta tota passa al diari.');
  process.exit(1);
}

console.log(`✓ check-studio-integrity: /studio íntegre — ${SECTION_IDS.length} seccions, dades, CSS i tokens compartits presents.`);
