// @vitest-environment node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('instrumentation runtime imports', () => {
  const source = readFileSync(join(process.cwd(), 'instrumentation.ts'), 'utf8');

  it('does not bypass Next alias transformation for scheduler imports', () => {
    expect(source).not.toMatch(/new Function\([^)]*import\(/);
    expect(source).not.toContain("imp('@/lib/");
    expect(source).not.toContain('imp("@/lib/');
    expect(source).not.toContain("import('@/lib/services/");
    expect(source).not.toContain('import("@/lib/services/');
  });
});
