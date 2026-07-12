import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/discount-codes/page.tsx'), 'utf8');

describe('/admin/discount-codes page contract', () => {
  it('usa PATCH per activar/desactivar codis i no accions amagades dins el POST', () => {
    expect(source).toContain("method: 'PATCH'");
    expect(source).not.toContain("_action");
  });

  it('no mostra mojibake del símbol euro', () => {
    expect(source).not.toContain('â');
    expect(source).toContain("Comanda mínima (€)");
  });

  it('anuncia loading i feedback amb semàntica accessible', () => {
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain('ap-inline-alert ap-inline-alert--success');
    expect(source).toContain('ap-inline-alert ap-inline-alert--danger');
  });

  it('exposa estat als segment controls i al submit', () => {
    expect(source).toContain("aria-pressed={form.type === 'PERCENTAGE'}");
    expect(source).toContain("aria-pressed={form.type === 'FIXED_AMOUNT'}");
    expect(source).toContain('aria-busy={submitting}');
  });
});
