// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-canonical-fetches.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-canonical-fetches-'));
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

describe('check-canonical-fetches', () => {
  it('passes when scanned files do not call canonical endpoints directly', () => {
    const result = runGuard({
      'app/admin/test/page.tsx': "fetch('/api/admin/something')",
      'lib/services/foo.ts': 'export const foo = 1;',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails when /api/google-reviews is fetched outside the canonical client', () => {
    const result = runGuard({
      'app/components/leak/Reviews.tsx': "const r = await fetch('/api/google-reviews');",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('google-reviews');
    expect(result.stderr).toContain('app/components/leak/Reviews.tsx');
    expect(result.stderr).toContain('fetchPublicGoogleReviews');
  });

  it('fails when /api/hero-media is fetched outside the canonical client', () => {
    const result = runGuard({
      'app/components/leak/Hero.tsx': 'await fetch(`/api/hero-media`)',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('hero-media');
    expect(result.stderr).toContain('fetchHeroMedia');
  });

  it('matches both static and double-quoted fetch calls', () => {
    const result = runGuard({
      'lib/leak.ts': 'fetch("/api/google-reviews", { cache: "no-store" })',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('google-reviews');
  });

  it('does not flag canonical client files (allowlist)', () => {
    const result = runGuard({
      'lib/api/googleReviewsClient.ts': "fetch('/api/google-reviews')",
      'lib/api/heroMediaClient.ts': "fetch('/api/hero-media')",
    });
    expect(result.status).toBe(0);
  });

  it('does not flag fetches to URLs that simply share a prefix', () => {
    const result = runGuard({
      'app/leak.ts': "fetch('/api/google-reviews-stats')",
    });
    expect(result.status).toBe(0);
  });

  it('skips files inside __tests__', () => {
    const result = runGuard({
      '__tests__/app/components/Reviews.test.tsx': "fetch('/api/google-reviews')",
    });
    expect(result.status).toBe(0);
  });

  it('reports multiple violations across files', () => {
    const result = runGuard({
      'app/leak1.tsx': "fetch('/api/google-reviews')",
      'lib/leak2.ts': 'fetch("/api/hero-media")',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/2 direct fetch\(es\)/);
  });

  it('fails when /api/public/stats is fetched outside the canonical client', () => {
    const result = runGuard({
      'hooks/leak.ts': 'await fetch("/api/public/stats?locale=ca")',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/api/public/stats');
    expect(result.stderr).toContain('fetchPublicStats');
    expect(result.stderr).toContain('publicStatsClient.ts');
  });

  it('fails when /api/public/availability is fetched outside the canonical client', () => {
    const result = runGuard({
      'hooks/leak.ts': 'await fetch("/api/public/availability?locale=ca")',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/api/public/availability');
    expect(result.stderr).toContain('fetchPublicAvailability');
    expect(result.stderr).toContain('publicAvailabilityClient.ts');
  });

  it('fails when /api/public/packs is fetched outside the canonical client', () => {
    const result = runGuard({
      'hooks/leak.ts': 'await fetch("/api/public/packs?service=bodas")',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/api/public/packs');
    expect(result.stderr).toContain('fetchPublicPacks');
    expect(result.stderr).toContain('publicPacksClient.ts');
  });

  it('fails when /api/public/image-manager is fetched outside the canonical client', () => {
    const result = runGuard({
      'app/leak.tsx': 'await fetch("/api/public/image-manager?key=foo")',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/api/public/image-manager');
    expect(result.stderr).toContain('fetchImageManager');
    expect(result.stderr).toContain('imageManagerClient.ts');
  });

  it('fails when /api/public/coverage is fetched outside the canonical client', () => {
    const result = runGuard({
      'app/leak.tsx': "await fetch('/api/public/coverage', { cache: 'no-store' })",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/api/public/coverage');
    expect(result.stderr).toContain('fetchPublicCoverage');
    expect(result.stderr).toContain('publicCoverageClient.ts');
  });
});
