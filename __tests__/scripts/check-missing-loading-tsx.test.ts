// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-missing-loading-tsx.mjs');
const PAGE = 'export default function Page() { return null; }';
const LOADING = "export { default } from '../components/AdminLoadingSkeleton';";

function makeAdminDir(root: string, ...segments: string[]) {
  const dir = path.join(root, 'app', 'admin', ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function run(cwd: string) {
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-missing-loading-tsx', () => {
  it('passes when all admin pages have loading.tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-loading-'));
    const leads = makeAdminDir(root, 'leads');
    writeFileSync(path.join(leads, 'page.tsx'), PAGE);
    writeFileSync(path.join(leads, 'loading.tsx'), LOADING);
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[missing-loading-tsx] OK');
  });

  it('fails when an admin page is missing loading.tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-loading-'));
    const leads = makeAdminDir(root, 'leads');
    writeFileSync(path.join(leads, 'page.tsx'), PAGE);
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('app/admin/leads');
    expect(result.stderr).toContain('loading.tsx');
  });

  it('reports all violations when multiple pages lack loading.tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-loading-'));
    const social = makeAdminDir(root, 'social');
    writeFileSync(path.join(social, 'page.tsx'), PAGE);
    const reporting = makeAdminDir(root, 'reporting');
    writeFileSync(path.join(reporting, 'page.tsx'), PAGE);
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('app/admin/social');
    expect(result.stderr).toContain('app/admin/reporting');
  });

  it('detects violations in nested subdirectories', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-loading-'));
    const detail = makeAdminDir(root, 'bookings', '[id]');
    writeFileSync(path.join(detail, 'page.tsx'), PAGE);
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('bookings');
  });

  it('ignores directories without page.tsx', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-loading-'));
    const comps = makeAdminDir(root, 'components');
    writeFileSync(path.join(comps, 'AdminPage.tsx'), PAGE);
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[missing-loading-tsx] OK');
  });

  it('passes when loading.tsx exists in nested page directory', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-loading-'));
    const detail = makeAdminDir(root, 'leads', '[id]');
    writeFileSync(path.join(detail, 'page.tsx'), PAGE);
    writeFileSync(
      path.join(detail, 'loading.tsx'),
      "export { default } from '../../components/AdminLoadingSkeleton';",
    );
    const result = run(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[missing-loading-tsx] OK');
  });
});
