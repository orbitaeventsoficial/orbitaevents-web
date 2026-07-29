import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/leads/LeadsSeasonClient.tsx'), 'utf8');
const adminCss = readFileSync(join(process.cwd(), 'app/admin/admin-shell.css'), 'utf8');

describe('LeadsSeasonClient bulk actions', () => {
  it('afegeix selecció múltiple a la vista llista i elimina entrades amb el DELETE canònic', () => {
    expect(source).toContain("import { fetchWithCsrf } from '@/lib/csrf';");
    expect(source).toContain('const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());');
    expect(source).toContain('async function handleBulkDeleteLeads()');
    expect(source).toContain("await fetchWithCsrf(`/api/admin/leads/${id}`, { method: 'DELETE' });");
    expect(source).toContain('Seleccionar entrades visibles');
    expect(source).toContain('Eliminar seleccionades');
    expect(source).toContain("l.kind === 'lead' && l.realStatus !== null");
  });

  it('amaga artefactes de prova de la lectura normal i dels KPIs', () => {
    expect(source).toContain("import { isAdminTestArtifactFromParts } from '@/lib/admin/testArtifacts';");
    expect(source).toContain('function isLeadTestArtifact(lead: LeadData): boolean');
    expect(source).toContain('const [showTestLeads, setShowTestLeads] = useState(false);');
    expect(source).toContain('const visibleLeads = useMemo(');
    expect(source).toContain('() => showTestLeads ? effectiveLeads : effectiveLeads.filter((lead) => !isLeadTestArtifact(lead))');
    expect(source).toContain('const totalValue  = visibleLeads.reduce((s, l) => s + l.value, 0);');
    expect(source).toContain('const openForecast = visibleLeads.reduce((s, l) => s + weightedLeadValue(l), 0);');
    expect(source).toContain('const laneLeads = visibleLeads.filter((l) => l.stage === stage);');
    expect(source).toContain('const sorted = [...visibleLeads.filter((l) => l.dateISO), ...visibleLeads.filter((l) => !l.dateISO)].sort((a, b) => a.dateISO.localeCompare(b.dateISO));');
    expect(source).toContain('Mostrar proves');
    expect(source).toContain('proves ocultes');
  });

  it('manté la llista operable en mòbil amb desplaçament horitzontal', () => {
    expect(adminCss).toContain('html.admin-mode .ap-leads-list { border: 1px solid var(--line); border-radius: var(--o-r-sm); overflow-x: auto; overflow-y: hidden; background: var(--panel); -webkit-overflow-scrolling: touch; }');
    expect(adminCss).toContain('html.admin-mode .ap-leads-listtbl { width: 100%; min-width: 760px; border-collapse: collapse; font-size: var(--o-text-sm); }');
  });
});
