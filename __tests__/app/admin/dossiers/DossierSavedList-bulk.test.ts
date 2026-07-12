import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/dossiers/DossierSavedList.tsx'), 'utf8');
const pageSource = readFileSync(join(process.cwd(), 'app/admin/dossiers/page.tsx'), 'utf8');

describe('DossierSavedList bulk actions', () => {
  it('afegeix selecció múltiple i enviament massiu a paperera', () => {
    expect(pageSource).toContain('<DossierSavedList items={savedDossierItems} />');
    expect(source).toContain('const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());');
    expect(source).toContain('Seleccionar visibles');
    expect(source).toContain('async function moveSelectedToTrash()');
    expect(source).toContain("await fetchWithCsrf(`/api/admin/dossiers/${id}`, { method: 'DELETE' });");
    expect(source).toContain('Enviar a paperera');
    expect(source).toContain('<ConfirmDialog {...dialogProps} />');
  });

  it('reutilitza lector d errors dels actions individuals', () => {
    expect(source).toContain("readDossierListActionError(res, 'Error movent un dossier a la paperera')");
    expect(source).toContain("toast.error(`${failed.length} dossiers no s'han pogut moure.`);");
  });
});
