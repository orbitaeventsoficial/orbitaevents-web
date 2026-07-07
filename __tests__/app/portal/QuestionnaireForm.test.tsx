import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import QuestionnaireForm from '@/app/[locale]/portal/[token]/questionnaire/QuestionnaireForm';
import type { QuestionnaireResponseDTO, QuestionnaireTemplateDTO } from '@/lib/services/questionnaireService';

const template: QuestionnaireTemplateDTO = {
  id: 'tpl-1',
  title: 'Pre-event',
  description: null,
  isActive: true,
  questions: [
    {
      id: 'music',
      type: 'text',
      label: 'Music style',
      required: true,
    },
    {
      id: 'songs',
      type: 'multiselect',
      label: 'Songs',
      options: ['One', 'Two'],
      required: false,
    },
    {
      id: 'lighting',
      type: 'select',
      label: 'Lighting',
      options: ['Warm', 'Club'],
      required: true,
    },
  ],
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-01'),
};

const baseMessages = {
  alreadySubmitted: 'Already submitted',
  edit: 'Edit',
  submit: 'Submit answers',
  saving: 'Saving...',
  success: 'Saved',
  successBack: 'Back',
  error: 'Error saving',
  required: 'required field',
  noAnswer: 'No answer',
  selectPlaceholder: 'Choose an option',
};

describe('QuestionnaireForm', () => {
  it('mostra lerror required en el locale del portal i no en catala hardcoded', () => {
    render(
      <QuestionnaireForm
        token="portal-token"
        template={template}
        existingResponse={null}
        messages={{
          ...baseMessages,
          requiredField: 'The "{field}" field is required.',
        }}
      />,
    );

    expect(screen.getByRole('textbox', { name: /Music style\s*\(required field\)/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Submit answers' }));

    expect(screen.getByRole('alert')).toHaveTextContent('The "Music style" field is required.');
    expect(screen.queryByText(/és un camp obligatori/i)).not.toBeInTheDocument();
  });

  it('permet que el castellà formategi la frase completa', () => {
    render(
      <QuestionnaireForm
        token="portal-token"
        template={template}
        existingResponse={null}
        messages={{
          ...baseMessages,
          submit: 'Enviar respuestas',
          required: 'campo obligatorio',
          requiredField: 'El campo "{field}" es obligatorio.',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }));

    expect(screen.getByText('El campo "Music style" es obligatorio.')).toBeInTheDocument();
    expect(screen.queryByText(/és un/i)).not.toBeInTheDocument();
  });

  it('mostra un fallback localitzat per respostes buides al resum', () => {
    const existingResponse: QuestionnaireResponseDTO = {
      id: 'response-1',
      bookingId: 'booking-1',
      templateId: 'tpl-1',
      answers: { music: '', songs: [], lighting: 'Warm' },
      submittedAt: new Date('2026-07-02'),
      createdAt: new Date('2026-07-02'),
    };

    render(
      <QuestionnaireForm
        token="portal-token"
        template={template}
        existingResponse={existingResponse}
        messages={{
          ...baseMessages,
          requiredField: 'The "{field}" field is required.',
          noAnswer: 'No answer',
        }}
      />,
    );

    expect(screen.getAllByText('No answer')).toHaveLength(2);
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('mostra un placeholder localitzat al select del qüestionari', () => {
    render(
      <QuestionnaireForm
        token="portal-token"
        template={template}
        existingResponse={null}
        messages={{
          ...baseMessages,
          requiredField: 'The "{field}" field is required.',
          selectPlaceholder: 'Choose an option',
        }}
      />,
    );

    expect(screen.getByRole('option', { name: 'Choose an option' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Lighting\s*\(required field\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '—' })).not.toBeInTheDocument();
  });
});
