// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-admin-gradient-classes.mjs');

function runGuard(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-admin-gradient-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-admin-gradient-classes', () => {
  it('passa quan no hi ha fitxers tsx a app/admin', () => {
    const result = runGuard({});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-admin-gradient-classes] OK');
  });

  it('passa quan els tsx no contenen bg-gradient-to-', () => {
    const result = runGuard({
      'app/admin/page.tsx': `export default function Page() {
  return <div className="admin-gradient--fab text-white">Hello</div>;
}`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-admin-gradient-classes] OK');
  });

  it('falla quan un tsx conté bg-gradient-to-r', () => {
    const result = runGuard({
      'app/admin/economia/page.tsx': `export default function Page() {
  return <div className="bg-gradient-to-r from-emerald-500 to-emerald-400">bar</div>;
}`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-admin-gradient-classes] FAIL');
    expect(result.stderr).toContain('economia/page.tsx');
  });

  it('falla quan un tsx conté bg-gradient-to-br', () => {
    const result = runGuard({
      'app/admin/layout.tsx': `<button className="bg-gradient-to-br from-amber-500 to-orange-500" />`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('layout.tsx');
  });

  it('reporta el número de línia correcte', () => {
    const result = runGuard({
      'app/admin/settings/page.tsx': `export default function Page() {
  // some code
  return (
    <div className="bg-gradient-to-t from-slate-800 to-slate-900">ok</div>
  );
}`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(':4');
  });

  it('ignora fitxers .ts (no .tsx)', () => {
    const result = runGuard({
      'app/admin/utils.ts': `const cls = 'bg-gradient-to-r from-blue-500';`,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions en fitxers diferents', () => {
    const result = runGuard({
      'app/admin/layout.tsx': `<button className="bg-gradient-to-br from-amber-500 to-orange-500" />`,
      'app/admin/economia/EconomiaClient.tsx': `<div className="bg-gradient-to-r from-emerald-500 to-emerald-400" />`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('layout.tsx');
    expect(result.stderr).toContain('EconomiaClient.tsx');
    expect(result.stderr).toContain('2 Tailwind gradient');
  });

  it('passa quan s\'usa admin-gradient--* en comptes de bg-gradient-to-*', () => {
    const result = runGuard({
      'app/admin/layout.tsx': `<button className={open ? 'bg-white/20' : 'admin-gradient--fab'} />`,
    });
    expect(result.status).toBe(0);
  });
});
