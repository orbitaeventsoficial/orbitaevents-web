// @vitest-environment node
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-social-split.mjs');

function runGuard(dirs: string[]) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-social-split-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const dir of dirs) {
    mkdirSync(path.join(root, 'app', 'admin', dir), { recursive: true });
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-social-split', () => {
  it('passa quan no hi ha directoris a app/admin', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-social-split] OK');
  });

  it('passa quan app/admin/social/ existeix (directori canònic)', () => {
    const result = runGuard(['social', 'social/components', 'social/utils']);
    expect(result.status).toBe(0);
  });

  it('falla quan existeix app/admin/social-calendar/ fora del canònic', () => {
    const result = runGuard(['social-calendar']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-social-split] FAIL');
    expect(result.stderr).toContain('social-calendar');
  });

  it('falla quan existeix app/admin/editorial-calendar/', () => {
    const result = runGuard(['editorial-calendar']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('editorial-calendar');
  });

  it('falla quan existeix app/admin/content-calendar/', () => {
    const result = runGuard(['content-calendar']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('content-calendar');
  });

  it('passa quan existeix app/admin/settings/ (nom no social)', () => {
    const result = runGuard(['settings', 'bookings', 'leads', 'reporting']);
    expect(result.status).toBe(0);
  });

  it('falla quan un split social apareix en un subdirectori niuat', () => {
    const result = runGuard(['reporting/social-calendar']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('social-calendar');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard(['social-ideas', 'editorial', 'content-planning']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('social-ideas');
    expect(result.stderr).toContain('editorial');
    expect(result.stderr).toContain('content-planning');
  });
});
