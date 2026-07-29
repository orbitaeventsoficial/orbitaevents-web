import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSubpages = [
  ['payments', path.join('app', '[locale]', 'portal', '[token]', 'payments', 'page.tsx')],
  ['invoice', path.join('app', '[locale]', 'portal', '[token]', 'invoice', 'page.tsx')],
  ['contract', path.join('app', '[locale]', 'portal', '[token]', 'contract', 'page.tsx')],
  ['sign', path.join('app', '[locale]', 'portal', '[token]', 'sign', 'page.tsx')],
] as const;

describe('client portal subpage external links', () => {
  it('avisa assistivament quan els enllaços externs obren una pestanya nova', () => {
    portalSubpages.forEach(([name, relativePath]) => {
      const source = readFileSync(path.join(process.cwd(), relativePath), 'utf8');
      const targetBlankCount = source.match(/target="_blank"/g)?.length ?? 0;
      const newTabNoteCount = source.match(/t\.opensInNewTab/g)?.length ?? 0;

      expect(targetBlankCount, name).toBeGreaterThan(0);
      expect(newTabNoteCount, name).toBe(targetBlankCount);
    });
  });
});
