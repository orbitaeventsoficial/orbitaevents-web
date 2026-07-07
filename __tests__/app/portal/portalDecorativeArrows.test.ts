import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('client portal decorative arrows', () => {
  it('manté les fletxes visuals fora dels noms accessibles', () => {
    const files = [
      path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'page.tsx'),
      path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]', 'sign', 'page.tsx'),
      path.join(process.cwd(), 'app', 'components', 'public', 'ClientPortalPageHeader.tsx'),
    ];

    const unsafeLines = files.flatMap((filePath) =>
      readFileSync(filePath, 'utf8')
        .split('\n')
        .map((line, index) => ({ filePath, line, index: index + 1 }))
        .filter(({ line }) => (line.includes('→') || line.includes('←')) && !line.includes('aria-hidden="true"')),
    );

    expect(unsafeLines.map(({ filePath, index }) => `${path.relative(process.cwd(), filePath)}:${index}`)).toEqual([]);
  });
});
