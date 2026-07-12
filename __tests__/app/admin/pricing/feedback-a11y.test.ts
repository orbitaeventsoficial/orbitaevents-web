import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const pagePath = join(process.cwd(), 'app/admin/pricing/page.tsx');

describe('Pricing feedback accessibility', () => {
  it('anuncia loading i error inicial amb semantica accessible', () => {
    const source = readFileSync(pagePath, 'utf8');

    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).toContain('Carregant dades...');
    expect(source).toContain('Reintentar');
  });
});
