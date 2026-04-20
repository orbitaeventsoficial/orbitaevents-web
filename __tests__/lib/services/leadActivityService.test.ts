import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    leadActivity: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listLeadActivities,
  createLeadActivity,
  cleanupDuplicateLeadActivities,
  deleteLeadActivity,
} from '@/lib/services/leadActivityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.leadActivity.findMany.mockResolvedValue([]);
  mockPrisma.leadActivity.create.mockResolvedValue({
    id: 'act-1',
    leadId: 'lead-1',
    type: 'SYSTEM',
    title: 'Test',
    description: null,
    createdBy: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    metadata: null,
  });
  mockPrisma.leadActivity.findFirst.mockResolvedValue({ id: 'act-1' });
  mockPrisma.leadActivity.delete.mockResolvedValue({});
  mockPrisma.leadActivity.deleteMany.mockResolvedValue({ count: 0 });
});

describe('listLeadActivities', () => {
  it('retorna activitats', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', leadId: 'lead-1', type: 'SYSTEM', title: 'A', description: null, createdBy: null, createdAt: new Date('2026-01-01T10:00:00Z'), metadata: null },
      { id: 'a2', leadId: 'lead-1', type: 'NOTE', title: 'B', description: null, createdBy: null, createdAt: new Date('2026-01-02T10:00:00Z'), metadata: null },
    ]);
    const result = await listLeadActivities('lead-1');
    expect(result.ok).toBe(true);
    expect(result.activities).toHaveLength(2);
  });
});

describe('createLeadActivity', () => {
  it('crea activitat amb type per defecte SYSTEM', async () => {
    const result = await createLeadActivity('lead-1', { title: 'Test' });
    expect(result.ok).toBe(true);
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'SYSTEM',
        title: 'Test',
      }),
    });
  });

  it('usa type personalitzat', async () => {
    await createLeadActivity('lead-1', { type: 'CALL', title: 'Trucada' });
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'CALL' }),
    });
  });
});

describe('cleanupDuplicateLeadActivities', () => {
  it('no elimina si no hi ha duplicats', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', title: 'A', description: null, createdBy: 'Admin', metadata: null },
      { id: 'a2', title: 'B', description: null, createdBy: 'Admin', metadata: null },
    ]);

    const result = await cleanupDuplicateLeadActivities('lead-1');
    expect(result.deleted).toBe(0);
  });

  it('elimina duplicats per title+description+createdBy', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', title: 'Same', description: 'desc', createdBy: 'Bot', metadata: null },
      { id: 'a2', title: 'Same', description: 'desc', createdBy: 'Bot', metadata: null },
    ]);

    const result = await cleanupDuplicateLeadActivities('lead-1');
    expect(result.deleted).toBe(1);
  });

  it('considera UID de metadata per deduplicació', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'a1', title: 'Import', description: 'same', createdBy: 'Bot', metadata: { uid: 42 } },
      { id: 'a2', title: 'Import', description: 'same', createdBy: 'Bot', metadata: { uid: 42 } },
    ]);

    const result = await cleanupDuplicateLeadActivities('lead-1');
    expect(result.deleted).toBe(1);
  });
});

describe('deleteLeadActivity', () => {
  it('elimina activitat i retorna 200', async () => {
    const result = await deleteLeadActivity('lead-1', 'act-1');
    expect(result.status).toBe(200);
  });

  it('retorna 404 si no existeix', async () => {
    mockPrisma.leadActivity.findFirst.mockResolvedValue(null);
    const result = await deleteLeadActivity('lead-1', 'inexistent');
    expect(result.status).toBe(404);
  });
});
