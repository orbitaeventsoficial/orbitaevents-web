import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    fAQ: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminFaqs,
  getAdminFaqById,
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
} from '@/lib/services/faqAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.fAQ.findMany.mockResolvedValue([]);
  mockPrisma.fAQ.findUnique.mockResolvedValue(null);
  mockPrisma.fAQ.create.mockResolvedValue({ id: 'faq-1', slug: 'test' });
  mockPrisma.fAQ.update.mockResolvedValue({ id: 'faq-1', slug: 'test' });
  mockPrisma.fAQ.delete.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('listAdminFaqs', () => {
  it('retorna faqs ordenades', async () => {
    mockPrisma.fAQ.findMany.mockResolvedValue([
      { id: 'f1', slug: 'a', translations: [] },
      { id: 'f2', slug: 'b', translations: [] },
    ]);

    const result = await listAdminFaqs();

    expect(result.ok).toBe(true);
    expect(result.faqs).toHaveLength(2);
    expect(mockPrisma.fAQ.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { translations: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      })
    );
  });
});

describe('getAdminFaqById', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getAdminFaqById('inexistent');
    expect(result.status).toBe(404);
  });

  it('retorna faq si existeix', async () => {
    mockPrisma.fAQ.findUnique.mockResolvedValue({ id: 'f1', slug: 'test', translations: [] });

    const result = await getAdminFaqById('f1');

    expect(result.status).toBe(200);
    expect(result.body.faq!.slug).toBe('test');
  });
});

describe('createAdminFaq', () => {
  it('retorna 400 sense slug', async () => {
    const result = await createAdminFaq({ translations: [{ locale: 'ca', question: 'Q', answer: 'A' }] });
    expect(result.status).toBe(400);
  });

  it('retorna 400 sense traduccions', async () => {
    const result = await createAdminFaq({ slug: 'test' });
    expect(result.status).toBe(400);
  });

  it('retorna 400 si slug duplicat', async () => {
    mockPrisma.fAQ.findUnique.mockResolvedValue({ id: 'existing' });

    const result = await createAdminFaq({
      slug: 'existing',
      translations: [{ locale: 'ca', question: 'Q', answer: 'A' }],
    });

    expect(result.status).toBe(400);
  });

  it('crea faq amb traduccions i adminLog', async () => {
    const result = await createAdminFaq({
      slug: 'nova-faq',
      category: 'serveis',
      order: 5,
      translations: [
        { locale: 'ca', question: 'Pregunta?', answer: 'Resposta' },
        { locale: 'es', question: 'Pregunta?', answer: 'Respuesta' },
      ],
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.fAQ.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'nova-faq',
          category: 'serveis',
          order: 5,
          translations: {
            create: expect.arrayContaining([
              expect.objectContaining({ locale: 'ca', question: 'Pregunta?' }),
            ]),
          },
        }),
      })
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CREATE', entity: 'faq' }),
    });
  });

  it('usa defaults per category i order', async () => {
    await createAdminFaq({
      slug: 'simple',
      translations: [{ locale: 'ca', question: 'Q', answer: 'A' }],
    });

    expect(mockPrisma.fAQ.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'general',
          order: 0,
          isActive: true,
        }),
      })
    );
  });
});

describe('updateAdminFaq', () => {
  it('actualitza camps i crea adminLog', async () => {
    const result = await updateAdminFaq('faq-1', {
      slug: 'updated',
      isActive: false,
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.fAQ.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'faq-1' },
        data: expect.objectContaining({ slug: 'updated', isActive: false }),
      })
    );
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'UPDATE', entity: 'faq' }),
    });
  });

  it('substitueix traduccions (deleteMany + create)', async () => {
    await updateAdminFaq('faq-1', {
      translations: [{ locale: 'en', question: 'Q?', answer: 'A' }],
    });

    const call = mockPrisma.fAQ.update.mock.calls[0][0];
    expect(call.data.translations).toEqual({
      deleteMany: {},
      create: [{ locale: 'en', question: 'Q?', answer: 'A' }],
    });
  });
});

describe('deleteAdminFaq', () => {
  it('retorna 400 sense id', async () => {
    const result = await deleteAdminFaq(null);
    expect(result.status).toBe(400);
  });

  it('elimina i crea adminLog', async () => {
    const result = await deleteAdminFaq('faq-1');

    expect(result.status).toBe(200);
    expect(mockPrisma.fAQ.delete).toHaveBeenCalledWith({ where: { id: 'faq-1' } });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'DELETE', entity: 'faq', entityId: 'faq-1' }),
    });
  });
});
