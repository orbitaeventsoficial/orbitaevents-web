import { describe, expect, it } from 'vitest';
import {
  buildQuestionnaireQuestionId,
  createQuestionnaireQuestion,
} from '@/lib/admin/questionnaireQuestionFactory';

describe('questionnaireQuestionFactory', () => {
  it('genera ids estables amb prefix de pregunta', () => {
    expect(buildQuestionnaireQuestionId(1_700_000_000_000)).toMatch(/^q-[a-z0-9]+-[a-z0-9]+$/);
  });

  it('evita ids duplicats dins el mateix mil·lisegon', () => {
    const now = 1_700_000_000_000;

    expect(buildQuestionnaireQuestionId(now)).not.toBe(buildQuestionnaireQuestionId(now));
  });

  it('crea una pregunta nova amb defaults del formulari admin', () => {
    expect(createQuestionnaireQuestion()).toMatchObject({
      type: 'text',
      label: '',
      required: false,
    });
  });
});
