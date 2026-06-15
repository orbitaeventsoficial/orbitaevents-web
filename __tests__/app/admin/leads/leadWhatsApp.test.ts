import { describe, expect, it } from 'vitest';

import { buildLeadWhatsAppHref, leadWhatsAppGreeting } from '@/app/admin/leads/leadWhatsApp';

describe('leadWhatsApp', () => {
  it('centralitza el missatge inicial del lead', () => {
    expect(leadWhatsAppGreeting('Cristina')).toBe(
      "Hola Cristina! Et contactem des d'Òrbita Events per la teva sol·licitud.",
    );
  });

  it('neteja el telefon i codifica el missatge', () => {
    const href = buildLeadWhatsAppHref('+34 600 111 222', 'Cristina Rey');

    expect(href).toBe(
      "https://wa.me/34600111222?text=Hola%20Cristina%20Rey!%20Et%20contactem%20des%20d'%C3%92rbita%20Events%20per%20la%20teva%20sol%C2%B7licitud.",
    );
  });

  it('retorna null si no hi ha telefon utilitzable', () => {
    expect(buildLeadWhatsAppHref(null, 'Cristina')).toBeNull();
    expect(buildLeadWhatsAppHref('---', 'Cristina')).toBeNull();
  });
});
