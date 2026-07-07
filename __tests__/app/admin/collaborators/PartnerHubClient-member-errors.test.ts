import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/collaborators/[id]/PartnerHubClient.tsx'), 'utf8');

describe('PartnerHubClient member and favorite errors', () => {
  it('propaga errors backend en membres i favorit del partner hub', () => {
    expect(source).toContain('async function readPartnerHubMutationError');
    expect(source).toContain("throw new Error(await readPartnerHubMutationError(res, \"No s'ha pogut afegir el membre.\"));");
    expect(source).toContain("throw new Error(await readPartnerHubMutationError(res, \"No s'ha pogut desar el favorit.\"));");
    expect(source).toContain("throw new Error(await readPartnerHubMutationError(res, \"No s'ha pogut eliminar el membre.\"));");
    expect(source).toContain("toast.error(e instanceof Error && e.message ? e.message : 'Error afegint el membre.');");
    expect(source).toContain("toast.error(e instanceof Error && e.message ? e.message : 'Error desant el favorit.');");
    expect(source).toContain("toast.error(e instanceof Error && e.message ? e.message : 'Error eliminant el membre.');");
    expect(source).not.toContain("throw new Error('No s\\'ha pogut afegir')");
    expect(source).not.toContain("throw new Error('No s\\'ha pogut desar')");
    expect(source).not.toContain("throw new Error('No s\\'ha pogut eliminar')");
  });
});
