/**
 * Tests del sistema de puntuació comercial (Lead Scoring).
 *
 * El "lead scoring" és un sistema que puntua cada consulta (lead) de 0 a 100
 * per ajudar l'operador a prioritzar les que tenen més probabilitat de
 * convertir-se en reserva.
 *
 * COMPONENTS DE LA PUNTUACIÓ:
 *
 * 1. ESTAT BASE: Cada estat del lead té una puntuació base.
 *    - NEW (acaba d'arribar): 20 punts
 *    - CONTACTED (s'ha contactat): 40 punts
 *    - QUOTE_SENT (pressupost enviat): 60 punts
 *    - NEGOTIATING (negociant): 72 punts
 *    - WON (reserva feta!): 95 punts
 *    - LOST (perdut): 5 punts
 *
 * 2. BONIFICACIONS: Coses que sumen punts perquè indiquen més interès.
 *    - Budget alt (≥2000 €): +14 punts
 *    - Té telèfon: +8 punts
 *    - Referit (boca-orella): +6 punts
 *    - Data viable (7-120 dies): +10 punts
 *
 * 3. PENALITZACIONS: Coses que resten punts perquè indiquen risc.
 *    - Esdeveniment ja passat: -20 punts
 *    - Sense seguiment >72h: -12 punts
 *    - Seguiment lent (>24h en leads nous): -6 punts
 *
 * 4. PROBABILITAT: Es calcula a partir de la puntuació.
 *    Fórmula: probabilitat_base_estat + (puntuació - 50) × 0.004
 *    Es limita entre 2% i 98%.
 *
 * 5. BANDA: LOW (<45), MEDIUM (45-69), HIGH (≥70)
 */

import { describe, it, expect } from 'vitest';
import { scoreLead, estimateLeadAmount } from '@/lib/services/commercialScoring';

// Helper: crea un lead base amb valors per defecte
function baseLead(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    status: 'NEW',
    createdAt: now,
    updatedAt: now,
    eventDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dies endavant
    budget: null as string | null,
    phone: null as string | null,
    eventLocation: null as string | null,
    guestCount: null as number | null,
    interestedPackId: null as string | null,
    source: null as string | null,
    ...overrides,
  };
}

