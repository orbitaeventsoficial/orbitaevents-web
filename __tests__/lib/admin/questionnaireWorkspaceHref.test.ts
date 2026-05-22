import { describe, expect, it } from 'vitest';
import { buildQuestionnaireHref } from '@/lib/admin/questionnaireWorkspaceHref';

describe('buildQuestionnaireHref', () => {
  it('construeix la ruta de detall questionnaire', () => {
    expect(buildQuestionnaireHref('questionnaire-123')).toBe('/admin/questionnaires/questionnaire-123');
  });
});
