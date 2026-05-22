import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-inline-font-styles.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'caifs-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-admin-inline-font-styles', () => {
  it('passa quan usa font-mono Tailwind', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        <span className="text-xl font-bold font-mono">{value}</span>
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta fontFamily en style={{}}', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{value}</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
    expect(result.stderr).toContain('Widget.tsx');
  });

  it('detecta fontVariantNumeric en style={{}}', () => {
    const result = runGuard({
      'app/admin/page.tsx': `
        <p style={{ fontVariantNumeric: 'tabular-nums' }}>{amount}</p>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('FAIL');
  });

  it('ignora comentaris de línia', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        // style={{ fontFamily: 'var(--font-mono, monospace)' }}
        <span className="font-mono">{value}</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de canvas (allowlist)', () => {
    const result = runGuard({
      'app/admin/canvas/CanvasEditorClient.tsx': `
        <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{value}</span>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('ignora fitxers de email-templates (allowlist)', () => {
    const result = runGuard({
      'app/admin/email-templates/TemplateEditor.tsx': `
        <p style={{ fontFamily: 'Arial, sans-serif', fontVariantNumeric: 'normal' }}>{text}</p>
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard({
      'app/admin/bookings/page.tsx': `
        <p style={{ fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>{total}</p>
      `,
      'app/admin/leads/page.tsx': `
        <span style={{ fontFamily: 'monospace' }}>{id}</span>
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('2 inline font style(s)');
  });
});
