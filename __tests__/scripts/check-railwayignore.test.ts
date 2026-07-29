// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '..', '..');

function readActiveRailwayIgnoreRules(): string[] {
  return readFileSync(resolve(rootDir, '.railwayignore'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

describe('.railwayignore deploy safety', () => {
  it('anchors root coverage artifacts without excluding Next coverage routes', () => {
    const rules = readActiveRailwayIgnoreRules();

    expect(rules).toContain('/coverage');
    expect(rules).not.toContain('coverage');
  });

  it('keeps the admin coverage route available to the Railway build snapshot', () => {
    expect(existsSync(resolve(rootDir, 'app/api/admin/coverage/route.ts'))).toBe(true);
  });
});
