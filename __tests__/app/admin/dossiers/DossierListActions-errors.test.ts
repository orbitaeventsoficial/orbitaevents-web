import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('DossierListActions backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/dossiers/DossierListActions.tsx'), 'utf8');

  it('no confirma mutacions del llistat si el backend les rebutja', () => {
    expect(source).toContain('async function readDossierListActionError');
    expect(source).toContain('return payload.error || payload.message || fallback;');
    expect(source).toContain("throw new Error(await readDossierListActionError(res, 'Error enviant el dossier'));");
    expect(source).toContain("if (!res.ok) throw new Error(await readDossierListActionError(res, 'Error movent el dossier a la paperera'));");
    expect(source).toContain("if (!res.ok) throw new Error(await readDossierListActionError(res, 'Error restaurant el dossier'));");
    expect(source).toContain("if (!res.ok) throw new Error(await readDossierListActionError(res, 'Error eliminant el dossier'));");
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'Error movent el dossier a la paperera');");
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'Error restaurant el dossier');");
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'Error eliminant el dossier');");
    expect(source).not.toContain("toast.error('Error movent el dossier a la paperera');");
    expect(source).not.toContain("toast.error('Error restaurant el dossier');");
    expect(source).not.toContain("toast.error('Error eliminant el dossier');");
  });
});
