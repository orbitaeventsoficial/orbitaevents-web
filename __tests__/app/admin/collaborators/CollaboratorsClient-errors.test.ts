import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CollaboratorsClient backend errors', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/collaborators/CollaboratorsClient.tsx'), 'utf8');

  it('propaga errors del backend en la carrega inicial de col·laboradors', () => {
    expect(source).toContain('async function readCollaboratorLoadError');
    expect(source).toContain(`fetch('/api/admin/collaborators', { credentials: 'include', cache: 'no-store' })`);
    expect(source).toContain(`throw new Error(await readCollaboratorLoadError(res, "No s'han pogut carregar els col·laboradors"));`);
  });

  it('propaga errors del backend en mutacions de col·laboradors', () => {
    expect(source).toContain('async function readCollaboratorMutationError');
    expect(source).toContain('return payload.error || payload.message || fallback;');
    expect(source).toContain(`throw new Error(await readCollaboratorMutationError(res, "No s'ha pogut desar el col·laborador"));`);
    expect(source).toContain(`throw new Error(await readCollaboratorMutationError(response, "No s'ha pogut eliminar el col·laborador"));`);
    expect(source).toContain(`throw new Error(await readCollaboratorMutationError(response, "No s'ha pogut actualitzar l'estat del col·laborador"));`);
    expect(source).toContain(`toast.error(err instanceof Error ? err.message : "No s'ha pogut desar el col·laborador");`);
    expect(source).not.toContain('if (!res.ok) throw new Error();');
  });
});
