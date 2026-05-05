// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('app analytics dataLayer fallback', () => {
  const source = readFileSync(join(process.cwd(), 'app', 'lib', 'analytics.ts'), 'utf8');

  it('checks dataLayer shape before pushing fallback events', () => {
    expect(source.match(/Array\.isArray\(window\.dataLayer\)/g)).toHaveLength(2);
    expect(source).not.toContain('if (window.dataLayer)');
  });
});
