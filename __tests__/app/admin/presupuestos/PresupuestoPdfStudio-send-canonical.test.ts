import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/presupuestos/PresupuestoPdfStudio.tsx'), 'utf8');

describe('PresupuestoPdfStudio canonical send', () => {
  it('envia només per la ruta canònica de Proposal', () => {
    expect(source).not.toContain('/api/admin/emails/quote');
    expect(source).toContain('/api/admin/proposals/${targetProposalId}/send');
    expect(source).toContain("await saveProposalDraft('DRAFT')");
    expect(source).not.toContain("await saveProposalDraft('SENT')");
  });
});
