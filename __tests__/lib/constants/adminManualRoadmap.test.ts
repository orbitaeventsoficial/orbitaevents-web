import { describe, expect, it } from 'vitest';
import { ADMIN_MANUAL_ROADMAP, ADMIN_MARKETING_BOOTSTRAP_PLAN, ADMIN_MARKETING_CHANNEL_DECISION_MATRIX, ADMIN_MARKETING_PHASE_EVIDENCE, ADMIN_MARKETING_PHASE_GATE, ADMIN_MARKETING_PHASES } from '@/lib/constants/adminManual';

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

  it('manté el gate de màrqueting enfocat a Fase 0 amb accions existents', () => {
    expect(ADMIN_MARKETING_PHASE_GATE.activePhase).toBe('FASE_0');
    expect(ADMIN_MARKETING_PHASE_GATE.requiredActionIds).toEqual([
      'icp-definition',
      'value-proposition',
      'google-business-profile',
      'web-optimization',
    ]);
    expect(ADMIN_MARKETING_PHASE_GATE.blockedActionIds).toEqual([
      'google-ads',
      'meta-ads',
      'remarketing',
    ]);
    expect(Object.keys(ADMIN_MARKETING_PHASE_GATE.blockedReasons).sort()).toEqual([
      'google-ads',
      'meta-ads',
      'remarketing',
    ].sort());
    expect(ADMIN_MARKETING_PHASE_GATE.primaryActionId).toBe('icp-definition');
    expect(ADMIN_MARKETING_PHASE_GATE.nextPhaseActionId).toBe('personal-network');
    expect(ADMIN_MARKETING_PHASE_GATE.nextPhaseReason).toContain('feedback immediat');
    expect(ADMIN_MARKETING_PHASE_GATE.focusRule).toContain('un sol canal actiu');
    expect(ADMIN_MARKETING_PHASE_GATE.nextPhaseOutputs).toEqual([
      '50 contactes avisats',
      '3 converses comercials obertes',
      'Objeccions anotades',
    ]);
    expect(ADMIN_MARKETING_PHASE_GATE.decision).toContain('No obrir Google Ads');
    expect(ADMIN_MARKETING_PHASE_GATE.unlockCriteria).toHaveLength(4);
    expect(ADMIN_MARKETING_PHASE_GATE.unlockCriteria).toEqual([
      expect.stringContaining('client ideal'),
      expect.stringContaining('proposta de valor'),
      expect.stringContaining('Google Business Profile'),
      expect.stringContaining('Web base'),
    ]);
    expect(Object.keys(ADMIN_MARKETING_PHASE_GATE.requiredOutputs).sort()).toEqual([
      'google-business-profile',
      'icp-definition',
      'value-proposition',
      'web-optimization',
    ].sort());

    const phaseById = new Map(ADMIN_MARKETING_PHASES.map((action) => [action.id, action.phase]));
    for (const id of ADMIN_MARKETING_PHASE_GATE.requiredActionIds) {
      expect(phaseById.get(id)).toBe('FASE_0');
      expect(ADMIN_MARKETING_PHASE_GATE.requiredOutputs[id]?.length).toBeGreaterThanOrEqual(3);
    }
    for (const id of ADMIN_MARKETING_PHASE_GATE.blockedActionIds) {
      expect(phaseById.get(id)).toBe('FASE_2');
      expect(ADMIN_MARKETING_PHASE_GATE.blockedReasons[id]?.trim().length).toBeGreaterThan(20);
    }
    expect(phaseById.get(ADMIN_MARKETING_PHASE_GATE.primaryActionId)).toBe('FASE_0');
    expect(phaseById.get(ADMIN_MARKETING_PHASE_GATE.nextPhaseActionId)).toBe('FASE_1');
  });

  it('consolida un pla bootstrap de 14 dies abans d\'obrir canals cars', () => {
    expect(ADMIN_MARKETING_BOOTSTRAP_PLAN.map((step) => step.window)).toEqual([
      'Dies 1-2',
      'Dies 3-7',
      'Dies 8-14',
    ]);
    expect(ADMIN_MARKETING_BOOTSTRAP_PLAN[0]?.outputs).toContain('ICP escrit');
    expect(ADMIN_MARKETING_BOOTSTRAP_PLAN[1]?.outputs).toContain('50 contactes avisats');
    expect(ADMIN_MARKETING_BOOTSTRAP_PLAN[2]?.outputs).toContain('Canal triat');
    for (const step of ADMIN_MARKETING_BOOTSTRAP_PLAN) {
      expect(step.outputs.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('converteix la Fase 0 en un tracker de proves verificables', () => {
    expect(ADMIN_MARKETING_PHASE_EVIDENCE.map((item) => item.actionId)).toEqual(
      ADMIN_MARKETING_PHASE_GATE.requiredActionIds,
    );

    const phaseById = new Map(ADMIN_MARKETING_PHASES.map((action) => [action.id, action.phase]));
    for (const item of ADMIN_MARKETING_PHASE_EVIDENCE) {
      expect(phaseById.get(item.actionId)).toBe('FASE_0');
      expect(item.proof.trim().length).toBeGreaterThan(30);
      expect(item.whereToCheck.trim().length).toBeGreaterThan(20);
      expect(item.unlockSignal.trim().length).toBeGreaterThan(20);
    }

    expect(ADMIN_MARKETING_PHASE_EVIDENCE[0]?.proof).toContain('pressupost mínim');
    expect(ADMIN_MARKETING_PHASE_EVIDENCE[1]?.whereToCheck).toContain('WhatsApp');
    expect(ADMIN_MARKETING_PHASE_EVIDENCE[2]?.whereToCheck).toContain('Google Maps');
    expect(ADMIN_MARKETING_PHASE_EVIDENCE[3]?.unlockSignal).toContain('lead');
  });

  it('dona una matriu accionable per triar un sol canal gratuït', () => {
    const phaseById = new Map(ADMIN_MARKETING_PHASES.map((action) => [action.id, action.phase]));

    expect(ADMIN_MARKETING_CHANNEL_DECISION_MATRIX.map((item) => item.actionId)).toEqual([
      'personal-network',
      'google-reviews',
      'seo-local-pages',
      'instagram-organic',
      'partner-network',
    ]);

    for (const item of ADMIN_MARKETING_CHANNEL_DECISION_MATRIX) {
      expect(phaseById.get(item.actionId)).toBe('FASE_1');
      expect(item.startWhen.trim().length).toBeGreaterThan(30);
      expect(item.firstMove.trim().length).toBeGreaterThan(30);
      expect(item.successSignal.trim().length).toBeGreaterThan(25);
      expect(item.stopIf.trim().length).toBeGreaterThan(25);
      expect(item.adminHref).toMatch(/^\/admin/);
      expect(item.adminLabel.trim().length).toBeGreaterThan(5);
    }

    expect(ADMIN_MARKETING_CHANNEL_DECISION_MATRIX[0]?.successSignal).toContain('3 converses');
    expect(ADMIN_MARKETING_CHANNEL_DECISION_MATRIX[2]?.adminHref).toBe('/admin/text-manager');
    expect(ADMIN_MARKETING_CHANNEL_DECISION_MATRIX[3]?.stopIf).toContain('Meta Ads');
  });
});
