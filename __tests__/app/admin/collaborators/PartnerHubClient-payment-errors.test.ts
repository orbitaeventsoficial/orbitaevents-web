import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'app/admin/collaborators/[id]/PartnerHubClient.tsx'), 'utf8');

describe('PartnerHubClient payment errors', () => {
  it('keeps backend payment errors instead of delete/pay placeholders', () => {
    expect(source).toContain('async function readPartnerHubMutationError');
    expect(source).toContain('payload.error || payload.message');
    expect(source).toContain("throw new Error(await readPartnerHubMutationError(res, \"No s'ha pogut desfer el pagament.\"));");
    expect(source).toContain("throw new Error(await readPartnerHubMutationError(res, \"No s'ha pogut marcar com a pagat.\"));");
    expect(source).toContain("toast.error(e instanceof Error && e.message ? e.message : 'Error registrant el pagament.');");
    expect(source).not.toContain("throw new Error('delete')");
    expect(source).not.toContain("throw new Error('pay')");
  });
});
