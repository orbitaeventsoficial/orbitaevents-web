// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-slate-gray.mjs');

function runGuard(files: Record<string, string>) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'casg-test-'));
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }
  const result = spawnSync('node', [SCRIPT], { cwd: tmpDir, encoding: 'utf8' });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  return result;
}

describe('check-admin-slate-gray', () => {
  it('passa quan usa white/opacity', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        const tone = 'border-white/15 bg-white/[0.06] text-white/60';
      `,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('detecta slate-N inline', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        const tone = 'border-slate-500/30 bg-slate-500/10 text-slate-300';
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('slate-');
    expect(result.stderr).toContain('Widget.tsx');
  });

  it('detecta gray-N inline', () => {
    const result = runGuard({
      'app/admin/text-manager/config.ts': `
        const color = 'from-gray-600 to-gray-800';
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('gray-');
  });

  it('ignora comentaris', () => {
    const result = runGuard({
      'app/admin/components/Widget.tsx': `
        // slate-500 antic — usar white/opacity
        const tone = 'text-white/60';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no escaneja fora de app/admin', () => {
    const result = runGuard({
      'app/[locale]/servicios/page.tsx': `
        const tone = 'text-slate-300';
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard({
      'app/admin/components/A.tsx': `const a = 'text-slate-300';`,
      'app/admin/components/B.tsx': `const b = 'bg-gray-800';`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('A.tsx');
    expect(result.stderr).toContain('B.tsx');
  });
});
