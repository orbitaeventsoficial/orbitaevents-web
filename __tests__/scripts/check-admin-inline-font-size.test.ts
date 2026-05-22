// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-inline-font-size.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caifs2-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-admin-inline-font-size', () => {
  it('passa quan usa classe Tailwind text-xs', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        <span className="text-xs font-mono">{value}</span>
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta fontSize string en style={{}}', () => {
    const result = runGuard({
      'app/admin/bookings/panel.tsx': `
        <button className="ap-btn" style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }}>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('panel.tsx');
  });

  it('detecta fontSize numèric en style={{}}', () => {
    const result = runGuard({
      'app/admin/leads/page.tsx': `
        <span style={{ fontSize: 11 }}>{id}</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('no detecta fontSize dinàmic (variable)', () => {
    const result = runGuard({
      'app/admin/leads/page.tsx': `
        <span style={{ fontSize: dynamicSize }}>{id}</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora comentaris de línia', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        // style={{ fontSize: '0.7rem' }}
        <span className="text-[0.7rem]">{value}</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de canvas (allowlist)', () => {
    const result = runGuard({
      'app/admin/canvas/CanvasEditor.tsx': `
        <span style={{ fontSize: '14px' }}>{label}</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de email-templates (allowlist)', () => {
    const result = runGuard({
      'app/admin/email-templates/Editor.tsx': `
        <p style={{ fontSize: '16px' }}>{text}</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard({
      'app/admin/bookings/panel.tsx': `
        <a style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }}>Obrir</a>
        <button style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }}>Copiar</button>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('2 inline fontSize');
  });
});
