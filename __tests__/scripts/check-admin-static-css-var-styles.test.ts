import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-static-css-var-styles.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'casvcs-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-admin-static-css-var-styles', () => {
  it('passa quan usa Tailwind arbitrari text-[var(--at-text)]', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        <p className="text-sm text-[var(--at-text)]">{label}</p>
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta color: \'var(--at-text)\' en style={{}}', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        <p className="text-sm" style={{ color: 'var(--at-text)' }}>{label}</p>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('Widget.tsx');
  });

  it('detecta background: \'var(--at-surface)\' en style={{}}', () => {
    const result = runGuard({
      'app/admin/bookings/panel.tsx': `
        <div style={{ height: '1px', background: 'var(--at-border-sub)', margin: '0 1rem' }} />
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('detecta borderBottom amb var(--) en style={{}}', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
        <div style={{ borderBottom: '1px solid var(--at-border)' }}>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('detecta borderTop amb var(--) en style={{}}', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
        <div style={{ borderTop: '1px solid var(--at-border-sub)' }}>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('no detecta color condicional (ternari) en style={{}}', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
        <p style={{ color: paid ? 'var(--at-green)' : 'var(--at-text)' }}>{amount}</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no detecta background amb color-mix() en style={{}}', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
        <div style={{ background: 'color-mix(in oklab, var(--at-green) 14%, var(--at-panel) 86%)' }} />
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora comentaris de línia', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        // style={{ color: 'var(--at-text)' }}
        <p className="text-[var(--at-text)]">{label}</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de canvas (allowlist)', () => {
    const result = runGuard({
      'app/admin/canvas/CanvasEditor.tsx': `
        <div style={{ background: 'var(--at-surface)' }} />
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de email-templates (allowlist)', () => {
    const result = runGuard({
      'app/admin/email-templates/Editor.tsx': `
        <p style={{ color: 'var(--at-text)' }}>{text}</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard({
      'app/admin/bookings/panel.tsx': `
        <p style={{ color: 'var(--at-text)' }}>{label}</p>
        <p style={{ color: 'var(--at-subtle)' }}>{sublabel}</p>
      `,
      'app/admin/leads/page.tsx': `
        <div style={{ borderBottom: '1px solid var(--at-border)' }}>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('3 static CSS var style(s)');
  });
});
