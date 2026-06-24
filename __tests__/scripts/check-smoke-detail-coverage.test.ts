// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, 'scripts', 'check-smoke-detail-coverage.mjs');

function run() {
  return spawnSync('node', [SCRIPT], { cwd: ROOT, encoding: 'utf8' });
}

describe('check-smoke-detail-coverage', () => {
  it('PASSA amb el repo actual (totes les rutes [param] cobertes)', () => {
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Totes les rutes \[param\]/);
  });

  it('FALLA quan apareix una ruta [param] nova sense cobertura', () => {
    const dir = path.join(ROOT, 'app', 'admin', 'covtmp', '[id]');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'page.tsx'), 'export default function P(){return null;}\n');
    try {
      const r = run();
      expect(r.status).not.toBe(0);
      expect(r.stdout + r.stderr).toMatch(/SENSE cobertura|covtmp/);
    } finally {
      fs.rmSync(path.join(ROOT, 'app', 'admin', 'covtmp'), { recursive: true, force: true });
    }
  });
});
