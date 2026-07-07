import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CostCalculatorClient backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/cost-calculator/CostCalculatorClient.tsx'), 'utf8');

  it('propaga el motiu backend quan falla guardar un pressupost personalitzat', () => {
    expect(source).toContain('async function readCustomQuoteSaveError');
    expect(source).toContain('return payload.error || payload.message ||');
    expect(source).toContain('throw new Error(await readCustomQuoteSaveError(res));');
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'Error desant el pressupost');");
    expect(source).not.toContain('if (!res.ok) throw new Error();');
    expect(source).not.toContain("toast.error('Error desant');");
  });
});
