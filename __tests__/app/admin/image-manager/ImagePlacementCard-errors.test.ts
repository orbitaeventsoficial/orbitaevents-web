import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/image-manager/ImagePlacementCard.tsx'), 'utf8');

describe('ImagePlacementCard mutation errors', () => {
  it('comprova resposta backend abans de recarregar placements', () => {
    expect(source).toContain('async function assertImageManagerMutation');
    expect(source).toContain('function readImageManagerMutationError');
    expect(source).toContain('await assertImageManagerMutation(res, "No s\'ha pogut pujar la imatge");');
    expect(source).toContain('await assertImageManagerMutation(res, "No s\'ha pogut eliminar l\'asset");');
    expect(source).toContain('await assertImageManagerMutation(res, "No s\'ha pogut tornar a mode automatic");');
    expect(source).toContain('await assertImageManagerMutation(res, "No s\'ha pogut desar el text alternatiu");');
    expect(source).toContain('await assertImageManagerMutation(res, "No s\'ha pogut reordenar la colleccio");');
    expect(source).toContain("setLocalError(err instanceof Error ? err.message : 'Error pujant imatge');");
    expect(source).not.toMatch(/^\s*await fetchWithCsrf\('\/api\/admin\/image-manager'/m);
  });
});
