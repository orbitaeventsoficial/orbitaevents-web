// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useScrollTracking', () => {
  const source = readFileSync(join(process.cwd(), 'hooks', 'useScrollTracking.ts'), 'utf8');

  it('uses the typed Window.dataLayer global without any-casting', () => {
    expect(source).toContain('Array.isArray(window.dataLayer)');
    expect(source).toContain('window.dataLayer.push');
    expect(source).not.toContain('window as any');
  });
});
