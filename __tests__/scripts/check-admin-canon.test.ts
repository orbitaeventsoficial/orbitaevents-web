// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-admin-canon.mjs');

function runGuard(files: Record<string, string>, args: string[] = ['--strict']) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'canon-'));
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(tmp, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  const r = spawnSync('node', [SCRIPT, ...args], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

describe('check-admin-canon', () => {
  it('FALLA amb --strict davant un botó-void (text-white + padding sense fons)', () => {
    const r = runGuard({
      'app/admin/x/page.tsx': '<button className="rounded px-3 py-2 text-white">Desa</button>',
    });
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/void|P1/i);
  });

  it('FALLA amb blau de superfície (canon = carbó+or)', () => {
    const r = runGuard({
      'app/admin/x/page.tsx': '<div className="bg-blue-500">x</div>',
    });
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/blau|P1/i);
  });

  it('FALLA amb blanc absolut (bg-white sòlid)', () => {
    const r = runGuard({
      'app/admin/x/page.tsx': '<div className="bg-white">x</div>',
    });
    expect(r.status).not.toBe(0);
  });

  it('PASSA amb un botó canònic (.ap-btn) i superfície de token', () => {
    const r = runGuard({
      'app/admin/x/page.tsx': '<button className="ap-btn ap-btn--primary">Desa</button>',
    });
    expect(r.status).toBe(0);
  });
});
