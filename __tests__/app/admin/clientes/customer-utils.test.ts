import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCustomerHubOperatingSummary,
  resolveCustomerSegmentFilter,
  type Customer,
  type CustomerStats,
} from '@/app/admin/clientes/customer-utils';

function customer(overrides: Partial<Customer>): Customer {
  return {
    id: 'cus-base',
    name: 'Client Base',
    email: 'client@example.com',
    phone: null,
    total_events: 0,
    total_spent: 0,
    is_vip: false,
    created_at: '2026-05-10T09:00:00.000Z',
    ...overrides,
  };
}

const stats: CustomerStats = {
  total: 12,
  vip: 1,
  withEvents: 4,
  recentMonth: 3,
  dormant: 2,
  atRisk: 1,
};

describe('buildCustomerHubOperatingSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('concentra la lectura comercial del Customer Hub en senyals accionables', () => {
    const summary = buildCustomerHubOperatingSummary([
      customer({ id: 'vip', name: 'Client VIP', total_events: 3, total_spent: 2400, is_vip: true }),
      customer({ id: 'new', name: 'Oportunitat Nova', email: 'nova@example.com', created_at: '2026-05-11T09:00:00.000Z' }),
      customer({ id: 'blind', name: 'Sense Canal', email: '', phone: null, created_at: '2026-04-01T09:00:00.000Z' }),
    ], stats);

    expect(summary.tone).toBe('warning');
    expect(summary.totalVisible).toBe(3);
    expect(summary.totalKnown).toBe(12);
    expect(summary.withEventHistory).toBe(4);
    expect(summary.activeOpportunities).toBe(1);
    expect(summary.highPriority).toBe(2);
    expect(summary.missingContactChannel).toBe(1);
    expect(summary.systemItems).toContain('3 clients visibles de 12 totals al CRM.');
    expect(summary.manualItems).toContain('2 clients demanen prioritat alta abans de seguir filtrant.');
    expect(summary.nextStep).toMatchObject({
      title: 'Obrir Fitxa 360 de Client VIP',
      href: '/admin/clientes/vip',
      ctaLabel: 'Obrir Fitxa 360',
    });
  });

  it('dona un següent pas útil quan encara no hi ha clients visibles', () => {
    const summary = buildCustomerHubOperatingSummary([], null);

    expect(summary.tone).toBe('info');
    expect(summary.systemItems[0]).toBe('0 clients visibles de 0 totals al CRM.');
    expect(summary.manualItems).toContain('Encara no hi ha cap client visible per prioritzar.');
    expect(summary.nextStep).toEqual({
      title: 'Crear o importar el primer client útil',
      detail: 'Sense clients visibles, el Customer Hub no pot actuar com a centre de relació.',
      href: '/admin/clientes?add=1',
      ctaLabel: 'Afegir client',
    });
  });
});

describe('resolveCustomerSegmentFilter', () => {
  it('tradueix el segment entrant als filtres CRM existents', () => {
    expect(resolveCustomerSegmentFilter('at-risk')).toEqual({
      lifecycleStage: '',
      tag: '',
      healthScoreMax: 40,
      minSpent: null,
    });
    expect(resolveCustomerSegmentFilter('high-value')).toEqual({
      lifecycleStage: '',
      tag: '',
      healthScoreMax: null,
      minSpent: 2000,
    });
    expect(resolveCustomerSegmentFilter('vip')).toEqual({
      lifecycleStage: 'VIP',
      tag: '',
      healthScoreMax: null,
      minSpent: null,
    });
  });

  it('ignora segments desconeguts sense netejar filtres manuals', () => {
    expect(resolveCustomerSegmentFilter('nope')).toBeNull();
    expect(resolveCustomerSegmentFilter(null)).toBeNull();
  });
});
