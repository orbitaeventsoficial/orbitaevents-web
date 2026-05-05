// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-message-imports.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-message-imports-'));
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

describe('check-message-imports', () => {
  it('passes when scanned files do not import messages directly', () => {
    const result = runGuard({
      'app/admin/page.tsx': "import { foo } from '@/lib/foo';",
      'lib/services/bar.ts': "import { baz } from './baz';",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails when an app file imports from @/messages alias', () => {
    const result = runGuard({
      'app/components/leak.tsx': "import ca from '@/messages/ca.json';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/components/leak.tsx');
    expect(result.stderr).toContain('Direct messages imports');
  });

  it('fails on relative parent paths to messages (../messages, ../../messages)', () => {
    const result = runGuard({
      'app/leak1.tsx': "import ca from '../messages/ca.json';",
      'app/sub/leak2.tsx': "import es from '../../messages/es.json';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/leak1.tsx');
    expect(result.stderr).toContain('app/sub/leak2.tsx');
  });

  it('fails on any path that ends with messages/<locale>.json', () => {
    const result = runGuard({
      'lib/leak.ts': "import data from '../../weird/path/messages/ca.json';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('lib/leak.ts');
  });

  it('allows the canonical i18n adapters from the allowlist', () => {
    const result = runGuard({
      'lib/pack-i18n.ts': "import ca from '@/messages/ca.json';",
      'lib/equipment-i18n.ts': "import es from '@/messages/es.json';",
      'lib/home-meta.ts': "import en from '@/messages/en.json';",
      'lib/site-public-copy.ts': "import ca from '@/messages/ca.json';",
      'lib/public-error-copy.ts': "import en from '@/messages/en.json';",
    });
    expect(result.status).toBe(0);
  });

  it('does not scan node_modules or .next folders', () => {
    const result = runGuard({
      'node_modules/somepkg/index.js': "import x from '@/messages/ca.json';",
      '.next/server/messages.js': "import x from '@/messages/es.json';",
      'app/clean.tsx': "import { foo } from '@/lib/foo';",
    });
    expect(result.status).toBe(0);
  });

  it('only scans app/ and lib/ — files in scripts/ or other roots are out of scope', () => {
    const result = runGuard({
      'scripts/leak.mjs': "import ca from '@/messages/ca.json';",
      'docs/example.ts': "import es from '@/messages/es.json';",
    });
    expect(result.status).toBe(0);
  });

  it('reports multiple violations and points to the helper recommendation', () => {
    const result = runGuard({
      'app/leak1.tsx': "import ca from '@/messages/ca.json';",
      'lib/leak2.ts': "import es from '../../messages/es.json';",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('app/leak1.tsx');
    expect(result.stderr).toContain('lib/leak2.ts');
    expect(result.stderr).toMatch(/i18n\/copy helper|allowlist entry/);
  });

  it('does not flag JSX/TSX/JS/MJS extensions when content is clean', () => {
    const result = runGuard({
      'app/a.tsx': "export const X = 1;",
      'app/b.ts': "export const Y = 2;",
      'lib/c.jsx': "export const Z = 3;",
      'lib/d.mjs': "export const W = 4;",
    });
    expect(result.status).toBe(0);
  });
});
