import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('dossiers single entrypoint', () => {
  it('no conserva un segon endpoint de creacio des de lead', () => {
    expect(existsSync(join(process.cwd(), 'app/api/admin/dossiers/draft-from-lead/route.ts'))).toBe(false);
  });
});
