import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-inline-rgba.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cirgba-test-'));

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

describe('check-inline-rgba', () => {
  it('passa quan no hi ha rgba literals als components admin', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        export function Widget() {
          return <div className="bg-cyan-500/20 text-white">OK</div>;
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('detecta un rgba literal en un component admin', () => {
    const result = runGuard({
      'app/admin/lib/dashboard-widgets.tsx': `
        <circle stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('rgba(');
  });

  it('detecta rgba en un atribut SVG stroke', () => {
    const result = runGuard({
      'app/admin/sales-ops/LossBreakdownPanel.tsx': `
        <path d="M8 64 H152" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('rgba(');
  });

  it('no marca expressions computades rgba(${r}, ${g}, ${b})', () => {
    const result = runGuard({
      'app/admin/lib/dashboard-widgets.tsx': `
        function strokeToFill(stroke: string) {
          const r = 255; const g = 255; const b = 255;
          return \`rgba(\${r}, \${g}, \${b}, 0.22)\`;
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca fitxers del canvas (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/canvas/CanvasEditorClient.tsx': `
        const color = 'rgba(255,255,255,0.1)';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca fitxers de email-templates (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/email-templates/[slug]/TemplateEditorClient.tsx': `
        const header = '<div style="color:rgba(255,255,255,0.6)">text</div>';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca fitxers del css-manager (excepció tècnica)', () => {
    const result = runGuard({
      'app/admin/css-manager/page.tsx': `
        const overlay = 'rgba(0,0,0,0.5)';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca ClientPortalAccessPanel (color picker)', () => {
    const result = runGuard({
      'app/admin/bookings/[id]/ClientPortalAccessPanel.tsx': `
        const accent = 'rgba(6,182,212,0.8)';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no marca admin/layout.tsx', () => {
    const result = runGuard({
      'app/admin/layout.tsx': `
        <meta name="theme-color" content="rgba(18,20,23,1)" />
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions en fitxers diferents', () => {
    const result = runGuard({
      'app/admin/components/A.tsx': `const a = 'rgba(255,255,255,0.06)';`,
      'app/admin/components/B.tsx': `const b = 'rgba(34,211,238,0.95)';`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('A.tsx');
    expect(result.stderr).toContain('B.tsx');
  });
});
