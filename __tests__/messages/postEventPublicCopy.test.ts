import { describe, expect, it } from 'vitest';
import caMessages from '@/messages/ca.json';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

const messages = {
  ca: caMessages,
  es: esMessages,
  en: enMessages,
} as const;

describe('post-event public copy', () => {
  it('demana opinio al CTA de survey sense feedback legacy', () => {
    expect(messages.ca.emails.survey_request.cta).toBe(
      'La vostra opinió ens ajuda a millorar i continuar creant experiències increïbles.'
    );
    expect(messages.es.emails.survey_request.cta).toBe(
      'Vuestra opinión nos ayuda a mejorar y a seguir creando experiencias increíbles.'
    );
    expect(messages.en.emails.survey_request.cta).toBe(
      'Your opinion helps us improve and keep creating incredible experiences.'
    );

    expect(messages.en.emails.survey_request.cta).not.toMatch(/feedback/i);
  });

  it('agraeix opinio al formulari gamificat sense feedback visible', () => {
    expect(messages.ca.testimonialForm.gamified.emojiMessages['3']).toBe('Gràcies per la teva opinió!');
    expect(messages.es.testimonialForm.gamified.emojiMessages['3']).toBe('¡Gracias por tu opinión!');
    expect(messages.en.testimonialForm.gamified.emojiMessages['3']).toBe('Thanks for your opinion!');

    expect(messages.es.testimonialForm.gamified.emojiMessages['3']).not.toMatch(/feedback/i);
    expect(messages.en.testimonialForm.gamified.emojiMessages['3']).not.toMatch(/feedback/i);
  });
});
