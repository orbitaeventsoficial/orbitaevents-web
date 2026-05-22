import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-inline-hex.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cihex-test-'));

  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }

  const result = spawnSync('node', [SCRIPT], {
    cwd: tmpDir,
    encoding: 'utf8',
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-inline-hex', () => {
  it('passa quan no hi ha hex literals als components admin', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        export function Widget() {
          return <div className="bg-cyan-500/20 text-white">OK</div>;
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('detecta un hex literal en un component admin', () => {
    const result = runGuard({
      'app/admin/page.tsx': `
        const series = [{ stroke: '#22d3ee', label: 'Sessions' }];
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('#22d3ee');
  });

  it('detecta hex en un Tailwind arbitrary value', () => {
    const result = runGuard({
      'app/admin/components/Modal.tsx': `
        <div className="bg-[#0b1117]/95 shadow-2xl" />
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('#0b1117');
  });

  it('no marca fitxers del canvas (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/canvas/CanvasEditorClient.tsx': `
        const defaultFill = '#06b6d4';
        const bgColor = '#0a0a0a';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca fitxers de email-templates (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/email-templates/[slug]/TemplateEditorClient.tsx': `
        const header = '<div style="background:#0f172a">Òrbita</div>';
        const accent = '#06b6d4';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca fitxers del css-manager (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/css-manager/page.tsx': `
        const theme = { surface: '#121417', panel: '#1f2329' };
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca ClientPortalAccessPanel (color picker)', () => {
    const result = runGuard({
      'app/admin/bookings/[id]/ClientPortalAccessPanel.tsx': `
        const [accent, setAccent] = useState('#06b6d4');
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca admin/layout.tsx (meta PWA theme-color)', () => {
    const result = runGuard({
      'app/admin/layout.tsx': `
        <meta name="theme-color" content="#121417" />
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca hex de 3 dígits (#abc)', () => {
    const result = runGuard({
      'app/admin/components/Chip.tsx': `
        // placeholder de canvi #462 aquí
        const x = 'OK';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions en fitxers diferents', () => {
    const result = runGuard({
      'app/admin/components/A.tsx': `const a = '#22d3ee';`,
      'app/admin/components/B.tsx': `const b = '#f472b6';`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('#22d3ee');
    expect(result.stderr).toContain('#f472b6');
  });
});
