import { describe, it, expect } from 'vitest';
import { generateCampaigns, type CampaignInput } from '@/lib/services/campaignService';

const NOW = new Date('2026-04-10T12:00:00Z'); // abril → primavera-estiu

function makeInput(overrides: Partial<CampaignInput['segments']> = {}): CampaignInput {
  return {
    segments: {
      dormant: 0,
      atRisk: 0,
      vip: 0,
      highValue: 0,
      firstTime: 0,
      returning: 0,
      withEvents: 0,
      recentMonth: 0,
      total: 0,
      ...overrides,
    },
    now: NOW,
  };
}

describe('generateCampaigns', () => {
  it('retorna array buit sense dades de segments', () => {
    const result = generateCampaigns(makeInput());
    expect(result).toEqual([]);
  });

  it('genera campanya reactivació dormants', () => {
    const result = generateCampaigns(makeInput({ dormant: 10 }));
    const campaign = result.find((c) => c.type === 'REACTIVATION' && c.segment === 'Dormants');
    expect(campaign).toBeDefined();
    expect(campaign!.audienceSize).toBe(10);
    expect(campaign!.channel).toBe('whatsapp');
    expect(campaign!.urgency).toBe('HIGH');
  });

  it('genera campanya reactivació at-risk', () => {
    const result = generateCampaigns(makeInput({ atRisk: 5 }));
    const campaign = result.find((c) => c.type === 'REACTIVATION' && c.segment === 'En risc');
    expect(campaign).toBeDefined();
    expect(campaign!.audienceSize).toBe(5);
    expect(campaign!.urgency).toBe('HIGH');
  });

  it('genera campanya upsell first-time', () => {
    const result = generateCampaigns(makeInput({ firstTime: 15 }));
    const campaign = result.find((c) => c.type === 'UPSELL');
    expect(campaign).toBeDefined();
    expect(campaign!.audienceSize).toBe(15);
    expect(campaign!.bodyTemplate).toContain('10%');
  });

  it('genera campanya loyalty VIP', () => {
    const result = generateCampaigns(makeInput({ vip: 3 }));
    const campaign = result.find((c) => c.type === 'LOYALTY');
    expect(campaign).toBeDefined();
    expect(campaign!.channel).toBe('whatsapp');
    expect(campaign!.urgency).toBe('LOW');
  });

  it('genera campanya referral returning', () => {
    const result = generateCampaigns(makeInput({ returning: 8 }));
    const campaign = result.find((c) => c.type === 'REFERRAL');
    expect(campaign).toBeDefined();
    expect(campaign!.bodyTemplate).toContain('10%');
    expect(campaign!.estimatedImpact).toContain('leads');
  });

  it('genera campanya feedback recent', () => {
    const result = generateCampaigns(makeInput({ recentMonth: 6 }));
    const campaign = result.find((c) => c.type === 'FEEDBACK_REQUEST');
    expect(campaign).toBeDefined();
    expect(campaign!.bodyTemplate).toContain('{link_ressenya}');
  });

  it('genera campanya seasonal a l\'abril (primavera-estiu)', () => {
    const result = generateCampaigns(makeInput({ total: 50, withEvents: 30 }));
    const campaign = result.find((c) => c.type === 'SEASONAL');
    expect(campaign).toBeDefined();
    expect(campaign!.name).toContain('comunions i bodes');
    expect(campaign!.audienceSize).toBe(30);
  });

  it('no genera seasonal fora de temporada rellevant (juliol)', () => {
    const input = makeInput({ total: 50, withEvents: 30 });
    input.now = new Date('2026-07-15T12:00:00Z');
    const result = generateCampaigns(input);
    expect(result.find((c) => c.type === 'SEASONAL')).toBeUndefined();
  });

  it('genera seasonal Nadal al desembre', () => {
    const input = makeInput({ total: 50, withEvents: 30 });
    input.now = new Date('2026-12-01T12:00:00Z');
    const result = generateCampaigns(input);
    const campaign = result.find((c) => c.type === 'SEASONAL');
    expect(campaign).toBeDefined();
    expect(campaign!.name).toContain('Nadal');
  });

  it('noms de campanya inclouen el mes actual', () => {
    const result = generateCampaigns(makeInput({ dormant: 5 }));
    expect(result[0].name).toContain('abril');
  });

  it('estimatedImpact calcula % raonable', () => {
    const result = generateCampaigns(makeInput({ dormant: 20 }));
    const campaign = result.find((c) => c.segment === 'Dormants');
    // 20 * 0.15 = 3
    expect(campaign!.estimatedImpact).toContain('3');
  });

  it('genera múltiples campanyes amb tots els segments actius', () => {
    const result = generateCampaigns(
      makeInput({
        dormant: 10,
        atRisk: 5,
        firstTime: 8,
        vip: 3,
        returning: 12,
        recentMonth: 4,
        total: 50,
        withEvents: 30,
      })
    );
    const types = result.map((c) => c.type);
    expect(types).toContain('REACTIVATION');
    expect(types).toContain('UPSELL');
    expect(types).toContain('LOYALTY');
    expect(types).toContain('REFERRAL');
    expect(types).toContain('FEEDBACK_REQUEST');
    expect(types).toContain('SEASONAL');
    expect(result.length).toBeGreaterThanOrEqual(7); // 2 reactivation + 5 others
  });

  it('cada campanya té id únic', () => {
    const result = generateCampaigns(
      makeInput({ dormant: 10, atRisk: 5, firstTime: 8, vip: 3, returning: 12, recentMonth: 4, total: 50, withEvents: 30 })
    );
    const ids = result.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
