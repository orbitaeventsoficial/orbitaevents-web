import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    proposal: { findUnique: vi.fn(), update: vi.fn() },
    lead: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn() },
    task: { create: vi.fn(), findFirst: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import {
  onProposalAccepted,
  onLeadCreated,
  onBookingConfirmed,
  dispatchAutoTrigger,
  type AutoTriggerEvent,
} from '@/lib/services/automationTriggers';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('onProposalAccepted', () => {
  it('retorna triggered=false si la proposta no existeix', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue(null);

    const result = await onProposalAccepted('missing');

    expect(result).toEqual({ triggered: false, action: 'generate-contract', detail: 'No booking linked' });
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('retorna triggered=false si la proposta no té booking vinculat', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({ id: 'p1', bookingId: null, contractStatus: null });

    const result = await onProposalAccepted('p1');

    expect(result.triggered).toBe(false);
    expect(result.detail).toBe('No booking linked');
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('retorna triggered=false si ja hi ha contracte diferent de DRAFT', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      bookingId: 'b1',
      contractStatus: 'SIGNED',
    });

    const result = await onProposalAccepted('p1');

    expect(result.triggered).toBe(false);
    expect(result.detail).toBe('Contract already exists');
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('marca contractStatus=DRAFT quan la proposta s\'accepta i encara no té contracte', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      bookingId: 'b1',
      contractStatus: null,
    });
    mockPrisma.proposal.update.mockResolvedValue({});

    const result = await onProposalAccepted('p1');

    expect(result.triggered).toBe(true);
    expect(result.detail).toBe('Contract pending generation for proposal p1');
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { contractStatus: 'DRAFT', contractSentAt: null },
    });
  });

  it('retorna triggered=false i no peta si prisma llança', async () => {
    mockPrisma.proposal.findUnique.mockRejectedValue(new Error('DB down'));

    const result = await onProposalAccepted('p1');

    expect(result.triggered).toBe(false);
    expect(result.action).toBe('generate-contract');
    expect(result.detail).toContain('DB down');
  });
});

describe('onLeadCreated', () => {
  it('retorna triggered=false si el lead no té email', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', email: null, name: 'Anon' });

    const result = await onLeadCreated('l1');

    expect(result).toEqual({ triggered: false, action: 'welcome-email', detail: 'No valid email' });
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it('retorna triggered=false si l\'email és placeholder intern', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      email: 'test@leads.orbitaevents.local',
      name: 'Anon',
    });

    const result = await onLeadCreated('l1');

    expect(result.triggered).toBe(false);
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it('crea Task canònica amb source=AUTOMATION i dedupeKey per welcome email', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      email: 'joan@example.com',
      name: 'Joan',
      preferredLocale: 'ca',
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 1 });

    const result = await onLeadCreated('l1');

    expect(result.triggered).toBe(true);
    const createArgs = mockPrisma.task.createMany.mock.calls[0][0];
    expect(createArgs.skipDuplicates).toBe(true);
    expect(createArgs.data[0]).toMatchObject({
      title: expect.stringContaining('Joan'),
      leadId: 'l1',
      status: 'OPEN',
      priority: 'HIGH',
      source: 'AUTOMATION',
      dedupeKey: 'welcome-email:l1',
    });
  });

  it('retorna triggered=false si createMany skip-dedupa pel dedupeKey existent', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      email: 'joan@example.com',
      name: 'Joan',
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 0 });

    const result = await onLeadCreated('l1');

    expect(result.triggered).toBe(false);
    expect(result.detail).toBe('Welcome email already handled');
  });

  it('no peta si prisma.task.createMany falla', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', email: 'ok@ex.com', name: 'Ok' });
    mockPrisma.task.createMany.mockRejectedValue(new Error('DB error'));

    const result = await onLeadCreated('l1');

    expect(result.triggered).toBe(false);
    expect(result.detail).toContain('DB error');
  });
});

describe('onBookingConfirmed', () => {
  it('retorna triggered=false si la reserva no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const result = await onBookingConfirmed('missing');

    expect(result).toEqual({ triggered: false, action: 'pre-event-checklist', detail: 'Booking not found' });
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it('retorna triggered=false si createMany skip-dedupa pel dedupeKey existent', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      eventType: 'BODA',
      clientName: 'Joan',
      eventDate: new Date('2026-09-15'),
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 0 });

    const result = await onBookingConfirmed('b1');

    expect(result.triggered).toBe(false);
    expect(result.detail).toBe('Checklist already exists');
  });

  it('crea Task checklist amb dedupeKey canònic + ítems BODA i source=AUTOMATION', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      eventType: 'BODA',
      clientName: 'Joan',
      eventDate: new Date('2026-09-15'),
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 1 });

    const result = await onBookingConfirmed('b1');

    expect(result.triggered).toBe(true);
    expect(result.detail).toBe('8 items created'); // 5 base + 3 BODA

    const createArgs = mockPrisma.task.createMany.mock.calls[0][0];
    expect(createArgs.skipDuplicates).toBe(true);
    expect(createArgs.data[0]).toMatchObject({
      title: 'Checklist pre-event: Joan',
      bookingId: 'b1',
      status: 'OPEN',
      priority: 'HIGH',
      source: 'AUTOMATION',
      dedupeKey: 'pre-event-checklist:b1',
    });
    expect(createArgs.data[0].description).toContain('Coordinar amb fotògraf');
    expect(createArgs.data[0].description).toContain('primer ball');
  });

  it('usa només ítems base si eventType no és conegut', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b2',
      eventType: 'OTHER',
      clientName: 'Maria',
      eventDate: new Date('2026-10-01'),
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 1 });

    const result = await onBookingConfirmed('b2');

    expect(result.detail).toBe('5 items created');
  });

  it('calcula dueDate 2 dies abans de eventDate', async () => {
    const eventDate = new Date('2026-09-15T20:00:00Z');
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      eventType: 'BODA',
      clientName: 'Joan',
      eventDate,
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 1 });

    await onBookingConfirmed('b1');

    const createArgs = mockPrisma.task.createMany.mock.calls[0][0];
    const expectedDue = new Date(eventDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(createArgs.data[0].dueDate.getTime()).toBe(expectedDue.getTime());
  });

  it('dueDate=null si la reserva no té eventDate', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b3',
      eventType: 'BODA',
      clientName: 'Anon',
      eventDate: null,
    });
    mockPrisma.task.createMany.mockResolvedValue({ count: 1 });

    await onBookingConfirmed('b3');

    const createArgs = mockPrisma.task.createMany.mock.calls[0][0];
    expect(createArgs.data[0].dueDate).toBeNull();
  });
});

describe('dispatchAutoTrigger', () => {
  it('ruta proposal.accepted cap a onProposalAccepted', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue(null);

    const event: AutoTriggerEvent = { type: 'proposal.accepted', proposalId: 'p1' };
    const result = await dispatchAutoTrigger(event);

    expect(result.action).toBe('generate-contract');
    expect(mockPrisma.proposal.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'p1' },
    }));
  });

  it('ruta lead.created cap a onLeadCreated', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    const event: AutoTriggerEvent = { type: 'lead.created', leadId: 'l1' };
    const result = await dispatchAutoTrigger(event);

    expect(result.action).toBe('welcome-email');
    expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'l1' },
    }));
  });

  it('ruta booking.confirmed cap a onBookingConfirmed', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const event: AutoTriggerEvent = { type: 'booking.confirmed', bookingId: 'b1' };
    const result = await dispatchAutoTrigger(event);

    expect(result.action).toBe('pre-event-checklist');
    expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'b1' },
    }));
  });
});
