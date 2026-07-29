import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal service quantity', () => {
  it('manté el multiplicador visual fora del text accessible', () => {
    const filePath = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx');
    const unsafeLines = readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line, index) => ({ line, index: index + 1 }))
      .filter(({ line }) => line.includes('×') && !line.includes('aria-hidden="true"'));

    expect(unsafeLines.map(({ index }) => `page.tsx:${index}`)).toEqual([]);
  });
});
