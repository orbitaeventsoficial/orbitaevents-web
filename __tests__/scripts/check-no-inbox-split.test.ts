// @vitest-environment node
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-inbox-split.mjs');

function runGuard(dirs: string[]) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-inbox-split-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const dir of dirs) {
    mkdirSync(path.join(root, 'app', 'admin', dir), { recursive: true });
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-inbox-split', () => {
  it('passa quan no hi ha directoris a app/admin', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-inbox-split] OK');
  });

  it('passa quan app/admin/inbox/ existeix (directori canònic)', () => {
    const result = runGuard(['inbox', 'inbox/compose', 'inbox/settings']);
    expect(result.status).toBe(0);
  });

  it('falla quan existeix app/admin/messages/ fora del canònic', () => {
    const result = runGuard(['messages']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-inbox-split] FAIL');
    expect(result.stderr).toContain('messages');
  });

  it('falla quan existeix app/admin/messaging/', () => {
    const result = runGuard(['messaging']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('messaging');
  });

  it('falla quan existeix app/admin/comms/', () => {
    const result = runGuard(['comms']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('comms');
  });

  it('falla quan existeix app/admin/email-hub/', () => {
    const result = runGuard(['email-hub']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('email-hub');
  });

  it('passa quan existeix app/admin/bookings/ (nom no-inbox)', () => {
    const result = runGuard(['bookings', 'leads', 'clientes', 'email-templates']);
    expect(result.status).toBe(0);
  });

  it('falla quan un split apareix en un subdirectori niuat', () => {
    const result = runGuard(['settings/messages']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('messages');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard(['comms', 'messaging', 'contact-hub']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('comms');
    expect(result.stderr).toContain('messaging');
    expect(result.stderr).toContain('contact-hub');
  });
});
