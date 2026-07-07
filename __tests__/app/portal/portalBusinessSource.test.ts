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

describe('client portal business source', () => {
  it('no copia la ciutat base del negoci directament al JSX del portal', () => {
    const portalRoot = path.join(process.cwd(), 'app', '[locale]', 'portal', '[token]');
    const offenders = collectTsxFiles(portalRoot).filter((filePath) =>
      readFileSync(filePath, 'utf8').includes('Granollers'),
    );

    expect(offenders.map((filePath) => path.relative(process.cwd(), filePath))).toEqual([]);
  });
});
