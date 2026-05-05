// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useAnalytics', () => {
  const source = readFileSync(join(process.cwd(), 'lib', 'hooks', 'useAnalytics.ts'), 'utf8');

  it('uses the shared Window.dataLayer type directly', () => {
    expect(source).toContain('window.dataLayer = window.dataLayer || []');
    expect(source).toContain('window.dataLayer.push');
    expect(source).not.toContain('window as unknown');
    expect(source).not.toContain('win.dataLayer');
  });
});
