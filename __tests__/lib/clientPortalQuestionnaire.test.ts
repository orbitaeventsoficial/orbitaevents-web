import { describe, expect, it } from 'vitest';
import { buildClientPortalQuestionnairePath } from '@/lib/clientPortalQuestionnaire';

describe('buildClientPortalQuestionnairePath', () => {
  it('construeix la ruta interna del qüestionari dins del portal', () => {
    expect(buildClientPortalQuestionnairePath('ca', 'token-123')).toBe('/ca/portal/token-123/questionnaire');
    expect(buildClientPortalQuestionnairePath('en', 'abc')).toBe('/en/portal/abc/questionnaire');
  });
});
