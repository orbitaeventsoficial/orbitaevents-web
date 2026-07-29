import { describe, expect, it } from 'vitest';

import {
  buildPostEventNextActionHref,
  buildPreparedPostEventAction,
} from '@/app/admin/lib/post-event-actions';
import type { PlaybookItem } from '@/lib/services/postEventPlaybookService';

function item(overrides: Partial<PlaybookItem> = {}): PlaybookItem {
  return {
    bookingId: 'booking-1',
    reference: 'OE-2026-001',
    clientName: 'Anna Garcia',
    customerId: 'customer-1',
    eventDate: new Date('2026-07-01T18:00:00.000Z'),
    eventType: 'BIRTHDAY',
    eventLocation: 'Barcelona',
    daysSinceEvent: 5,
    actions: [],
    progress: 25,
    completedCount: 1,
    totalCount: 4,
    priority: 'MITJANA',
    nextAction: {
      key: 'thank_you',
      label: 'Email',
      status: 'PENDING',
      daysSinceEvent: 2,
      note: null,
    },
    ...overrides,
  };
}

describe('buildPostEventNextActionHref', () => {
  it('obre el bloc post-event de la reserva concreta per enviar agraiment', () => {
    expect(buildPostEventNextActionHref(item())).toBe('/admin/bookings/booking-1#sec-post-event');
  });

  it('porta testimoni a comunicacions del client si hi ha customerId', () => {
    expect(buildPostEventNextActionHref(item({
      nextAction: { key: 'testimonial', label: 'Testimoni', status: 'PENDING', daysSinceEvent: 5, note: null },
    }))).toBe('/admin/clientes/customer-1?tab=comms');
  });

  it('porta testimoni sense customerId al bloc post-event de la reserva', () => {
    expect(buildPostEventNextActionHref(item({
      customerId: null,
      nextAction: { key: 'testimonial', label: 'Testimoni', status: 'PENDING', daysSinceEvent: 5, note: null },
    }))).toBe('/admin/bookings/booking-1#sec-post-event');
  });

  it('porta social post al workspace social', () => {
    expect(buildPostEventNextActionHref(item({
      nextAction: { key: 'social_post', label: 'Social', status: 'PENDING', daysSinceEvent: 5, note: null },
    }))).toBe('/admin/social');
  });

  it('porta referral al programa de referrals', () => {
    expect(buildPostEventNextActionHref(item({
      nextAction: { key: 'referral_ask', label: 'Referral', status: 'PENDING', daysSinceEvent: 5, note: null },
    }))).toBe('/admin/clientes/referrals');
  });

  it('degrada al playbook quan no hi ha nextAction', () => {
    expect(buildPostEventNextActionHref(item({ nextAction: null }))).toBe('/admin/post-event/playbook');
  });
});

describe('buildPreparedPostEventAction', () => {
  it('prepara agraiment sense enviar res automaticament', () => {
    const prepared = buildPreparedPostEventAction(item());

    expect(prepared).toMatchObject({
      key: 'thank_you',
      href: '/admin/bookings/booking-1#sec-post-event',
      ctaLabel: 'Obrir reserva',
      safetyLabel: 'Preparat, no enviat',
    });
    expect(prepared?.draft).toContain('Hola Anna');
    expect(prepared?.draft).toContain('Barcelona');
  });

  it('prepara testimoni cap a comunicacions del client', () => {
    const prepared = buildPreparedPostEventAction(item({
      nextAction: { key: 'testimonial', label: 'Testimoni', status: 'PENDING', daysSinceEvent: 5, note: null },
    }));

    expect(prepared?.href).toBe('/admin/clientes/customer-1?tab=comms');
    expect(prepared?.ctaLabel).toBe('Obrir comunicacions');
    expect(prepared?.draft).toContain('testimoni curt');
  });

  it('prepara testimoni sense client cap al bloc post-event de la reserva', () => {
    const prepared = buildPreparedPostEventAction(item({
      customerId: null,
      nextAction: { key: 'testimonial', label: 'Testimoni', status: 'PENDING', daysSinceEvent: 5, note: null },
    }));

    expect(prepared?.href).toBe('/admin/bookings/booking-1#sec-post-event');
    expect(prepared?.ctaLabel).toBe('Obrir reserva');
  });

  it('prepara social sense posar el nom del client al draft public', () => {
    const prepared = buildPreparedPostEventAction(item({
      nextAction: { key: 'social_post', label: 'Social', status: 'PENDING', daysSinceEvent: 5, note: null },
    }));

    expect(prepared?.href).toBe('/admin/social');
    expect(prepared?.draft).not.toContain('Anna Garcia');
    expect(prepared?.detail).toContain('consentiment');
  });

  it('prepara referral cap al programa de referrals', () => {
    const prepared = buildPreparedPostEventAction(item({
      nextAction: { key: 'referral_ask', label: 'Referral', status: 'PENDING', daysSinceEvent: 5, note: null },
    }));

    expect(prepared?.href).toBe('/admin/clientes/referrals');
    expect(prepared?.ctaLabel).toBe('Obrir referrals');
    expect(prepared?.draft).toContain('esdeveniment similar');
  });

  it('torna null quan no hi ha seguent accio', () => {
    expect(buildPreparedPostEventAction(item({ nextAction: null }))).toBeNull();
  });
});
