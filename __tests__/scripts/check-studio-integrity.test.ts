// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-studio-integrity.mjs');

const SECTION_IDS = [
  'marca', 'paleta', 'tipografia', 'spacing', 'iconografia', 'actius',
  'botons', 'inputs', 'cards', 'estats', 'alertes', 'responsive',
  'layout', 'veu', 'comunicacions', 'pdfs',
];

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

function makeStudio(root: string, tsx: string, css: string) {
  const dir = path.join(root, 'app', 'studio');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'StudioShowroom.tsx'), tsx);
  writeFileSync(path.join(dir, 'studio.css'), css);
}

function validTsx() {
  const tokens = ['PALETTE', 'TYPE_SCALE', 'ICONS', 'EMAIL_COMMS', 'PDF_DOCS', 'SECTIONS']
    .map((t) => `const ${t} = [];`).join('\n');
  const sections = SECTION_IDS
    .map((id) => `<section className="o-spec-section" id="sec-${id}"></section>`).join('\n');
  const filler = Array.from({ length: 420 }, (_, i) => `// linia ${i}`).join('\n');
  return `${tokens}\n${sections}\n${filler}\n`;
}

function validCss() {
  const head = '.o-spec-shell{}\n.o-spec-section{}\n.o-pdfdoc{}\n';
  return head + Array.from({ length: 3100 }, (_, i) => `/* ${i} */`).join('\n');
}

describe('check-studio-integrity', () => {
  it('passa amb el repo real (la fitxa tècnica reconstruïda)', () => {
    const result = run(process.cwd());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('check-studio-integrity');
  });

  it('falla si StudioShowroom.tsx no existeix', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-studio-'));
    const dir = path.join(root, 'app', 'studio');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'studio.css'), validCss());
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no existeix');
  });

  it('falla si el TSX està buidat a un wireframe', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-studio-'));
    makeStudio(root, 'export default function S(){ return <main>wireframe</main>; }\n', validCss());
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('check-studio-integrity');
  });

  it('falla si falta una secció', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-studio-'));
    const tsx = validTsx().replace('id="sec-pdfs"', 'id="sec-altres"');
    makeStudio(root, tsx, validCss());
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('pdfs');
  });

  it('falla si studio.css es buida', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-studio-'));
    makeStudio(root, validTsx(), '.o-spec-shell{}\n.o-spec-section{}\n.o-pdfdoc{}\n');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('studio.css');
  });

  it('passa amb un TSX i CSS sintètics complets', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-studio-'));
    makeStudio(root, validTsx(), validCss());
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('íntegre');
  });
});
