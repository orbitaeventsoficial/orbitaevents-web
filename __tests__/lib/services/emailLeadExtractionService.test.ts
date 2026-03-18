import { describe, it, expect } from 'vitest';
import { extractLeadDataFromEmail } from '@/lib/services/emailLeadExtractionService';

describe('extractLeadDataFromEmail', () => {
  describe('name extraction', () => {
    it('usa fromName si disponible', () => {
      const result = extractLeadDataFromEmail({
        fromName: 'Joan Garcia',
        fromAddress: 'joan@example.com',
      });
      expect(result.name).toBe('Joan Garcia');
    });

    it('genera nom de fromAddress si no hi ha fromName', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'joan.garcia@example.com',
      });
      expect(result.name).toBe('Joan Garcia');
    });

    it('neteja separadors del email', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'maria_lopez-fernandez@test.com',
      });
      expect(result.name).toBe('Maria Lopez Fernandez');
    });
  });

  describe('email normalization', () => {
    it('normalitza a minúscules', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: '  Joan@Example.COM  ',
      });
      expect(result.email).toBe('joan@example.com');
    });
  });

  describe('phone extraction', () => {
    it('extreu telèfon etiquetat', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Hola, el meu telèfon és +34612345678.',
      });
      expect(result.phone).toBe('+34612345678');
    });

    it('extreu telèfon WhatsApp', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'WhatsApp: 612 345 678',
      });
      expect(result.phone).toBe('612345678');
    });

    it('extreu telèfon inline sense etiqueta', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Contacta al 612345678 si us plau.',
      });
      expect(result.phone).toBe('612345678');
    });

    it('ignora números massa curts', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Codi 12345.',
      });
      expect(result.phone).toBeUndefined();
    });

    it('converteix 00 a +', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Trucar a 0034612345678',
      });
      expect(result.phone).toBe('+34612345678');
    });
  });

  describe('event type inference', () => {
    it.each([
      ['Vull contractar DJ per la nostra boda', 'WEDDING'],
      ['Festa de cumpleaños', 'BIRTHDAY'],
      ['Evento corporativo empresa', 'CORPORATE'],
      ['Primera comunión de mi hijo', 'COMMUNION'],
      ['Bateig familiar', 'BAPTISM'],
      ['Fiesta de graduación', 'GRADUATION'],
      ['Fiesta privada al jardí', 'PRIVATE_PARTY'],
      ['Hola, vull informació', 'OTHER'],
    ])('"%s" → %s', (text, expected) => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: text,
      });
      expect(result.eventType).toBe(expected);
    });
  });

  describe('event date extraction', () => {
    it('extreu data amb nom de mes (castellà)', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'La boda es el 15 de septiembre de 2026.',
      });
      expect(result.eventDate).toEqual(new Date(2026, 8, 15));
    });

    it('extreu data amb nom de mes (català)', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'El casament és el 20 de juny de 2026.',
      });
      expect(result.eventDate).toEqual(new Date(2026, 5, 20));
    });

    it('extreu data inline DD/MM/YYYY', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'La festa serà el 20/06/2026 a Barcelona.',
      });
      expect(result.eventDate).toEqual(new Date(2026, 5, 20));
    });

    it('retorna undefined sense data', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Vull informació sobre DJ.',
      });
      expect(result.eventDate).toBeUndefined();
    });
  });

  describe('guest count extraction', () => {
    it('extreu convidats (persones)', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Hi vindran 80 persones.',
      });
      expect(result.guestCount).toBe(80);
    });

    it('extreu convidats (personas)', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Seremos unas 120 personas.',
      });
      expect(result.guestCount).toBe(120);
    });

    it('retorna undefined sense convidats', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Vull un DJ.',
      });
      expect(result.guestCount).toBeUndefined();
    });
  });

  describe('budget extraction', () => {
    it('extreu pressupost etiquetat', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Presupuesto: 2000-3000 euros',
      });
      expect(result.budget).toContain('2000');
    });

    it('extreu import en euros', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Disposem de 1500 euros per a la festa.',
      });
      expect(result.budget).toContain('1500');
    });

    it('retorna undefined sense pressupost', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Vull informació.',
      });
      expect(result.budget).toBeUndefined();
    });
  });

  describe('location extraction', () => {
    it('extreu ubicació etiquetada', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Lugar: Masia Can Roda, Girona',
      });
      expect(result.eventLocation).toContain('Masia Can Roda');
    });

    it('extreu ubicació etiquetada (lloc)', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Lloc: Barcelona Centre Comercial',
      });
      expect(result.eventLocation).toContain('Barcelona');
    });
  });

  describe('schedule extraction', () => {
    it('extreu horari rang', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Horari: de 20:00 a 03:00',
      });
      expect(result.eventSchedule).toContain('20:00');
      expect(result.eventSchedule).toContain('03:00');
    });

    it('extreu "a partir de"', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'La festa comença a partir de las 22:00',
      });
      expect(result.eventSchedule).toContain('22:00');
    });
  });

  describe('commercial summary', () => {
    it('inclou intent detectat', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Vull un presupuesto per una boda.',
      });
      expect(result.commercialSummary).toContain('Sol·licitud de pressupost');
    });

    it('contractació intent', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Volem reservar el DJ per la festa.',
      });
      expect(result.commercialSummary).toContain('Contractació');
    });
  });

  describe('important unknowns', () => {
    it('detecta línies amb senyals comercials', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Necessitem factura amb NIF.\nCal confirmar urgent.\nGràcies.',
      });
      expect(result.importantUnknowns).toBeDefined();
      expect(result.importantUnknowns!.length).toBeGreaterThan(0);
    });

    it('retorna undefined sense senyals', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Hola',
      });
      expect(result.importantUnknowns).toBeUndefined();
    });
  });

  describe('message', () => {
    it('inclou body com a message', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'Hola, estic interessat en un DJ per una boda.',
      });
      expect(result.message).toBe('Hola, estic interessat en un DJ per una boda.');
    });

    it('retorna undefined si body buit', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: '',
      });
      expect(result.message).toBeUndefined();
    });

    it('trunca message a 4000 chars', () => {
      const result = extractLeadDataFromEmail({
        fromAddress: 'test@test.com',
        bodyText: 'A'.repeat(5000),
      });
      expect(result.message!.length).toBe(4000);
    });
  });

  describe('full email parsing', () => {
    it('extreu tot d\'un email realista', () => {
      const result = extractLeadDataFromEmail({
        fromName: 'Maria López',
        fromAddress: 'maria@gmail.com',
        subject: 'Presupuesto boda septiembre',
        bodyText: `Hola,

Estic interessada en contractar un DJ per la nostra boda.

El 15 de septiembre de 2026.
Lloc: Masia Can Roda, Girona
Serem unes 120 personas.
Horari: 20:00 a 03:00
Presupuesto: entre 1500 y 2000 euros

El meu telèfon és +34699123456.

Gràcies,
Maria`,
      });

      expect(result.name).toBe('Maria López');
      expect(result.email).toBe('maria@gmail.com');
      expect(result.phone).toBe('+34699123456');
      expect(result.eventType).toBe('WEDDING');
      expect(result.eventDate).toEqual(new Date(2026, 8, 15));
      expect(result.guestCount).toBe(120);
      expect(result.eventLocation).toContain('Masia Can Roda');
      expect(result.eventSchedule).toContain('20:00');
      expect(result.budget).toBeDefined();
      expect(result.message).toContain('Estic interessada');
      expect(result.commercialSummary).toBeDefined();
    });
  });
});
