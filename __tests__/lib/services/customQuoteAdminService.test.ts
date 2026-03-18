import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customQuote: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminCustomQuotes,
  createAdminCustomQuote,
  getAdminCustomQuote,
  updateAdminCustomQuote,
  deleteAdminCustomQuote,
} from '@/lib/services/customQuoteAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customQuote.findMany.mockResolvedValue([]);
  mockPrisma.customQuote.findUnique.mockResolvedValue(null);
  mockPrisma.customQuote.create.mockResolvedValue({ id: 'cq1', name: 'Test' });
  mockPrisma.customQuote.update.mockResolvedValue({ id: 'cq1' });
  mockPrisma.customQuote.delete.mockResolvedValue({});
});

describe('listAdminCustomQuotes', () => {
  it('retorna llista', async () => {
    const result = await listAdminCustomQuotes();
    expect(result).toEqual([]);
  });
});

describe('createAdminCustomQuote', () => {
  it('retorna 400 sense nom', async () => {
    const result = await createAdminCustomQuote({ name: '' });
    expect(result.status).toBe(400);
  });

  it('crea amb defaults', async () => {
    const result = await createAdminCustomQuote({ name: 'Pressupost personalitzat' });

    expect(result.status).toBe(201);
    expect(mockPrisma.customQuote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Pressupost personalitzat',
        totalCost: 0,
        suggestedPrice: 0,
        marginPct: 30,
        status: 'DRAFT',
      }),
    });
  });

  it('normalitza status a valors vàlids', async () => {
    await createAdminCustomQuote({ name: 'Test', status: 'SENT' });
    expect(mockPrisma.customQuote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'SENT' }),
    });

    vi.clearAllMocks();
    mockPrisma.customQuote.create.mockResolvedValue({ id: 'cq2' });
    await createAdminCustomQuote({ name: 'Test', status: 'INVALID' });
    expect(mockPrisma.customQuote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'DRAFT' }),
    });
  });

  it('fa trim dels camps de text', async () => {
    await createAdminCustomQuote({
      name: '  Nom  ',
      clientName: '  Client  ',
      clientEmail: '  email@test.com  ',
      notes: '  Notes  ',
    });

    expect(mockPrisma.customQuote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Nom',
        clientName: 'Client',
        clientEmail: 'email@test.com',
        notes: 'Notes',
      }),
    });
  });
});

describe('getAdminCustomQuote', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getAdminCustomQuote('inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna 200 si existeix', async () => {
    mockPrisma.customQuote.findUnique.mockResolvedValue({ id: 'cq1', name: 'Test' });
    const result = await getAdminCustomQuote('cq1');
    expect(result.status).toBe(200);
  });
});

describe('updateAdminCustomQuote', () => {
  it('actualitza camps proporcionats', async () => {
    await updateAdminCustomQuote('cq1', { name: 'Actualitzat', status: 'ACCEPTED' });

    expect(mockPrisma.customQuote.update).toHaveBeenCalledWith({
      where: { id: 'cq1' },
      data: expect.objectContaining({ name: 'Actualitzat', status: 'ACCEPTED' }),
    });
  });
});

describe('deleteAdminCustomQuote', () => {
  it('elimina per id', async () => {
    const result = await deleteAdminCustomQuote('cq1');

    expect(result.status).toBe(200);
    expect(mockPrisma.customQuote.delete).toHaveBeenCalledWith({ where: { id: 'cq1' } });
  });
});
