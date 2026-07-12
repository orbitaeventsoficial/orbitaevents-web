import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('ScriptsClient catalog files', () => {
  it('apunta només a fitxers existents del repo', () => {
    const source = readFileSync(join(process.cwd(), 'app/admin/scripts/ScriptsClient.tsx'), 'utf8');
    const files = Array.from(source.matchAll(/file: '([^']+)'/g), (match) => match[1]);

    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((file) => !existsSync(join(process.cwd(), file)))).toEqual([]);
  });
});
