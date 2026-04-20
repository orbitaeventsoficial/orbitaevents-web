import { describe, it, expect } from 'vitest';
import {
  computeReferralsSummary,
  type ReferralCustomerInput,
} from '@/lib/services/referralsService';

function makeCustomer(overrides: Partial<ReferralCustomerInput> = {}): ReferralCustomerInput {
  return {
    id: 'c1',
    name: 'Anna Garcia',
    email: 'anna@example.com',
    phone: '+34600111222',
    lifecycleStage: 'FIRST_TIME',
    totalEvents: 1,
    totalSpent: 1000,
    healthScore: 80,
    referredById: null,
    preferredLocale: 'ca',
    ...overrides,
  };
}

describe('computeReferralsSummary', () => {
  it('returns empty summary for empty input', () => {
    const result = computeReferralsSummary({ customers: [] });
    expect(result.topReferrers).toEqual([]);
    expect(result.candidates).toEqual([]);
    expect(result.stats.totalCustomers).toBe(0);
    expect(result.stats.totalReferrers).toBe(0);
  });

  it('identifies referrers and their referred customers', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', name: 'Anna', lifecycleStage: 'VIP' }),
      makeCustomer({ id: 'c2', name: 'Bob', referredById: 'c1', totalSpent: 1500 }),
      makeCustomer({ id: 'c3', name: 'Carol', referredById: 'c1', totalSpent: 800 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.topReferrers).toHaveLength(1);
    expect(result.topReferrers[0].id).toBe('c1');
    expect(result.topReferrers[0].referralsCount).toBe(2);
    expect(result.topReferrers[0].referralsValue).toBe(2300);
    expect(result.topReferrers[0].referralsNames).toEqual(['Bob', 'Carol']);
  });

  it('sorts top referrers by value then count', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'r1', name: 'Referrer1' }),
      makeCustomer({ id: 'r2', name: 'Referrer2' }),
      makeCustomer({ id: 'c1', referredById: 'r1', totalSpent: 3000 }),
      makeCustomer({ id: 'c2', referredById: 'r2', totalSpent: 1000 }),
      makeCustomer({ id: 'c3', referredById: 'r2', totalSpent: 500 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.topReferrers[0].id).toBe('r1'); // 3000 > 1500
    expect(result.topReferrers[1].id).toBe('r2');
  });

  it('ignores referredById if referrer not in customer list', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', referredById: 'nonexistent' }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.topReferrers).toHaveLength(0);
    expect(result.stats.totalReferred).toBe(0);
  });

  it('computes referral stats correctly', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'r1', name: 'R1', lifecycleStage: 'VIP' }),
      makeCustomer({ id: 'c1', referredById: 'r1', totalSpent: 2000 }),
      makeCustomer({ id: 'c2', referredById: 'r1', totalSpent: 1000 }),
      makeCustomer({ id: 'c3' }), // not referred
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.stats.totalCustomers).toBe(4);
    expect(result.stats.totalReferrers).toBe(1);
    expect(result.stats.totalReferred).toBe(2);
    expect(result.stats.totalReferralValue).toBe(3000);
    expect(result.stats.avgValuePerReferral).toBe(1500);
    expect(result.stats.referralRate).toBe(0.5);
    expect(result.stats.topReferrerName).toBe('R1');
  });

  it('classifies VIP without referral as ALTA priority', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 3, totalSpent: 5000 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].reason).toBe('VIP_NO_REFERRAL');
    expect(result.candidates[0].priority).toBe('ALTA');
  });

  it('classifies HIGH_VALUE when totalSpent >= 2000', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'RETURNING', totalEvents: 1, totalSpent: 2500 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].reason).toBe('HIGH_VALUE_NO_REFERRAL');
  });

  it('classifies RECURRING for RETURNING without high value', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'RETURNING', totalEvents: 2, totalSpent: 1500 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].reason).toBe('RECURRING_NO_REFERRAL');
    expect(result.candidates[0].priority).toBe('MITJANA');
  });

  it('classifies HAPPY_FIRST_TIME for FIRST_TIME with good health', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'FIRST_TIME', totalEvents: 1, healthScore: 85 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].reason).toBe('HAPPY_FIRST_TIME');
  });

  it('excludes customers with zero events', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', totalEvents: 0, lifecycleStage: 'VIP' }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates).toHaveLength(0);
  });

  it('excludes DORMANT customers from candidates', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'DORMANT', totalEvents: 2 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates).toHaveLength(0);
  });

  it('excludes CHURNED customers from candidates', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'CHURNED', totalEvents: 2 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates).toHaveLength(0);
  });

  it('excludes customers with low health score', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 2, healthScore: 40 }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates).toHaveLength(0);
  });

  it('excludes customers who already referred others', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'r1', lifecycleStage: 'VIP' }),
      makeCustomer({ id: 'c1', referredById: 'r1' }),
    ];
    const result = computeReferralsSummary({ customers });
    // r1 is a top referrer, should NOT appear as a candidate
    const candidateIds = result.candidates.map((c) => c.id);
    expect(candidateIds).not.toContain('r1');
  });

  it('sorts candidates by score descending', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'FIRST_TIME', totalEvents: 1 }), // 55
      makeCustomer({ id: 'c2', lifecycleStage: 'VIP', totalEvents: 3 }), // 95
      makeCustomer({ id: 'c3', lifecycleStage: 'RETURNING', totalEvents: 2 }), // 70
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates.map((c) => c.id)).toEqual(['c2', 'c3', 'c1']);
  });

  it('uses Catalan templates for preferredLocale=ca', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 3, preferredLocale: 'ca' }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].suggestedSubject).toContain('créixer');
  });

  it('uses Spanish templates for preferredLocale=es', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 3, preferredLocale: 'es' }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].suggestedSubject).toContain('crecer');
  });

  it('builds valid whatsapp URL when phone present', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 3, phone: '+34600111222' }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].whatsappUrl).toMatch(/^https:\/\/wa\.me\/34600111222/);
  });

  it('returns null whatsappUrl when phone missing', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 3, phone: null }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].whatsappUrl).toBeNull();
  });

  it('builds valid mailto URL', () => {
    const customers: ReferralCustomerInput[] = [
      makeCustomer({ id: 'c1', lifecycleStage: 'VIP', totalEvents: 3, email: 'test@example.com' }),
    ];
    const result = computeReferralsSummary({ customers });
    expect(result.candidates[0].mailtoUrl).toMatch(/^mailto:test@example\.com\?/);
  });
});
