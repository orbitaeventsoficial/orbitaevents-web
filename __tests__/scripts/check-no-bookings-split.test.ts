// @vitest-environment node
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-bookings-split.mjs');

function runGuard(dirs: string[]) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-bookings-split-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const dir of dirs) {
    mkdirSync(path.join(root, 'app', 'admin', dir), { recursive: true });
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-bookings-split', () => {
  it('passa quan no hi ha directoris a app/admin', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-bookings-split] OK');
  });

  it('passa quan app/admin/bookings/ existeix (directori canònic)', () => {
    const result = runGuard(['bookings', 'bookings/new', 'bookings/[id]']);
    expect(result.status).toBe(0);
  });

  it('falla quan existeix app/admin/reservations/', () => {
    const result = runGuard(['reservations']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-bookings-split] FAIL');
    expect(result.stderr).toContain('reservations');
  });

  it('falla quan existeix app/admin/events-management/', () => {
    const result = runGuard(['events-management']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('events-management');
  });

  it('falla quan existeix app/admin/booking-hub/', () => {
    const result = runGuard(['booking-hub']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('booking-hub');
  });

  it('passa quan existeix app/admin/post-event/ (workflow tancat, no paral·lel)', () => {
    const result = runGuard(['post-event', 'leads', 'clientes', 'calendario']);
    expect(result.status).toBe(0);
  });

  it('falla quan un split apareix en un subdirectori niuat', () => {
    const result = runGuard(['finances/reservations']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('reservations');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard(['reservations', 'booking-hub', 'events-management']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('reservations');
    expect(result.stderr).toContain('booking-hub');
    expect(result.stderr).toContain('events-management');
  });
});
