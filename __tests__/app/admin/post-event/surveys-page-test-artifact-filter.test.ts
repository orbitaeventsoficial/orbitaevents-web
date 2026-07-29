import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('/admin/post-event/surveys test artifact visibility', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/admin/post-event/surveys/page.tsx'),
    'utf8'
  );

  it('uses the canonical admin test artifact detector', () => {
    expect(source).toContain("import { isAdminTestArtifactFromParts, isAdminTestBookingArtifact } from '@/lib/admin/testArtifacts';");
    expect(source).toContain('function isTestSurveyArtifact(survey: SurveyRow): boolean');
    expect(source).toContain('isAdminTestBookingArtifact(survey.booking)');
    expect(source).toContain('survey.bestMoment');
  });

  it('keeps normal survey KPIs based on visible surveys only', () => {
    expect(source).toContain('const visibleSurveys = showTestSurveys');
    expect(source).toContain('const totalVisible = visibleSurveys.length');
    expect(source).toContain('visibleSurveys.reduce');
    expect(source).toContain('visibleSurveys.filter');
    expect(source).toContain('{totalVisible}');
  });

  it('uses survey wording instead of visible feedback legacy copy', () => {
    expect(source).toContain('Valoracions, NPS i testimonis dels clients');
    expect(source).not.toContain('Feedback i valoracions dels clients');
  });

  it('keeps an explicit review mode for hidden E2E evidence', () => {
    expect(source).toContain('showTestSurveys');
    expect(source).toContain('Mostrar proves');
    expect(source).toContain('Ocultar proves');
    expect(source).toContain('Només hi ha enquestes de prova ocultes');
  });
});
