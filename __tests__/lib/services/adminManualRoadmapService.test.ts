import { describe, expect, it } from 'vitest';
import type { AdminManualRoadmapItem } from '@/lib/constants/adminManual';
import { buildAdminManualRoadmapProtocolTarget } from '@/lib/services/adminManualRoadmapService';

function item(overrides: Partial<AdminManualRoadmapItem>): AdminManualRoadmapItem {
  return {
    id: 'roadmap-item',
    title: 'Roadmap item',
    description: 'Description',
    priority: 'HIGH',
    impact: 'Impact',
    effort: 'Effort',
    area: 'Captació i vendes',
    status: 'PENDING',
    ...overrides,
  };
}

describe('buildAdminManualRoadmapProtocolTarget', () => {
  it('apunta els ítems DONE amb doneCanvi al Canvi concret del §9', () => {
    expect(buildAdminManualRoadmapProtocolTarget(item({ status: 'DONE', doneCanvi: 131 }))).toEqual({
      href: '/admin/docs/protocol?canvi=131#canvi-131',
      label: 'Obrir Canvi #131',
    });
  });

  it('no crea CTA de protocol per ítems DONE sense Canvi registrat', () => {
    expect(buildAdminManualRoadmapProtocolTarget(item({ status: 'DONE' }))).toBeNull();
  });

  it('apunta els PENDING a la secció explícita del protocol quan existeix', () => {
    expect(buildAdminManualRoadmapProtocolTarget(item({ protocolSection: '6.16' }))).toEqual({
      href: '/admin/docs/protocol?seccio=6.16#seccio-6-16',
      label: 'Obrir §6.16 al protocol',
    });
  });

  it('manté §6.15 com a fallback pels PENDING antics sense secció pròpia', () => {
    expect(buildAdminManualRoadmapProtocolTarget(item({}))).toEqual({
      href: '/admin/docs/protocol?seccio=6.15#seccio-6-15',
      label: 'Obrir §6.15 al protocol',
    });
  });
});
