import { describe, expect, it } from 'vitest';
import { extractLeadDataFromText } from '@/lib/services/leadTextExtractionService';

describe('extractLeadDataFromText', () => {
  it('extreu dades clau d’un WhatsApp copiat quan la IA no respon', () => {
    const result = extractLeadDataFromText(`
      WhatsApp 10:42
      Bon dia, sóc l'Adrià de l'Associació de Veïns de Rubí.
      Volem fer una festa privada el 15 de setembre de 2026 a Rubí.
      Serem unes 80 persones i començaríem a les 22:00.
      El pressupost és 1.500€.
      Em podeu escriure a adria@example.com o trucar al 699 123 456.
    `);

    expect(result.name).toBe('Adrià');
    expect(result.email).toBe('adria@example.com');
    expect(result.phone).toBe('699123456');
    expect(result.eventType).toBe('PRIVATE_PARTY');
    expect(result.eventDate).toBe('2026-09-15');
    expect(result.eventTime).toBe('22:00');
    expect(result.eventLocation).toBe('Rubí');
    expect(result.guestCount).toBe('80');
    expect(result.budget).toBe('1.500€');
    expect(result.source).toBe('WHATSAPP');
    expect(result.message).toContain('Associació de Veïns de Rubí');
  });

  it('extreu camps etiquetats de text lliure', () => {
    const result = extractLeadDataFromText(`
      Nom: Maria no està etiquetat, però me llamo Maria Lopez.
      Teléfono: 0034 612 345 678
      DNI: 12345678A
      Dirección: Carrer Major 10, Terrassa
      Lugar: Masia Can Roda, Girona
      Fecha: 20/06/2026
      Horari: 20:00 a 03:00
      Seremos 120 personas.
      Presupuesto: entre 1500 y 2000 euros
      boda
    `);

    expect(result.name).toBe('Maria Lopez');
    expect(result.phone).toBe('+34612345678');
    expect(result.dni).toBe('12345678A');
    expect(result.address).toBe('Carrer Major 10, Terrassa');
    expect(result.eventLocation).toBe('Masia Can Roda, Girona');
    expect(result.eventDate).toBe('2026-06-20');
    expect(result.eventTime).toBe('20:00');
    expect(result.eventEndTime).toBe('03:00');
    expect(result.guestCount).toBe('120');
    expect(result.budget).toContain('1500');
    expect(result.eventType).toBe('WEDDING');
  });

  it('extreu hora final de rang en text de WhatsApp', () => {
    const result = extractLeadDataFromText(`
      Hola, soc la Cristina.
      Necessitem DJ el 11/07/2026 de 18:00 a 20:00 a Arenys de Munt per 150 persones.
    `);

    expect(result.eventTime).toBe('18:00');
    expect(result.eventEndTime).toBe('20:00');
  });

  it('ignora timestamps de WhatsApp i prioritza la data real del client', () => {
    const result = extractLeadDataFromText(`
      [18:03, 2/7/2026] Òrbita events: Hola Estel
      [18:03, 2/7/2026] Estel Giralt Canyamars: Hola, soc Estel Giralt
      [18:03, 2/7/2026] Òrbita events: Passam si pots ubi, data, horari i el que parlàvem no? 2h de Dj. Et passaré dossier amb les possibilitats i preus
      [18:03, 2/7/2026] Estel Giralt Canyamars: El mail es estel.giralt@gmail.com
      [18:04, 2/7/2026] Estel Giralt Canyamars: Data 25/7/2026. Lloc Canyamars-Dosrius. Horari 9 a 11
      [18:05, 2/7/2026] Estel Giralt Canyamars: Del vespre
    `);

    expect(result.name).toBe('Estel Giralt');
    expect(result.email).toBe('estel.giralt@gmail.com');
    expect(result.eventDate).toBe('2026-07-25');
    expect(result.eventLocation).toBe('Canyamars-Dosrius');
    expect(result.eventTime).toBe('21:00');
    expect(result.eventEndTime).toBe('23:00');
  });

  it('recupera contacte i ubicacio en un WhatsApp multi-bolo sense inventar data parcial', () => {
    const result = extractLeadDataFromText(`
      [11:50, 1/7/2026] +376 339 491: Aiiii m'encanta el video del Bingo musical
      [11:53, 1/7/2026] Òrbita events: Alba + cognom
      [11:54, 1/7/2026] +376 339 491: Alba Orna - albaop@gmail.com
      [11:54, 1/7/2026] +376 339 491: perdo... 17h es l'Eglesia però el show hauria de començar despres del sopar
      [11:55, 1/7/2026] +376 339 491: Si, el dia 5 hauria de ser el bingo musical... sera una celebració d'unes 30 persones
      [11:56, 1/7/2026] +376 339 491: I la boda de mes fiestuki que som 80 és el 26
      [12:12, 1/7/2026] +376 339 491: La ubicació del dia 5 és restaurant Calma a l'Aldosa
      [12:12, 1/7/2026] +376 339 491: La ubicació del dia 26 és Mas d'en Roqueta - Aravell (La Seu d'Urgell)
    `);

    expect(result.name).toBe('Alba Orna');
    expect(result.email).toBe('albaop@gmail.com');
    expect(result.phone).toBe('+376339491');
    expect(result.eventType).toBe('OTHER');
    expect(result.eventDate).toBe('');
    expect(result.eventLocation).toBe("restaurant Calma a l'Aldosa");
    expect(result.guestCount).toBe('30');
  });
});
