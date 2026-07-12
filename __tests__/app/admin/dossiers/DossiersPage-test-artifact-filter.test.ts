import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'app/admin/dossiers/page.tsx'), 'utf8');

describe('DossiersPage test artifact filter', () => {
  it('amaga dossiers de prova del llistat principal sense esborrar-los', () => {
    expect(source).toContain("import { isAdminTestArtifactFromParts, isAdminTestArtifactText } from '@/lib/admin/testArtifacts';");
    expect(source).toContain('function isTestDossierArtifact(dossier: DossierRow): boolean');
    expect(source).toContain('return isAdminTestArtifactFromParts([');
    expect(source).toContain('const savedDossiers = showTestDossiers ? dossiers : dossiers.filter((d) => !isTestDossierArtifact(d));');
    expect(source).toContain('const hiddenTestDossiers = dossiers.length - savedDossiers.length;');
    expect(source).toContain('const savedDossierItems: DossierSavedListItem[] = savedDossiers.map((d) => {');
    expect(source).toContain('<DossierSavedList items={savedDossierItems} />');
  });

  it('amaga suggeriments de prova i carrega prou candidats per trobar suggeriments reals', () => {
    expect(source).toContain('loadDossierDraftSuggestions(12)');
    expect(source).toContain('function isTestDraftSuggestionArtifact(suggestion: { name: string }): boolean');
    expect(source).toContain('return isAdminTestArtifactText(suggestion.name);');
    expect(source).toContain('const nonTestDraftSuggestions = draftSuggestions.filter((suggestion) => !isTestDraftSuggestionArtifact(suggestion));');
    expect(source).toContain('const visibleDraftSuggestions = (showTestDossiers ? draftSuggestions : nonTestDraftSuggestions).slice(0, 3);');
    expect(source).toContain('{visibleDraftSuggestions.map((suggestion) => (');
  });

  it('exposa un toggle explícit per revisar els dossiers de prova', () => {
    expect(source).toContain('showTestDossiers?: string;');
    expect(source).toContain("searchParams?.showTestDossiers === '1'");
    expect(source).toContain('buildDossierListVisibilityHref(searchParams, !showTestDossiers)');
    expect(source).toContain('Mostrar prova');
    expect(source).toContain('Ocultar prova');
    expect(source).toContain('elements de prova ocults');
  });
});
