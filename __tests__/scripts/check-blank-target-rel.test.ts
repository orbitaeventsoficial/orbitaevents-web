// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-blank-target-rel.mjs');

function runGuard(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-blank-target-'));
  for (const [rel, content] of Object.entries(files)) {
    const fullPath = path.join(root, rel);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-blank-target-rel', () => {
  it('passa quan target="_blank" té rel="noopener noreferrer" a la mateixa línia', () => {
    const result = runGuard({
      'app/components/Link.tsx': `
export function Link() {
  return <a href="https://example.com" target="_blank" rel="noopener noreferrer">text</a>;
}
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[blank-target-rel] OK');
  });

  it('passa quan target="_blank" i rel estan en línies separades', () => {
    const result = runGuard({
      'app/components/Link.tsx': `
export function Link() {
  return (
    <a
      href="https://example.com"
      target="_blank"
      rel="noopener noreferrer"
      className="link"
    >
      text
    </a>
  );
}
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[blank-target-rel] OK');
  });

  it('falla quan target="_blank" no té noopener ni noreferrer a prop', () => {
    const result = runGuard({
      'app/components/BadLink.tsx': `
export function BadLink() {
  return <a href="https://example.com" target="_blank">text</a>;
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[blank-target-rel] FAIL');
    expect(result.stderr).toContain('app/components/BadLink.tsx');
  });

  it('falla quan rel és present però no conté noopener ni noreferrer', () => {
    const result = runGuard({
      'app/components/WrongRel.tsx': `
export function WrongRel() {
  return <a href="https://example.com" target="_blank" rel="external">text</a>;
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[blank-target-rel] FAIL');
  });

  it('passa quan no hi ha cap target="_blank" al fitxer', () => {
    const result = runGuard({
      'app/components/NoBlank.tsx': `
export function NoBlank() {
  return <a href="/about">text</a>;
}
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[blank-target-rel] OK');
  });

  it('ignora target="_blank" en línies de comentari', () => {
    const result = runGuard({
      'app/components/Commented.tsx': `
// Exemple: <a target="_blank"> sense rel — NO fer-ho!
export function Commented() {
  return <a href="/" target="_blank" rel="noopener noreferrer">ok</a>;
}
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[blank-target-rel] OK');
  });

  it('ignora fitxers de test', () => {
    const result = runGuard({
      'app/components/__tests__/Link.test.tsx': `
// test sense rel — ha de ser ignorat
it('test', () => {
  render(<a href="x" target="_blank">x</a>);
});
`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[blank-target-rel] OK');
  });

  it('detecta múltiples violacions en fitxers i carpetes diferents', () => {
    const result = runGuard({
      'app/components/A.tsx': `
export const A = () => <a href="x" target="_blank">A</a>;
`,
      'lib/utils/B.tsx': `
export const B = () => <a href="y" target="_blank">B</a>;
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[blank-target-rel] FAIL');
    expect(result.stderr).toContain('app/components/A.tsx');
    expect(result.stderr).toContain('lib/utils/B.tsx');
  });

  it('falla quan window.open usa _blank sense noopener', () => {
    const result = runGuard({
      'app/admin/leads/Preview.tsx': `
export function openPreview(url: string) {
  window.open(url, '_blank');
}
`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('window.open');
    expect(result.stderr).toContain('app/admin/leads/Preview.tsx');
  });

  it('passa quan window.open usa noopener i noreferrer', () => {
    const result = runGuard({
      'app/admin/leads/Preview.tsx': `
export function openPreview(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
`,
    });
    expect(result.status).toBe(0);
  });

  it('permet finestres buides controlades per impressió', () => {
    const result = runGuard({
      'app/admin/leads/Print.tsx': `
export function printHtml(html: string) {
  const printWindow = window.open('', '_blank');
  printWindow?.document.write(html);
}
`,
    });
    expect(result.status).toBe(0);
  });
});
