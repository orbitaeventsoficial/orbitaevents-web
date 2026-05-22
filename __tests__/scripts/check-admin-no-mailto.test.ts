// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-admin-no-mailto.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-admin-no-mailto-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-admin-no-mailto', () => {
  it('passa quan l admin usa compose intern en lloc de mailto', () => {
    const result = runGuard({
      'app/admin/clientes/Header.tsx': "export const href = '/admin/inbox/compose?customerId=cust-1';",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[admin-no-mailto] OK');
  });

  it('falla amb mailto dins app/admin', () => {
    const result = runGuard({
      'app/admin/clientes/Header.tsx': "export const href = 'mailto:client@example.com';",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/admin/clientes/Header.tsx');
    expect(result.stderr).toContain('mailto:client@example.com');
    expect(result.stderr).toContain('/admin/inbox/compose');
  });

  it('ignora tests encara que continguin mailto com a fixture', () => {
    const result = runGuard({
      'app/admin/clientes/Header.test.tsx': "expect(link).toBe('mailto:client@example.com');",
    });

    expect(result.status).toBe(0);
  });

  it('no revisa mailto públic fora de app/admin', () => {
    const result = runGuard({
      'app/components/footer.tsx': "export const href = 'mailto:hello@example.com';",
      'app/admin/clientes/Header.tsx': "export const href = '/admin/inbox/compose?customerId=cust-1';",
    });

    expect(result.status).toBe(0);
  });
});
