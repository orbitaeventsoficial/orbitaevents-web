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
    expect(result.guestCount).toBe('120');
    expect(result.budget).toContain('1500');
    expect(result.eventType).toBe('WEDDING');
  });
});
