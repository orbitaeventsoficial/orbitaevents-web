import { describe, expect, it } from 'vitest';
import { ADMIN_MANUAL_ROADMAP } from '@/lib/constants/adminManual';

describe('ADMIN_MANUAL_ROADMAP', () => {
  it('inclou tots els ítems amb status canònic', () => {
    expect(ADMIN_MANUAL_ROADMAP.length).toBeGreaterThan(0);
    for (const item of ADMIN_MANUAL_ROADMAP) {
      expect(['PENDING', 'DONE']).toContain(item.status);
    }
  });

  it('manté ids únics', () => {
    const ids = ADMIN_MANUAL_ROADMAP.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('els ítems DONE poden portar doneCanvi numèric positiu', () => {
    const done = ADMIN_MANUAL_ROADMAP.filter((item) => item.status === 'DONE');
    expect(done.length).toBeGreaterThan(0);
    for (const item of done) {
      if (item.doneCanvi !== undefined) {
        expect(typeof item.doneCanvi).toBe('number');
        expect(Number.isInteger(item.doneCanvi)).toBe(true);
        expect(item.doneCanvi).toBeGreaterThan(0);
      }
      if (item.doneNote !== undefined) {
        expect(typeof item.doneNote).toBe('string');
        expect(item.doneNote.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('els ítems PENDING no porten doneCanvi ni doneNote', () => {
    const pending = ADMIN_MANUAL_ROADMAP.filter((item) => item.status === 'PENDING');
    for (const item of pending) {
      expect(item.doneCanvi).toBeUndefined();
      expect(item.doneNote).toBeUndefined();
      if (item.protocolSection !== undefined) {
        expect(item.protocolSection).toMatch(/^\d+(?:\.\d+)*$/);
      }
    }
  });

  it('marketing-analytics-hub és l\'únic ítem PENDING', () => {
    const pending = ADMIN_MANUAL_ROADMAP.filter((item) => item.status === 'PENDING');
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe('marketing-analytics-hub');
    expect(pending[0]?.priority).toBe('CRITICAL');
    expect(pending[0]?.protocolSection).toBe('6.16');
  });

  it('inclou els ids canònics dels ítems FET coberts pel §6.15 del protocol', () => {
    const ids = ADMIN_MANUAL_ROADMAP.map((item) => item.id);
    const expectedDone = [
      'lead-nurturing-engine',
      'forecast-per-status',
      'command-palette',
      'ab-testing-templates',
      'attribution-multitouch',
      'lead-scoring-dynamic',
      'kpi-anomaly-detection',
      'capacity-conflict-alerts',
      'push-notifications-critical',
      'weekly-benchmark',
      'decision-audit-trail',
    ];
    for (const id of expectedDone) {
      expect(ids).toContain(id);
      const item = ADMIN_MANUAL_ROADMAP.find((entry) => entry.id === id);
      expect(item?.status).toBe('DONE');
    }
  });
});
