// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-email-send-observability.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-email-send-observability-'));
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

describe('check-email-send-observability', () => {
  it('passa quan no hi ha sendEmail directe', () => {
    const result = runGuard({
      'lib/services/clean.ts': 'export async function run() { return true; }',
      'app/admin/page.tsx': 'export default function Page() { return null; }',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('permet el core lib/email.ts', () => {
    const result = runGuard({
      'lib/email.ts': 'export async function sendEmail() { return true; }',
    });
    expect(result.status).toBe(0);
  });

  it('passa quan el servei crea EmailSend i persisteix resultat', () => {
    const result = runGuard({
      'lib/services/contractService.ts': `
        await recordEmailSend({ htmlBody });
        const sendResult = await sendEmail({ html });
        await updateEmailSendResult(sendResult.id, {});
      `,
    });
    expect(result.status).toBe(0);
  });

  it('falla quan un servei envia SMTP sense snapshot', () => {
    const result = runGuard({
      'lib/services/leakService.ts': 'await sendEmail({ to, html });',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('lib/services/leakService.ts');
    expect(result.stderr).toContain('recordEmailSend');
    expect(result.stderr).toContain('updateEmailSendResult');
  });

  it('falla quan falta persistir el resultat SMTP/IMAP', () => {
    const result = runGuard({
      'lib/services/partialService.ts': `
        await recordEmailSend({ htmlBody });
        await sendEmail({ to, html });
      `,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('updateEmailSendResult');
  });

  it('escaneja app i ignora tests o comentaris', () => {
    const result = runGuard({
      'app/api/leak/route.ts': 'await sendEmail({ to, html });',
      '__tests__/lib/leak.test.ts': 'await sendEmail({ to, html });',
      'lib/services/comment.ts': '// sendEmail({ to, html })\nexport const ok = true;',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/api/leak/route.ts');
    expect(result.stderr).not.toContain('__tests__');
    expect(result.stderr).not.toContain('comment.ts');
  });
});
