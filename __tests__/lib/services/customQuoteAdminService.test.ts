import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customQuote: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  CUSTOM_QUOTE_RETIRED_ERROR,
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
});

describe('listAdminCustomQuotes', () => {
  it('manté lectura històrica de custom quotes si mai n’hi ha', async () => {
    const result = await listAdminCustomQuotes();

    expect(result).toEqual([]);
    expect(mockPrisma.customQuote.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
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

describe('custom quote mutations retired', () => {
  it('rebutja crear pressupostos paral·lels', async () => {
    const result = await createAdminCustomQuote({ name: 'Pressupost personalitzat' });

    expect(result).toEqual({
      status: 410,
      body: { error: CUSTOM_QUOTE_RETIRED_ERROR, canonicalRoute: '/admin/presupuestos' },
    });
  });

  it('rebutja actualitzar pressupostos paral·lels', async () => {
    const result = await updateAdminCustomQuote('cq1', { status: 'SENT' });

    expect(result.status).toBe(410);
  });

  it('rebutja eliminar des del carril retirat', async () => {
    const result = await deleteAdminCustomQuote('cq1');

    expect(result.status).toBe(410);
  });
});
