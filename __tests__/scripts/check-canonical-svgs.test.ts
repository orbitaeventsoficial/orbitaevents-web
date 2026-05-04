// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-canonical-svgs.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-canonical-svgs-'));
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

const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867';
const STAR_POLYGON = '12 2 15.09 8.26 22 9.27 17 14.14';
const GOOGLE_G_FULL = `
  fill="#4285F4"
  fill="#34A853"
  fill="#FBBC05"
  fill="#EA4335"
`;

describe('check-canonical-svgs', () => {
  it('passes when scanned files contain no canonical SVG patterns', () => {
    const result = runGuard({
      'app/admin/test/page.tsx': 'export default function Page() { return <div>hello</div>; }',
      'lib/services/foo.ts': 'export const foo = 1;',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails when WhatsApp path is inlined outside the canonical component', () => {
    const result = runGuard({
      'app/admin/leak/page.tsx': `<svg><path d="${WHATSAPP_PATH}..." /></svg>`,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('whatsapp-icon');
    expect(result.stderr).toContain('app/admin/leak/page.tsx');
  });

  it('fails when star polygon points are inlined outside the canonical component', () => {
    const result = runGuard({
      'app/components/leak/Stars.tsx': `<polygon points="${STAR_POLYGON}" />`,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('star-polygon');
  });

  it('fails when all four Google G colors appear in the same file outside the canonical component', () => {
    const result = runGuard({
      'app/components/leak/Logo.tsx': `<svg>${GOOGLE_G_FULL}</svg>`,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('google-g-icon');
  });

  it('does not flag partial Google G fragments (single or partial colors)', () => {
    const result = runGuard({
      'components/reviews/Badge.tsx': 'const blue = "#4285F4"; const green = "#34A853";',
    });
    expect(result.status).toBe(0);
  });

  it('does not flag canonical components themselves (allowlisted)', () => {
    const result = runGuard({
      'app/components/public/WhatsAppIcon.tsx': `<path d="${WHATSAPP_PATH}..." />`,
      'app/components/public/StarIcon.tsx': `<polygon points="${STAR_POLYGON}" />`,
      'app/components/public/GoogleGIcon.tsx': `<svg>${GOOGLE_G_FULL}</svg>`,
    });
    expect(result.status).toBe(0);
  });

  it('does not flag the documented WhatsApp dual-path exception at app/[locale]/contacto/client.tsx', () => {
    const result = runGuard({
      'app/[locale]/contacto/client.tsx': `<path d="${WHATSAPP_PATH}..." />`,
    });
    expect(result.status).toBe(0);
  });

  it('skips files inside __tests__ even when they contain canonical patterns', () => {
    const result = runGuard({
      '__tests__/app/components/StarIcon.test.tsx': `<polygon points="${STAR_POLYGON}" />`,
    });
    expect(result.status).toBe(0);
  });
});
