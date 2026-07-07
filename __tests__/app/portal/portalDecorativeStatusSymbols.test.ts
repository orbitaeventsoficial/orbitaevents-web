import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function collectTsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return collectTsxFiles(fullPath);
    return fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

describe('client portal decorative status symbols', () => {
  it('manté els símbols visuals d estat fora del text accessible', () => {
    const portalRoot = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]');
    const unsafeLines = collectTsxFiles(portalRoot).flatMap((filePath) =>
      readFileSync(filePath, 'utf8')
        .split('\n')
        .map((line, index) => ({ filePath, line, index: index + 1 }))
        .filter(({ line }) => (line.includes('✓') || line.includes('○')) && !line.includes('aria-hidden="true"')),
    );

    expect(unsafeLines.map(({ filePath, index }) => `${path.relative(process.cwd(), filePath)}:${index}`)).toEqual([]);
  });
});
