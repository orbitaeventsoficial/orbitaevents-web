// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-css-monocapa.mjs');

function runGuard(files: Record<string, string>) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'monocapa-'));
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(tmp, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  const r = spawnSync('node', [SCRIPT], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

describe('check-css-monocapa', () => {
  it('FALLA amb el selector phantom .admin-shell (classe inexistent al DOM)', () => {
    const r = runGuard({
      'app/admin/x/x.css': 'html.admin-mode .admin-shell .foo { color: red; }',
    });
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toMatch(/admin-shell|phantom/i);
  });

  it('FALLA amb !important en una classe pròpia de pàgina (fxd__)', () => {
    const r = runGuard({
      'app/admin/x/x.css': 'html.admin-mode .fxd__panel {\n  color: red !important;\n}\n',
    });
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toMatch(/important/i);
  });

  it('PASSA amb CSS net (classe pròpia, sense !important)', () => {
    const r = runGuard({
      'app/admin/x/x.css': 'html.admin-mode .fxd__panel { color: var(--t); }',
    });
    expect(r.status).toBe(0);
  });
});
