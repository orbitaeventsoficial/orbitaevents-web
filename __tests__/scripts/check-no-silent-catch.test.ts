// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-silent-catch.mjs');

function runGuard(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-silent-catch-'));
  const adminDir = path.join(root, 'app', 'admin');
  mkdirSync(adminDir, { recursive: true });
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(adminDir, filename);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf8');
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-silent-catch', () => {
  it('passa quan no hi ha fitxers a app/admin', () => {
    const result = runGuard({});
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-silent-catch] OK');
  });

  it('passa quan un catch té toast.error i console.error', () => {
    const result = runGuard({
      'Component.tsx': `
        try { await fetch('/api'); } catch (err) {
          console.error('fetch error', err);
          toast.error('Error');
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('falla quan un catch té toast.error però no console.error', () => {
    const result = runGuard({
      'Component.tsx': `
        try { await fetch('/api'); } catch (err) {
          toast.error('Error carregant');
        }
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-silent-catch] FAIL');
    expect(result.stderr).toContain('Component.tsx');
  });

  it('falla quan un catch té setFlash però no logging', () => {
    const result = runGuard({
      'Page.tsx': `
        try { await fetch('/api'); } catch {
          setFlash({ type: 'error', text: 'Error' });
        }
      `,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-silent-catch] FAIL');
  });

  it('passa quan un catch fa servir log.error en lloc de console.error', () => {
    const result = runGuard({
      'Component.tsx': `
        try { await fetch('/api'); } catch (err) {
          log.error('Error', err);
          toast.error('Error carregant');
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('no falla per catch sense feedback d\'error a l\'usuari', () => {
    const result = runGuard({
      'Component.tsx': `
        try { await fetch('/api'); } catch {
          setLoading(false);
        }
      `,
    });
    expect(result.status).toBe(0);
  });

  it('reporta múltiples violacions en fitxers diferents', () => {
    const result = runGuard({
      'A.tsx': `try { f(); } catch { toast.error('Err A'); }`,
      'sub/B.tsx': `try { f(); } catch { setFlash({ type: 'error', text: 'Err B' }); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('A.tsx');
    expect(result.stderr).toContain('B.tsx');
  });
});
