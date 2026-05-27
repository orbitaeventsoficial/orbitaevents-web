import { describe, it, expect, vi } from 'vitest';

import { snapshotLeadsBeforeDelete } from '@/lib/services/leadArchiveSnapshot';

function makeMockTx(leads: any[]) {
  return {
    lead: { findMany: vi.fn().mockResolvedValue(leads) },
    leadArchive: { createMany: vi.fn().mockResolvedValue({ count: leads.length }) },
  };
}

describe('snapshotLeadsBeforeDelete', () => {
  it('retorna 0 si la llista de leadIds és buida (sense query)', async () => {
    const tx = makeMockTx([]);
    const count = await snapshotLeadsBeforeDelete(tx as any, { leadIds: [], archivedBy: 'admin' });
    expect(count).toBe(0);
    expect(tx.lead.findMany).not.toHaveBeenCalled();
    expect(tx.leadArchive.createMany).not.toHaveBeenCalled();
  });

  it('retorna 0 si la query no troba leads (ids invàlids)', async () => {
    const tx = makeMockTx([]);
    const count = await snapshotLeadsBeforeDelete(tx as any, { leadIds: ['ghost'], archivedBy: 'admin' });
    expect(count).toBe(0);
    expect(tx.leadArchive.createMany).not.toHaveBeenCalled();
  });

  it('mapeja els camps a LeadArchiveCreateManyInput i deriva estimatedValue del proposal SENT/ACCEPTED més recent', async () => {
    const now = new Date('2026-05-20T10:00:00Z');
    const tx = makeMockTx([
      {
        id: 'l1',
        name: 'Anna García',
        email: 'anna@example.com',
        phone: '666111222',
        eventType: 'BIRTHDAY',
        eventDate: new Date('2026-07-15T00:00:00Z'),
        eventLocation: 'Girona',
        guestCount: 80,
        source: 'INSTAGRAM',
        priority: 'HIGH',
        assignedTo: 'admin@example.com',
        lostReason: 'PRICE_TOO_HIGH',
        lostAt: now,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: now,
        contactedAt: new Date('2026-02-01T10:00:00Z'),
        proposals: [{ total: 1850 }],
      },
    ]);

    const count = await snapshotLeadsBeforeDelete(tx as any, { leadIds: ['l1'], archivedBy: 'system:lead-cleanup' });
    expect(count).toBe(1);
    expect(tx.leadArchive.createMany).toHaveBeenCalledTimes(1);
    const call = tx.leadArchive.createMany.mock.calls[0][0];
    expect(call.data).toEqual([
      expect.objectContaining({
        leadId: 'l1',
        name: 'Anna García',
        email: 'anna@example.com',
        phone: '666111222',
        eventType: 'BIRTHDAY',
        source: 'INSTAGRAM',
        estimatedValue: 1850,
        lostReason: 'PRICE_TOO_HIGH',
        archivedBy: 'system:lead-cleanup',
      }),
    ]);
  });

  it('estimatedValue és null si el lead no té cap proposal SENT/ACCEPTED', async () => {
    const tx = makeMockTx([
      {
        id: 'l2',
        name: 'Marc Puig',
        email: 'marc@example.com',
        phone: null,
        eventType: 'WEDDING',
        eventDate: null,
        eventLocation: null,
        guestCount: null,
        source: 'WEBSITE',
        priority: 'MEDIUM',
        assignedTo: null,
        lostReason: null,
        lostAt: null,
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-05T10:00:00Z'),
        contactedAt: null,
        proposals: [],
      },
    ]);

    await snapshotLeadsBeforeDelete(tx as any, { leadIds: ['l2'], archivedBy: 'admin' });
    const call = tx.leadArchive.createMany.mock.calls[0][0];
    expect(call.data[0].estimatedValue).toBeNull();
  });
});
