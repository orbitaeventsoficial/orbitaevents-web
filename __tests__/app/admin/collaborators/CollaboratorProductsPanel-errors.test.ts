import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CollaboratorProductsPanel backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/collaborators/CollaboratorProductsPanel.tsx'), 'utf8');

  it('propaga errors del backend en mutacions de productes partner', () => {
    expect(source).toContain('async function readProductMutationError');
    expect(source).toContain("return payload.error || payload.message || fallback;");
    expect(source).toContain('Visible al dossier');
    expect(source).toContain('Visible al bolo');
    expect(source).toContain('checked={form.visibleInDossier}');
    expect(source).toContain('checked={form.visibleInBooking}');
    expect(source).toContain("throw new Error(await readProductMutationError(res, 'No s’ha pogut desar el producte'));");
    expect(source).toContain("throw new Error(await readProductMutationError(res, 'No s’ha pogut eliminar el producte'));");
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'No s’ha pogut desar el producte');");
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'No s’ha pogut eliminar el producte');");
    expect(source).not.toContain('if (!res.ok) throw new Error();');
  });
});
