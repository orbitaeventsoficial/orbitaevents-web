// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SCRIPT = path.join(process.cwd(), 'scripts', 'check-phantom-classes.mjs');

function runGuard(files: Record<string, string>) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phantom-cls-'));
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(tmp, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  const r = spawnSync('node', [SCRIPT], { cwd: tmp, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

describe('check-phantom-classes', () => {
  it('CAÇA una classe BEM usada al TSX admin sense regla CSS', () => {
    const r = runGuard({
      'app/admin/foo.tsx': '<div className="bd__inexistent" />;',
      'app/admin/foo.css': 'html.admin-mode .bd__altra { color: red; }',
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('bd__inexistent');
  });

  it('NO marca una classe BEM amb regla CSS definida', () => {
    const r = runGuard({
      'app/admin/foo.tsx': '<div className="bd__real" />;',
      'app/admin/foo.css': 'html.admin-mode .bd__real { color: red; }',
    });
    expect(r.status).toBe(0);
  });

  it('NO marca classes Tailwind / utils (sense __)', () => {
    const r = runGuard({
      'app/admin/foo.tsx': '<div className="flex gap-2 text-white rounded-xl" />;',
      'app/admin/foo.css': 'html.admin-mode .x { color: red; }',
    });
    expect(r.status).toBe(0);
  });

  it('NO marca classes BEM construïdes dinàmicament (interpolació)', () => {
    const r = runGuard({
      'app/admin/foo.tsx': '<div className={`nb__sl-${type}`} />;',
      'app/admin/foo.css': 'html.admin-mode .x { color: red; }',
    });
    expect(r.status).toBe(0);
  });

  it('reconeix la classe definida en qualsevol CSS (no només el del costat)', () => {
    const r = runGuard({
      'app/admin/foo.tsx': '<div className="cx__btn" />;',
      'app/admin/inbox/inbox.css': 'html.admin-mode .cx__btn { color: red; }',
    });
    expect(r.status).toBe(0);
  });
});
