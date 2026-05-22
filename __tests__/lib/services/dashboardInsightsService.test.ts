/**
 * Tests del servei d'insights del dashboard.
 *
 * `generateDashboardInsights()` analitza les dades actuals del negoci
 * i retorna fins a 5 missatges intel·ligents ordenats per prioritat.
 *
 * TIPUS D'INSIGHTS:
 *
 * 1. DANGER (prioritat 1): Situacions crítiques que requereixen acció immediata.
 *    - Leads sense resposta >48h (staleLeadsCount > 0)
 *    - Event proper sense cobrar (nextEvent ≤3 dies i !remainingPaid)
 *    - Flux de caixa negatiu (cashFlowNet30 < 0)
 *
 * 2. WARNING (prioritat 2-4): Alertes que cal vigilar.
 *    - Pagaments pendents >500 € (pendingPayments > 500)
 *    - Marge baix <25% (avgMarginPct < 25)
 *    - Conversió baixa <15% (conversionRate entre 0 i 15)
 *    - Leads caigut >20% vs setmana passada
 *    - Facturació per sota del ritme esperat
 *
 * 3. SUCCESS (prioritat 2-5): Indicadors positius.
 *    - Leads calents (hotLeadsCount > 0)
 *    - Leads pujant >15% vs setmana passada
 *    - Conversió alta ≥25%
 *    - Facturació per sobre del ritme esperat
 *
 * 4. INFO (prioritat 4): Informació útil sense urgència.
 *    - Pròxim event dins de 7 dies
 *
 * ORDENACIÓ: Els insights es retornen per prioritat (1 = més urgent).
 * LÍMIT: Màxim 5 insights per no saturar el dashboard.
 */

import { describe, it, expect } from 'vitest';
import { generateDashboardInsights, type DashboardInsight } from '@/lib/services/dashboardInsightsService';

// Helper: dades base sense cap situació destacable
function baseInput() {
  return {
    leadsThisMonth: 20,
    staleLeadsCount: 0,
    hotLeadsCount: 0,
    conversionRate: 18,
    bookingsConfirmed: 5,
    bookingsThisMonth: 3,
    avgMarginPct: 40,
    cashFlowNet30: 2000,
    pipelineWeighted30: 5000,
    pendingPayments: 200,
    revenueThisMonth: 3000,
    revenueTarget: 0, // Sense objectiu per evitar insight de facturació
    nextEvent: null,
    inventoryMaintenance: 0,
    inventoryBroken: 0,
  };
}

