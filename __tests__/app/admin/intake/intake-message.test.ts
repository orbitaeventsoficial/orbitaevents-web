import { describe, expect, it } from 'vitest';
import { isProbablyRawLeadTextMessage, mergeExtractedLeadMessage } from '@/app/admin/intake/intake-message';

describe('intake extracted message merge', () => {
  const rawWhatsapp = `
    [14:24, 7/7/2026] +34 673 04 83 68: Bon dia, Albert,
    Em poso en contacte amb vostè perquè estem organitzant una vesprada de casal a una escola de Cornellà i ens agradaria saber si té disponibilitat i ens pot fer arribar un pressupost.
    [14:36, 7/7/2026] +34 673 04 83 68: Albert Aujas
    [14:36, 7/7/2026] +34 673 04 83 68: casals@controlplay.cat
  `;

  it('detecta text brut i no el cola a notes', () => {
    const rawMessage = rawWhatsapp.replace(/\s+/g, ' ').trim();

    expect(isProbablyRawLeadTextMessage(rawMessage, rawWhatsapp)).toBe(true);
    expect(mergeExtractedLeadMessage('Nota humana prèvia', rawMessage, rawWhatsapp)).toBe('Nota humana prèvia');
  });

  it('afegeix resum sintetic sense aixafar ni duplicar notes existents', () => {
    const summary = "vesprada de casal · activitat d'una hora · al pati d'una escola.";
    const first = mergeExtractedLeadMessage('Nota humana prèvia', summary, rawWhatsapp);
    const second = mergeExtractedLeadMessage(first, summary, rawWhatsapp);

    expect(first).toBe(`Nota humana prèvia\n\n${summary}`);
    expect(second).toBe(first);
  });
});
