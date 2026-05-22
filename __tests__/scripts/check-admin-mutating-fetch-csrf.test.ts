// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const SCRIPT = path.resolve('scripts/check-admin-mutating-fetch-csrf.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-admin-mutating-fetch-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [SCRIPT], { cwd, encoding: 'utf8' });
}

describe('check-admin-mutating-fetch-csrf', () => {
  it('passa amb GET natiu cap a /api/admin', () => {
    const result = runGuard({
      'app/admin/activity/ActivityClient.tsx': "await fetch(`/api/admin/activity?${params}`);",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('passa amb fetchWithCsrf en mutacions admin', () => {
    const result = runGuard({
      'app/admin/bookings/BookingActions.tsx': "await fetchWithCsrf(`/api/admin/bookings/${id}`, { method: 'DELETE' });",
    });
    expect(result.status).toBe(0);
  });

  it('detecta POST natiu cap a /api/admin', () => {
    const result = runGuard({
      'app/admin/questionnaires/new/QuestionnaireTemplateCreator.tsx': `
        await fetch('/api/admin/questionnaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      `,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('QuestionnaireTemplateCreator.tsx');
    expect(result.stderr).toContain("method: 'POST'");
  });

  it('detecta PATCH amb template literal dinàmic', () => {
    const result = runGuard({
      'app/admin/questionnaires/[id]/QuestionnaireTemplateEditor.tsx': `
        await fetch(\`/api/admin/questionnaires/\${template.id}\`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      `,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("method: 'PATCH'");
  });

  it('detecta window.fetch i globalThis.fetch', () => {
    const result = runGuard({
      'app/admin/settings/SettingsClient.tsx': "await window.fetch('/api/admin/settings', { method: 'PUT' });",
      'app/admin/features/page.tsx': 'await globalThis.fetch("/api/admin/features", { method: "DELETE" });',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/2 mutació admin/);
  });

  it('ignora mutacions fora de app/admin', () => {
    const result = runGuard({
      'app/components/PublicForm.tsx': "await fetch('/api/admin/internal', { method: 'POST' });",
    });
    expect(result.status).toBe(0);
  });
});
