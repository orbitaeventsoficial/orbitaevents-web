import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/presupuestos/ProposalsList.tsx'), 'utf8');

describe('ProposalsList bulk actions', () => {
  it('afegeix selecció múltiple i eliminació massiva segura', () => {
    expect(source).toContain('const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());');
    expect(source).toContain('const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));');
    expect(source).toContain('function toggleFilteredSelection()');
    expect(source).toContain('async function handleBulkDelete()');
    expect(source).toContain("await fetchWithCsrf(`/api/admin/proposals/${id}`, { method: 'DELETE' });");
    expect(source).toContain('Eliminar seleccionats');
    expect(source).toContain('Seleccionar pressupostos visibles');
  });

  it('amaga pressupostos de prova de la lectura normal i dels KPIs', () => {
    expect(source).toContain("import { isAdminTestArtifactFromParts } from '@/lib/admin/testArtifacts';");
    expect(source).toContain('function isProposalTestArtifact(proposal: ProposalItem): boolean');
    expect(source).toContain('const [showTestProposals, setShowTestProposals] = useState(false);');
    expect(source).toContain('const visibleProposals = showTestProposals ? proposals : proposals.filter((proposal) => !isProposalTestArtifact(proposal));');
    expect(source).toContain('const filtered = visibleProposals.filter((proposal) => {');
    expect(source).toContain('total: visibleProposals.length');
    expect(source).toContain('const totalValue = visibleProposals');
    expect(source).toContain('pressupostos de prova ocults');
    expect(source).toContain('Mostrar proves');
  });

  it('no mostra LeadDocument QUOTE com a pressupost viu', () => {
    expect(source).not.toContain('Pressupostos antics (LeadDocument)');
    expect(source).not.toContain('quote.fileUrl');
  });

  it('no permet acceptar SENT sense PDF canònic des del llistat', () => {
    expect(source).toContain('function hasCanonicalSentProposalArtifact(proposal: ProposalItem): boolean');
    expect(source).toContain("import { isSentLikeProposalStatus } from '@/lib/proposals/status';");
    expect(source).not.toContain("return status === 'SENT' || status === 'VIEWED';");
    expect(source).toContain('isSentLikeProposalStatus(proposal.status) && hasCanonicalSentProposalArtifact(proposal)');
    expect(source).toContain('isSentLikeProposalStatus(proposal.status) && !hasCanonicalSentProposalArtifact(proposal)');
    expect(source).toContain('Reparar PDF');
  });

  it('tracta VIEWED com a enviat en KPIs i filtre de pendents', () => {
    expect(source).toContain('function matchesProposalStatusFilter(proposal: ProposalItem, statusFilter: string): boolean');
    expect(source).toContain("if (statusFilter === 'SENT') return isSentLikeProposalStatus(proposal.status);");
    expect(source).toContain('SENT: visibleProposals.filter((proposal) => isSentLikeProposalStatus(proposal.status)).length');
    expect(source).toContain('if (!matchesProposalStatusFilter(proposal, statusFilter)) return false;');
  });
});