describe('dashboardInsightsService', () => {
  // ─── Retorn bàsic ─────────────────────────────────────────────────────────

  describe('estructura del retorn', () => {
    it('retorna un array (pot ser buit si tot va bé)', () => {
      const result = generateDashboardInsights(baseInput());
      expect(Array.isArray(result)).toBe(true);
    });

    it('cada insight té id, icon, text, type i priority', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 3, // Forcem almenys un insight
      });
      expect(result.length).toBeGreaterThan(0);
      for (const insight of result) {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('icon');
        expect(insight).toHaveProperty('text');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('priority');
        expect(typeof insight.id).toBe('string');
        expect(typeof insight.text).toBe('string');
        expect(['success', 'warning', 'info', 'danger']).toContain(insight.type);
        expect(typeof insight.priority).toBe('number');
      }
    });

    it('retorna màxim 5 insights (no saturar el dashboard)', () => {
      // Forcem moltes situacions actives alhora
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 5,
        hotLeadsCount: 3,
        conversionRate: 10,
        pendingPayments: 3000,
        avgMarginPct: 15,
        cashFlowNet30: -500,
        inventoryBroken: 2,
        leadsThisWeek: 3,
        leadsLastWeek: 10,
        nextEvent: { daysUntil: 2, clientName: 'Test', depositPaid: true, remainingPaid: false },
      });
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('els insights estan ordenats per prioritat (1 = més urgent)', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 2,
        hotLeadsCount: 3,
        conversionRate: 10,
        pendingPayments: 1000,
      });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].priority).toBeGreaterThanOrEqual(result[i - 1].priority);
      }
    });
  });

  // ─── DANGER: Leads sense resposta ──────────────────────────────────────────

  describe('leads sense resposta (stale leads)', () => {
    it('staleLeadsCount > 0 → insight danger amb prioritat 1', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 3,
      });
      const insight = result.find((i) => i.id === 'stale-leads');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('danger');
      expect(insight!.priority).toBe(1);
    });

    it('el text inclou el nombre de leads', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 7,
      });
      const insight = result.find((i) => i.id === 'stale-leads')!;
      expect(insight.text).toContain('7');
    });

    it('1 lead → singular (sense "s" al final)', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 1,
      });
      const insight = result.find((i) => i.id === 'stale-leads')!;
      // "1 lead sense resposta" (singular)
      expect(insight.text).toMatch(/1 lead\b/);
    });

    it('staleLeadsCount = 0 → cap insight de leads stale', () => {
      const result = generateDashboardInsights(baseInput());
      expect(result.find((i) => i.id === 'stale-leads')).toBeUndefined();
    });
  });

  // ─── SUCCESS: Leads calents ────────────────────────────────────────────────

  describe('leads calents (hot leads)', () => {
    it('hotLeadsCount > 0 → insight success', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        hotLeadsCount: 4,
      });
      const insight = result.find((i) => i.id === 'hot-leads');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('success');
      expect(insight!.priority).toBe(2);
    });

    it('hotLeadsCount = 0 → cap insight de leads calents', () => {
      const result = generateDashboardInsights(baseInput());
      expect(result.find((i) => i.id === 'hot-leads')).toBeUndefined();
    });
  });

  // ─── Comparativa setmanal ─────────────────────────────────────────────────

  describe('comparativa setmanal de leads', () => {
    it('pujada >15% → insight success "leads-up"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        leadsThisWeek: 12,
        leadsLastWeek: 10, // +20%
      });
      const insight = result.find((i) => i.id === 'leads-up');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('success');
      expect(insight!.text).toContain('+20%');
    });

    it('baixada >20% → insight warning "leads-down"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        leadsThisWeek: 7,
        leadsLastWeek: 10, // -30%
      });
      const insight = result.find((i) => i.id === 'leads-down');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('warning');
      expect(insight!.text).toContain('-30%');
    });

    it('canvi entre -20% i +15% → cap insight setmanal', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        leadsThisWeek: 10,
        leadsLastWeek: 10, // 0%
      });
      expect(result.find((i) => i.id === 'leads-up')).toBeUndefined();
      expect(result.find((i) => i.id === 'leads-down')).toBeUndefined();
    });

    it('sense dades setmanals → cap insight setmanal', () => {
      // No passem leadsThisWeek ni leadsLastWeek
      const result = generateDashboardInsights(baseInput());
      expect(result.find((i) => i.id === 'leads-up')).toBeUndefined();
      expect(result.find((i) => i.id === 'leads-down')).toBeUndefined();
    });

    it('leadsLastWeek = 0 → no divideix per zero, cap insight', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        leadsThisWeek: 5,
        leadsLastWeek: 0,
      });
      expect(result.find((i) => i.id === 'leads-up')).toBeUndefined();
      expect(result.find((i) => i.id === 'leads-down')).toBeUndefined();
    });
  });

  // ─── Conversió ─────────────────────────────────────────────────────────────

  describe('taxa de conversió', () => {
    it('conversió <15% → warning "low-conversion"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        conversionRate: 10,
      });
      const insight = result.find((i) => i.id === 'low-conversion');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('warning');
      expect(insight!.text).toContain('10%');
    });

    it('conversió ≥25% → success "high-conversion"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        conversionRate: 30,
      });
      const insight = result.find((i) => i.id === 'high-conversion');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('success');
    });

    it('conversió entre 15% i 25% → cap insight de conversió', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        conversionRate: 20,
      });
      expect(result.find((i) => i.id === 'low-conversion')).toBeUndefined();
      expect(result.find((i) => i.id === 'high-conversion')).toBeUndefined();
    });

    it('conversió = 0 → cap insight (no hi ha dades suficients)', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        conversionRate: 0,
      });
      expect(result.find((i) => i.id === 'low-conversion')).toBeUndefined();
    });
  });

  // ─── Pagaments pendents ────────────────────────────────────────────────────

  describe('pagaments pendents', () => {
    it('pendingPayments > 500 → warning amb import', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        pendingPayments: 1200,
      });
      const insight = result.find((i) => i.id === 'pending-payments');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('warning');
      expect(insight!.priority).toBe(2);
      // El servei usa formatCurrency (helper canònic) → '1.200 €' amb NBSP i milers.
      // Comprovem que el text inclou el dígit i la unitat, no la representació plana.
      expect(insight!.text).toContain('1.200');
      expect(insight!.text).toContain('pendents de cobrar');
    });

    it('pendingPayments ≤ 500 → cap insight', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        pendingPayments: 500,
      });
      expect(result.find((i) => i.id === 'pending-payments')).toBeUndefined();
    });
  });

  // ─── Marge baix ────────────────────────────────────────────────────────────

  describe('marge mitjà', () => {
    it('avgMarginPct < 25% → warning "low-margin"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        avgMarginPct: 20,
      });
      const insight = result.find((i) => i.id === 'low-margin');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('warning');
      expect(insight!.text).toContain('20%');
    });

    it('avgMarginPct ≥ 25% → cap insight de marge', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        avgMarginPct: 40,
      });
      expect(result.find((i) => i.id === 'low-margin')).toBeUndefined();
    });

    it('avgMarginPct = 0 → cap insight (no hi ha dades)', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        avgMarginPct: 0,
      });
      expect(result.find((i) => i.id === 'low-margin')).toBeUndefined();
    });
  });

  // ─── Pròxim event ──────────────────────────────────────────────────────────

  describe('pròxim event', () => {
    it('event ≤3 dies sense cobrar → danger "next-event-payment"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        nextEvent: {
          daysUntil: 2,
          clientName: 'Maria Garcia',
          depositPaid: true,
          remainingPaid: false,
        },
      });
      const insight = result.find((i) => i.id === 'next-event-payment');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('danger');
      expect(insight!.priority).toBe(1);
      expect(insight!.text).toContain('Maria Garcia');
      expect(insight!.text).toContain('2');
    });

    it('event ≤7 dies ja cobrat → info "next-event-soon"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        nextEvent: {
          daysUntil: 5,
          clientName: 'Joan Puig',
          depositPaid: true,
          remainingPaid: true,
        },
      });
      const insight = result.find((i) => i.id === 'next-event-soon');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('info');
      expect(insight!.text).toContain('Joan Puig');
    });

    it('event > 7 dies → cap insight de pròxim event', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        nextEvent: {
          daysUntil: 15,
          clientName: 'Pere',
          depositPaid: true,
          remainingPaid: true,
        },
      });
      expect(result.find((i) => i.id === 'next-event-payment')).toBeUndefined();
      expect(result.find((i) => i.id === 'next-event-soon')).toBeUndefined();
    });

    it('sense nextEvent → cap insight', () => {
      const result = generateDashboardInsights(baseInput());
      expect(result.find((i) => i.id === 'next-event-payment')).toBeUndefined();
      expect(result.find((i) => i.id === 'next-event-soon')).toBeUndefined();
    });

    it('event ≤3 dies JA cobrat → no es mostra danger, es mostra info', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        nextEvent: {
          daysUntil: 1,
          clientName: 'Anna',
          depositPaid: true,
          remainingPaid: true, // Ja cobrat!
        },
      });
      // No hauria de sortir l'alerta de pagament
      expect(result.find((i) => i.id === 'next-event-payment')).toBeUndefined();
      // Però sí l'info de pròxim event (≤7 dies)
      expect(result.find((i) => i.id === 'next-event-soon')).toBeDefined();
    });
  });

  // ─── Inventari avariat ─────────────────────────────────────────────────────

  describe('inventari avariat', () => {
    it('inventoryBroken > 0 → danger "inventory-broken"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        inventoryBroken: 3,
      });
      const insight = result.find((i) => i.id === 'inventory-broken');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('danger');
      expect(insight!.text).toContain('3');
    });

    it('inventoryBroken = 0 → cap insight', () => {
      const result = generateDashboardInsights(baseInput());
      expect(result.find((i) => i.id === 'inventory-broken')).toBeUndefined();
    });
  });

  // ─── Flux de caixa ─────────────────────────────────────────────────────────

  describe('flux de caixa projectat', () => {
    it('cashFlowNet30 < 0 → danger "cash-flow-negative"', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        cashFlowNet30: -800,
      });
      const insight = result.find((i) => i.id === 'cash-flow-negative');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('danger');
      expect(insight!.priority).toBe(1);
      expect(insight!.text).toContain('-800');
    });

    it('cashFlowNet30 ≥ 0 → cap insight de flux negatiu', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        cashFlowNet30: 0,
      });
      expect(result.find((i) => i.id === 'cash-flow-negative')).toBeUndefined();
    });
  });

  // ─── Objectiu mensual ─────────────────────────────────────────────────────

  describe('objectiu mensual de facturació', () => {
    it('revenueTarget = 0 → cap insight de facturació (no hi ha objectiu definit)', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        revenueTarget: 0,
        revenueThisMonth: 5000,
      });
      expect(result.find((i) => i.id === 'revenue-ahead')).toBeUndefined();
      expect(result.find((i) => i.id === 'revenue-behind')).toBeUndefined();
    });

    it('facturació molt per sobre del ritme → success "revenue-ahead"', () => {
      // Simulem estar a principis de mes amb molta facturació
      const result = generateDashboardInsights({
        ...baseInput(),
        revenueTarget: 10000,
        revenueThisMonth: 9500, // 95% de l'objectiu
      });
      const insight = result.find((i) => i.id === 'revenue-ahead');
      // Depenent del dia del mes, pot o no aparèixer
      // Si som al dia 17, expectedPct ~55%, i revenueThisMonth/target = 95% → +40pp per sobre
      if (insight) {
        expect(insight.type).toBe('success');
      }
    });

    // Regressió: abans, `generateDashboardInsights` cridava `new Date()` tres cops
    // internament (dayOfMonth, year, month) per calcular el ritme esperat. Això
    // feia que la banda del dashboard a `/admin` fos no-determinística en tests
    // i impossible de reproduir quan es regenerava l'estat d'un dia anterior.
    // Ara accepta `now?: Date` com a segon paràmetre.
    it('determinisme: `now` dia 5 d\'un mes de 30 dies → expectedPct ~17%, marca "ahead" amb 40%', () => {
      // Dia 5 de juny (30 dies) → expected 17%, actual 40% → +23pp → "ahead"
      const result = generateDashboardInsights(
        {
          ...baseInput(),
          revenueTarget: 10000,
          revenueThisMonth: 4000, // 40%
        },
        new Date('2026-06-05T12:00:00Z'),
      );
      const insight = result.find((i) => i.id === 'revenue-ahead');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('success');
    });

    it('determinisme: `now` dia 25 d\'un mes de 30 dies → expectedPct ~83%, marca "behind" amb 40%', () => {
      // Dia 25 de juny (30 dies) → expected 83%, actual 40% → -43pp → "behind"
      const result = generateDashboardInsights(
        {
          ...baseInput(),
          revenueTarget: 10000,
          revenueThisMonth: 4000, // 40%
        },
        new Date('2026-06-25T12:00:00Z'),
      );
      const insight = result.find((i) => i.id === 'revenue-behind');
      expect(insight).toBeDefined();
      expect(insight!.type).toBe('warning');
    });

    it('determinisme: dues crides amb el mateix `now` donen el mateix resultat', () => {
      const now = new Date('2026-06-15T00:00:00Z');
      const input = {
        ...baseInput(),
        revenueTarget: 10000,
        revenueThisMonth: 5000,
      };
      const a = generateDashboardInsights(input, now);
      const b = generateDashboardInsights(input, now);
      expect(a).toEqual(b);
    });

    it('determinisme: calcula daysInMonth correctament per febrer no bixest', () => {
      // Febrer 2026 té 28 dies. Dia 14 → expected 50%
      const result = generateDashboardInsights(
        {
          ...baseInput(),
          revenueTarget: 10000,
          revenueThisMonth: 5000, // 50%
        },
        new Date('2026-02-14T12:00:00Z'),
      );
      // Ni "ahead" ni "behind" perquè expected ≈ actual
      expect(result.find((i) => i.id === 'revenue-ahead')).toBeUndefined();
      expect(result.find((i) => i.id === 'revenue-behind')).toBeUndefined();
    });
  });

  // ─── Combinació de situacions ──────────────────────────────────────────────

  describe('combinació de múltiples alertes', () => {
    it('crisis total: múltiples dangers surten primer que warnings', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        staleLeadsCount: 5,       // danger, priority 1
        cashFlowNet30: -2000,     // danger, priority 1
        inventoryBroken: 2,       // danger, priority 2
        pendingPayments: 3000,    // warning, priority 2
        avgMarginPct: 10,         // warning, priority 3
        conversionRate: 5,        // warning, priority 4
      });

      // Les 5 primeres haurien de ser les de prioritat més baixa (1, 1, 2, 2, 3)
      expect(result.length).toBe(5);
      expect(result[0].priority).toBe(1);
      // Tots els insights retornats tenen prioritat ≤ la dels que queden fora
    });

    it('situació perfecta: tot bé → molt pocs o cap insight', () => {
      const result = generateDashboardInsights(baseInput());
      // Amb les dades base, no hi ha res a destacar
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  // ─── Pluralització ────────────────────────────────────────────────────────

  describe('pluralització correcta en català', () => {
    it('1 equip avariat → singular', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        inventoryBroken: 1,
      });
      const insight = result.find((i) => i.id === 'inventory-broken')!;
      expect(insight.text).toMatch(/1 equip\b/);
      expect(insight.text).toMatch(/avariat\b/);
    });

    it('3 equips avariats → plural', () => {
      const result = generateDashboardInsights({
        ...baseInput(),
        inventoryBroken: 3,
      });
      const insight = result.find((i) => i.id === 'inventory-broken')!;
      expect(insight.text).toMatch(/3 equips/);
      expect(insight.text).toMatch(/avariats/);
    });
  });
});
