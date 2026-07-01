import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSnapshotLeads } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customer: { update: vi.fn() },
    booking: { update: vi.fn() },
    leadNote: { deleteMany: vi.fn() },
    leadActivity: { deleteMany: vi.fn() },
    leadDocument: { deleteMany: vi.fn() },
    task: { deleteMany: vi.fn() },
    adminLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  mockSnapshotLeads: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/leadArchiveSnapshot', () => ({ snapshotLeadsBeforeDelete: mockSnapshotLeads }));

import {
  getLeadDetail,
  updateLeadFromInput,
  deleteLeadIfAllowed,
} from '@/lib/services/leadRouteService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.lead.update.mockResolvedValue({ id: 'l1', name: 'Test', status: 'NEW' });
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockPrisma.$transaction.mockImplementation((fn: Function) => fn({
    leadNote: { deleteMany: mockPrisma.leadNote.deleteMany },
    leadActivity: { deleteMany: mockPrisma.leadActivity.deleteMany },
    task: { deleteMany: mockPrisma.task.deleteMany },
    leadDocument: { deleteMany: mockPrisma.leadDocument.deleteMany },
    lead: { delete: vi.fn().mockResolvedValue({ id: 'l1' }) },
  }));
  mockPrisma.leadNote.deleteMany.mockResolvedValue({});
  mockPrisma.leadActivity.deleteMany.mockResolvedValue({});
  mockPrisma.leadDocument.deleteMany.mockResolvedValue({});
  mockPrisma.task.deleteMany.mockResolvedValue({});
});

describe('getLeadDetail', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getLeadDetail('l-inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', name: 'Maria', status: 'NEW' });

    const result = await getLeadDetail('l1');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });
});

describe('updateLeadFromInput', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await updateLeadFromInput('l-inexistent', {});
    expect(result.status).toBe(404);
  });

  it('actualitza lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', status: 'NEW', contactedAt: null });

    const result = await updateLeadFromInput('l1', { priority: 'HIGH' });

    expect(result.status).toBe(200);
    expect(mockPrisma.lead.update).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();
  });

  it('parseja eventDate string', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', status: 'NEW', contactedAt: null });

    await updateLeadFromInput('l1', { eventDate: '2026-06-15' });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventDate: new Date('2026-06-15T12:00:00.000Z') }),
      })
    );
  });

  it('retorna 400 amb data invàlida', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', status: 'NEW', contactedAt: null });

    const result = await updateLeadFromInput('l1', { eventDate: 'invalid-date' });

    expect(result.status).toBe(400);
  });

  it('retorna 400 amb data ambigua encara que JS la pogués interpretar', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', status: 'NEW', contactedAt: null });

    const result = await updateLeadFromInput('l1', { eventDate: '26 Setiembre' });

    expect(result.status).toBe(400);
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('estableix convertedAt quan WON', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', status: 'NEGOTIATING', contactedAt: new Date() });

    await updateLeadFromInput('l1', { status: 'WON' });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ convertedAt: expect.any(Date) }),
      })
    );
  });

  it('estableix contactedAt quan CONTACTED', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', status: 'NEW', contactedAt: null });

    await updateLeadFromInput('l1', { status: 'CONTACTED' });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contactedAt: expect.any(Date) }),
      })
    );
  });

  it('desa sourceCollaboratorId i el propaga al booking vinculat', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1', status: 'NEW', contactedAt: null, customerId: null, booking: { id: 'b1' },
    });

    await updateLeadFromInput('l1', { sourceCollaboratorId: 'col_masquerade' });

    // S'escriu al lead
    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sourceCollaboratorId: 'col_masquerade' }),
      })
    );
    // Es propaga al booking (qui ha passat el bolo també queda al booking)
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'b1' },
        data: expect.objectContaining({ sourceCollaboratorId: 'col_masquerade' }),
      })
    );
  });

  it('accepta sourceCollaboratorId null (origen directe) sense booking', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1', status: 'NEW', contactedAt: null, customerId: null, booking: null,
    });

    await updateLeadFromInput('l1', { sourceCollaboratorId: null });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sourceCollaboratorId: null }),
      })
    );
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });
});

describe('deleteLeadIfAllowed', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await deleteLeadIfAllowed('l-inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna 400 si no està perdut', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', name: 'Maria', email: 'm@test.com', status: 'NEW', booking: null });

    const result = await deleteLeadIfAllowed('l1');

    expect(result.status).toBe(400);
  });

  it('retorna 400 si té reserva', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', name: 'Maria', email: 'm@test.com', status: 'LOST', booking: { id: 'b1' } });

    const result = await deleteLeadIfAllowed('l1');

    expect(result.status).toBe(400);
  });

  it('elimina en cascade i registra adminLog', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'l1', name: 'Maria', email: 'm@test.com', status: 'LOST', booking: null });

    const result = await deleteLeadIfAllowed('l1');

    expect(result.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'DELETE', entity: 'lead', entityId: 'l1' }),
    }));
  });
});
