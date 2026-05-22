import type { QuestionnaireQuestion } from '@/lib/services/questionnaireService';

let questionnaireQuestionSequence = 0;

export function buildQuestionnaireQuestionId(now = Date.now()): string {
  questionnaireQuestionSequence = (questionnaireQuestionSequence + 1) % Number.MAX_SAFE_INTEGER;
  return `q-${now.toString(36)}-${questionnaireQuestionSequence.toString(36)}`;
}

export function createQuestionnaireQuestion(): QuestionnaireQuestion {
  return {
    id: buildQuestionnaireQuestionId(),
    type: 'text',
    label: '',
    required: false,
  };
}
