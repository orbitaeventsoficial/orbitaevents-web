import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadNote: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadNoteAdded: vi.fn(),
}));

import {
  createLeadNote,
  cleanupDuplicateLeadNotes,
  deleteLeadNote,
} from '@/lib/services/leadNoteService';
import { recordLeadNoteAdded } from '@/lib/services/leadActivityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
  mockPrisma.leadNote.create.mockResolvedValue({ id: 'note-1' });
  mockPrisma.leadNote.findMany.mockResolvedValue([]);
  mockPrisma.leadNote.findFirst.mockResolvedValue({ id: 'note-1' });
  mockPrisma.leadNote.delete.mockResolvedValue({});
  mockPrisma.leadNote.deleteMany.mockResolvedValue({ count: 0 });
});

describe('createLeadNote', () => {
  it('crea nota i retorna 200', async () => {
    const result = await createLeadNote('lead-1', 'Nota test');
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it('retorna 400 si contingut buit', async () => {
    const result = await createLeadNote('lead-1', '');
    expect(result.status).toBe(400);
  });

  it('retorna 400 si contingut espais en blanc', async () => {
    const result = await createLeadNote('lead-1', '   ');
    expect(result.status).toBe(400);
  });

  it('retorna 404 si lead no existeix', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const result = await createLeadNote('inexistent', 'Test');
    expect(result.status).toBe(404);
  });

  it('registra leadActivity associada via capa shared', async () => {
    await createLeadNote('lead-1', 'Nota important');
    expect(recordLeadNoteAdded).toHaveBeenCalledWith({
      leadId: 'lead-1',
      content: 'Nota important',
      createdBy: 'Admin',
    });
  });

  it('usa createdBy o Admin per defecte', async () => {
    await createLeadNote('lead-1', 'Test', 'Custom User');
    expect(mockPrisma.leadNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ createdBy: 'Custom User' }),
    });

    await createLeadNote('lead-1', 'Test');
    expect(mockPrisma.leadNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ createdBy: 'Admin' }),
    });
  });
});

describe('cleanupDuplicateLeadNotes', () => {
  it('no elimina si no hi ha duplicats', async () => {
    mockPrisma.leadNote.findMany.mockResolvedValue([
      { id: 'n1', content: 'Nota 1' },
      { id: 'n2', content: 'Nota 2' },
    ]);

    const result = await cleanupDuplicateLeadNotes('lead-1');
    expect(result.deleted).toBe(0);
  });

  it('elimina notes duplicades per contingut', async () => {
    mockPrisma.leadNote.findMany.mockResolvedValue([
      { id: 'n1', content: 'Duplicada' },
      { id: 'n2', content: 'Duplicada' },
    ]);

    const result = await cleanupDuplicateLeadNotes('lead-1');
    expect(result.deleted).toBe(1);
    expect(mockPrisma.leadNote.deleteMany).toHaveBeenCalled();
  });

  it('elimina notes duplicades per UID', async () => {
    mockPrisma.leadNote.findMany.mockResolvedValue([
      { id: 'n1', content: 'Import (UID 123) blah' },
      { id: 'n2', content: 'Import (UID 123) different text' },
    ]);

    const result = await cleanupDuplicateLeadNotes('lead-1');
    expect(result.deleted).toBe(1);
  });
});

describe('deleteLeadNote', () => {
  it('elimina nota i retorna 200', async () => {
    const result = await deleteLeadNote('lead-1', 'note-1');
    expect(result.status).toBe(200);
    expect(mockPrisma.leadNote.delete).toHaveBeenCalledWith({ where: { id: 'note-1' } });
  });

  it('retorna 400 sense noteId', async () => {
    const result = await deleteLeadNote('lead-1', null);
    expect(result.status).toBe(400);
  });

  it('retorna 404 si nota no trobada', async () => {
    mockPrisma.leadNote.findFirst.mockResolvedValue(null);
    const result = await deleteLeadNote('lead-1', 'inexistent');
    expect(result.status).toBe(404);
  });
});