describe('commercialScoring', () => {
  // ─── scoreLead ──────────────────────────────────────────────────────────────

  describe('scoreLead', () => {
    // --- Puntuació base per estat ---

    it('lead NEW: puntuació baixa (acaba d\'arribar, encara no sabem si és seriós)', () => {
      const result = scoreLead(baseLead({ status: 'NEW' }));
      expect(result.score).toBeGreaterThanOrEqual(15);
      expect(result.score).toBeLessThanOrEqual(50);
      expect(result.band).toBe('LOW');
    });

    it('lead WON: puntuació molt alta (ja ha reservat!)', () => {
      const result = scoreLead(baseLead({ status: 'WON', phone: '+34600000000', budget: '2500' }));
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.band).toBe('HIGH');
    });

    it('lead LOST: puntuació molt baixa (ja no hi ha res a fer)', () => {
      const result = scoreLead(baseLead({ status: 'LOST' }));
      expect(result.score).toBeLessThanOrEqual(30);
      expect(result.band).toBe('LOW');
    });

    it('lead QUOTE_SENT amb budget: puntuació mitjana-alta', () => {
      const result = scoreLead(baseLead({
        status: 'QUOTE_SENT',
        budget: '1500',
        phone: '+34611111111',
      }));
      expect(result.score).toBeGreaterThanOrEqual(45);
      expect(result.band).not.toBe('LOW');
    });

    // --- Bonificacions ---

    it('budget alt (≥2000€) dona bonificació significativa', () => {
      const senseBudget = scoreLead(baseLead({ status: 'CONTACTED' }));
      const ambBudget = scoreLead(baseLead({ status: 'CONTACTED', budget: '2500' }));
      expect(ambBudget.score).toBeGreaterThan(senseBudget.score);
      expect(ambBudget.reasons).toContain('Pressupost alt');
    });

    it('tenir telèfon indica interès real (+8 punts)', () => {
      const senseTel = scoreLead(baseLead({ status: 'CONTACTED' }));
      const ambTel = scoreLead(baseLead({ status: 'CONTACTED', phone: '+34699000111' }));
      expect(ambTel.score).toBeGreaterThan(senseTel.score);
      expect(ambTel.reasons).toContain('Té telèfon');
    });

    it('lead referit (boca-orella) té bonus perquè sol convertir millor', () => {
      const normal = scoreLead(baseLead({ status: 'CONTACTED' }));
      const referit = scoreLead(baseLead({ status: 'CONTACTED', source: 'REFERRAL' }));
      expect(referit.score).toBeGreaterThan(normal.score);
      expect(referit.reasons).toContain('Lead referit');
    });

    // --- Penalitzacions ---

    it('esdeveniment ja passat: penalització forta (-20 punts)', () => {
      const futur = scoreLead(baseLead({ status: 'CONTACTED' }));
      const passat = scoreLead(baseLead({
        status: 'CONTACTED',
        eventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dies enrere
      }));
      expect(passat.score).toBeLessThan(futur.score);
      expect(passat.riskFlags).toContain('Esdeveniment passat');
    });

    it('sense seguiment >72h: penalització per descuit', () => {
      const recent = scoreLead(baseLead({ status: 'CONTACTED' }));
      const abandonat = scoreLead(baseLead({
        status: 'CONTACTED',
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 dies sense tocar
      }));
      expect(abandonat.score).toBeLessThan(recent.score);
      expect(abandonat.riskFlags).toContain('Sense seguiment 72h+');
    });

    // --- Clamping (límits de seguretat) ---

    it('la puntuació mai baixa de 0 ni puja de 100', () => {
      // Lead amb totes les penalitzacions possibles
      const pitjor = scoreLead(baseLead({
        status: 'LOST',
        eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      }));
      expect(pitjor.score).toBeGreaterThanOrEqual(0);
      expect(pitjor.score).toBeLessThanOrEqual(100);
    });

    it('la probabilitat està entre 2% i 98% (mai 0% ni 100%)', () => {
      const result = scoreLead(baseLead({ status: 'WON', phone: '+34600', budget: '5000' }));
      expect(result.probability).toBeGreaterThanOrEqual(0.02);
      expect(result.probability).toBeLessThanOrEqual(0.98);

      const pitjor = scoreLead(baseLead({ status: 'LOST' }));
      expect(pitjor.probability).toBeGreaterThanOrEqual(0.02);
    });

    // --- Determinisme temporal (`now` injectat) ---

    it('determinisme: dos scoring amb el mateix `now` lògic donen el mateix resultat', () => {
      const now = new Date('2026-04-19T10:00:00Z');
      const input = baseLead({
        status: 'CONTACTED',
        updatedAt: new Date('2026-04-16T10:00:00Z'),
        eventDate: new Date('2026-05-19T10:00:00Z'),
        now,
      });
      const a = scoreLead(input);
      const b = scoreLead(input);
      expect(a.score).toBe(b.score);
      expect(a.band).toBe(b.band);
      expect(a.riskFlags).toEqual(b.riskFlags);
    });

    it('determinisme: la frontera de 72h stale respecta el `now` injectat', () => {
      const baseInput = baseLead({
        status: 'CONTACTED',
        updatedAt: new Date('2026-04-16T10:00:00Z'),
      });
      const just71h = scoreLead({
        ...baseInput,
        now: new Date('2026-04-19T09:00:00Z'),
      });
      expect(just71h.riskFlags).not.toContain('Sense seguiment 72h+');

      const just73h = scoreLead({
        ...baseInput,
        now: new Date('2026-04-19T11:00:00Z'),
      });
      expect(just73h.riskFlags).toContain('Sense seguiment 72h+');
      expect(just73h.score).toBeLessThan(just71h.score);
    });

    // --- Bandes (LOW / MEDIUM / HIGH) ---

    it('score ≥ 70 → HIGH, score ≥ 45 → MEDIUM, resta → LOW', () => {
      // Podem verificar les bandes indirectament
      const low = scoreLead(baseLead({ status: 'NEW' }));
      expect(['LOW', 'MEDIUM']).toContain(low.band);

      const high = scoreLead(baseLead({
        status: 'NEGOTIATING',
        budget: '3000',
        phone: '+34699',
        source: 'REFERRAL',
      }));
      expect(high.band).toBe('HIGH');
    });
  });

  // ─── estimateLeadAmount ─────────────────────────────────────────────────────
  // Estima l'import d'un lead quan no hi ha preu confirmat.
  // Serveix per fer projeccions de facturació al pipeline comercial.

  describe('estimateLeadAmount', () => {
    it('si el lead té budget, l\'usa directament', () => {
      expect(estimateLeadAmount({ budget: '2500' })).toBe(2500);
    });

    it('si no té budget però és un casament, estima un import alt', () => {
      const amount = estimateLeadAmount({ eventType: 'WEDDING' });
      expect(amount).toBe(1800);
    });

    it('si no té budget ni tipus, fallback de 1000 €', () => {
      const amount = estimateLeadAmount({});
      expect(amount).toBe(1000);
    });

    it('budget amb format europeu (comes) es parseja correctament', () => {
      expect(estimateLeadAmount({ budget: '1.500,50' })).toBeCloseTo(1500.5, 1);
    });

    it('budget invàlid (text) → usa fallback per tipus', () => {
      expect(estimateLeadAmount({ budget: 'no ho sé', eventType: 'BIRTHDAY' })).toBe(850);
    });
  });
});
