// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-img-tag.mjs');

function makeDir(root: string, ...segments: string[]) {
  const dir = path.join(root, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-no-img-tag', () => {
  it('passes quan no hi ha cap <img> en fitxers .tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-imgguard-'));
    const dir = makeDir(root, 'app', 'admin', 'dashboard');
    writeFileSync(
      path.join(dir, 'page.tsx'),
      "import Image from 'next/image';\nexport default function P() { return <Image src='/logo.png' alt='logo' width={40} height={40} />; }",
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-img-tag] OK');
  });

  it('falla quan hi ha <img src> a un fitxer .tsx de app/', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-imgguard-'));
    const dir = makeDir(root, 'app', 'admin', 'bookings');
    writeFileSync(
      path.join(dir, 'page.tsx'),
      'export default function P() { return <img src="/logo.png" alt="logo" />; }',
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-img-tag] FAIL');
    expect(result.stderr).toContain('app/admin/bookings/page.tsx');
  });

  it('falla quan hi ha <img> autotancant sense atributs', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-imgguard-'));
    const dir = makeDir(root, 'lib', 'components');
    writeFileSync(path.join(dir, 'Banner.tsx'), 'export function B() { return <img/>; }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-img-tag] FAIL');
  });

  it('ignora línies de comentari // i {/* */}', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-imgguard-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.tsx'),
      '// <img src="/old.png" />\nexport default function C() {\n  return null; // {/* <img> */}\n}',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-img-tag] OK');
  });

  it('ignora fitxers .test.tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-imgguard-'));
    const dir = makeDir(root, 'app', 'admin');
    writeFileSync(
      path.join(dir, 'Component.test.tsx'),
      'it("ok", () => { const el = <img src="/x.png" />; });',
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-img-tag] OK');
  });

  it('reporta múltiples violacions a fitxers i subdirectoris diferentes', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-imgguard-'));
    const dir1 = makeDir(root, 'app', 'admin', 'leads');
    writeFileSync(path.join(dir1, 'page.tsx'), 'export default function P() { return <img src="/a.png" />; }');
    const dir2 = makeDir(root, 'lib', 'components');
    writeFileSync(path.join(dir2, 'Logo.tsx'), 'export function Logo() { return <img src="/logo.svg" />; }');
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('app/admin/leads/page.tsx');
    expect(result.stderr).toContain('lib/components/Logo.tsx');
  });
});
