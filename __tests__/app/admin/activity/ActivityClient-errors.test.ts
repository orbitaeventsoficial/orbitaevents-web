import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('ActivityClient backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/activity/ActivityClient.tsx'), 'utf8');

  it('propaga el motiu backend quan falla carregar el registre dactivitat', () => {
    expect(source).toContain('async function readActivityLoadError');
    expect(source).toContain('return payload.error || payload.message ||');
    expect(source).toContain('throw new Error(await readActivityLoadError(res));');
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'Error carregant activitat');");
    expect(source).not.toContain("throw new Error('Error carregant activitat');");
  });
});
