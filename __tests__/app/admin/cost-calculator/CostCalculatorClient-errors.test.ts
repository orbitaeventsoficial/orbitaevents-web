import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CostCalculatorClient canonical handoff', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/cost-calculator/CostCalculatorClient.tsx'), 'utf8');

  it('no desa documents comercials pel carril retirat de custom-quotes', () => {
    expect(source).toContain('Aquesta pantalla no desa documents comercials.');
    expect(source).toContain('Per enviar o arxivar una proposta, crea-la al workspace canònic de Pressupostos.');
    expect(source).toContain('href="/admin/presupuestos"');
    expect(source).toContain('Obrir Pressupostos');
    expect(source).not.toContain('/api/admin/custom-quotes');
    expect(source).not.toContain('readCustomQuoteSaveError');
    expect(source).not.toContain('handleSave');
    expect(source).not.toContain('Desar pressupost');
  });
});
