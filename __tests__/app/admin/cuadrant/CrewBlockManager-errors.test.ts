import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'app/admin/cuadrant/CrewBlockManager.tsx'), 'utf8');

describe('CrewBlockManager error handling', () => {
  it('keeps backend errors when manual blocks fail', () => {
    expect(source).toContain('async function readCrewBlockMutationError');
    expect(source).toContain('payload.error || payload.message');
    expect(source).toContain("throw new Error(await readCrewBlockMutationError(res, \"No s'ha pogut afegir el bloqueig.\"));");
    expect(source).toContain("throw new Error(await readCrewBlockMutationError(res, \"No s'ha pogut treure el bloqueig.\"));");
    expect(source).not.toContain("throw new Error('fail')");
    expect(source).not.toContain('cal desplegar la migració?');
  });
});
