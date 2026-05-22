// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-dangerous-html.mjs');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-dangerous-html-'));
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

describe('check-dangerous-html', () => {
  it('passes when no app/lib files exist', () => {
    const result = runGuard({
      'README.md': 'empty\n',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[dangerous-html] OK');
  });

  it('allows JSON-LD serialized with JSON.stringify', () => {
    const result = runGuard({
      'app/[locale]/faq/page.tsx': [
        'export default function Page() {',
        '  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;',
        '}',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('allows external HTML sanitized with DOMPurify', () => {
    const result = runGuard({
      'app/admin/inbox/InboxSections.tsx': [
        "import DOMPurify from 'dompurify';",
        'export function Panel({ bodyHtml }) {',
        '  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }} />;',
        '}',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('allows controlled translation raw HTML', () => {
    const result = runGuard({
      'app/[locale]/gracias/page.tsx': [
        'export default function Page({ t }) {',
        "  return <p dangerouslySetInnerHTML={{ __html: t.raw('response.text') }} />;",
        '}',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('allows documented raw HTML by file allowlist', () => {
    const result = runGuard({
      'app/[locale]/blog/[slug]/page.tsx': [
        'export function BlogContent({ html }) {',
        '  return <article dangerouslySetInnerHTML={{ __html: html }} />;',
        '}',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });

  it('flags raw HTML variables in non-allowlisted files', () => {
    const result = runGuard({
      'app/admin/custom/page.tsx': [
        'export default function Page({ html }) {',
        '  return <section dangerouslySetInnerHTML={{ __html: html }} />;',
        '}',
      ].join('\n'),
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[dangerous-html] FAIL');
    expect(result.stderr).toContain('app/admin/custom/page.tsx');
  });

  it('flags inline template scripts outside the allowlist', () => {
    const result = runGuard({
      'app/admin/custom/page.tsx': [
        'export default function Page() {',
        '  return <script dangerouslySetInnerHTML={{ __html: `window.bad = true` }} />;',
        '}',
      ].join('\n'),
    });
    expect(result.status).toBe(1);
  });

  it('ignores test files', () => {
    const result = runGuard({
      'app/admin/custom/page.test.tsx': [
        'it("renders", () => {',
        '  const el = <section dangerouslySetInnerHTML={{ __html: html }} />;',
        '});',
      ].join('\n'),
    });
    expect(result.status).toBe(0);
  });
});
