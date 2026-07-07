import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('MarketingSpendPanel backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/economia/MarketingSpendPanel.tsx'), 'utf8');

  it('separa error de carrega de llista buida i conserva errors backend', () => {
    expect(source).toContain('async function readMarketingSpendError');
    expect(source).toContain('return payload.error || payload.message || fallback;');
    expect(source).toContain("const [loadError, setLoadError] = useState('');");
    expect(source).toContain("setLoadError(message);");
    expect(source).toContain('loadError && (');
    expect(source).toContain('role="alert"');
    expect(source).toContain(') : loadError ? null : entries.length === 0 ? (');
    expect(source).toContain("throw new Error(await readMarketingSpendError(res, 'No s’ha pogut carregar la despesa.'));");
    expect(source).toContain("throw new Error(await readMarketingSpendError(res, 'No s’ha pogut desar la despesa.'));");
    expect(source).toContain("throw new Error(await readMarketingSpendError(res, 'No s’ha pogut eliminar la despesa.'));");
    expect(source).not.toContain("throw new Error('load failed')");
    expect(source).not.toContain("throw new Error('save failed')");
    expect(source).not.toContain("throw new Error('delete failed')");
  });
});
