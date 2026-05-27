import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockBuildHtml } = vi.hoisted(() => ({
  mockPrisma: {
    dossier: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
  mockSendEmail: vi.fn(),
  mockBuildHtml: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/utils/dossier-html-builder', () => ({ buildDossierHtml: mockBuildHtml }));
vi.mock('@/lib/constants/animacio-products', () => ({
  ANIMACIO_PRODUCTS: [
    { id: 'bingo-musical', nom: 'Bingo Musical', descripcio: [], inclou: [] },
    { id: 'batalla-musical', nom: 'Batalla Musical', descripcio: [], inclou: [] },
  ],
}));

import {
  createDossier,
  getDossiersByLead,
  getDossierById,
  deleteDossier,
  sendDossierByEmail,
} from '@/lib/services/dossierService';

beforeEach(() => {
  vi.clearAllMocks();
  mockBuildHtml.mockReturnValue('<html>dossier</html>');
});

const mockDossier = {
  id: 'dos-1',
  leadId: 'lead-1',
  nom: 'Joan Pla',
  empresa: null,
  telefon: '600123456',
  email: 'joan@example.com',
  eventDesc: null,
  salutacio: null,
  productIds: ['bingo-musical'],
  sentAt: null,
  sentTo: null,
  createdAt: new Date(),
};

describe('createDossier', () => {
  it('crea el dossier amb les dades', async () => {
    mockPrisma.dossier.create.mockResolvedValue(mockDossier);
    const result = await createDossier({
      leadId: 'lead-1',
      nom: 'Joan Pla',
      telefon: '600123456',
      email: 'joan@example.com',
      productIds: ['bingo-musical'],
    });
    expect(mockPrisma.dossier.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ nom: 'Joan Pla', leadId: 'lead-1' }),
    });
    expect(result).toEqual(mockDossier);
  });

  it('usa null per camps opcionals buits', async () => {
    mockPrisma.dossier.create.mockResolvedValue({ ...mockDossier, leadId: null });
    await createDossier({ nom: 'Test', productIds: [] });
    expect(mockPrisma.dossier.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ leadId: null, empresa: null }),
    });
  });
});

describe('getDossiersByLead', () => {
  it('retorna dossiers ordenats per data', async () => {
    mockPrisma.dossier.findMany.mockResolvedValue([mockDossier]);
    const result = await getDossiersByLead('lead-1');
    expect(mockPrisma.dossier.findMany).toHaveBeenCalledWith({
      where: { leadId: 'lead-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(1);
  });
});

describe('getDossierById', () => {
  it('retorna el dossier pel seu id', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue(mockDossier);
    const result = await getDossierById('dos-1');
    expect(mockPrisma.dossier.findUnique).toHaveBeenCalledWith({ where: { id: 'dos-1' } });
    expect(result).toEqual(mockDossier);
  });

  it('retorna null si no existeix', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue(null);
    const result = await getDossierById('inexistent');
    expect(result).toBeNull();
  });
});

describe('deleteDossier', () => {
  it('elimina el dossier', async () => {
    mockPrisma.dossier.delete.mockResolvedValue(mockDossier);
    await deleteDossier('dos-1');
    expect(mockPrisma.dossier.delete).toHaveBeenCalledWith({ where: { id: 'dos-1' } });
  });
});

describe('sendDossierByEmail', () => {
  it('retorna error si el dossier no existeix', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue(null);
    const result = await sendDossierByEmail('dos-inexistent');
    expect(result).toEqual({ ok: false, error: 'Dossier no trobat' });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('retorna error si no té email', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({ ...mockDossier, email: null });
    const result = await sendDossierByEmail('dos-1');
    expect(result).toEqual({ ok: false, error: 'El dossier no té email de destinatari' });
  });

  it('envia email i actualitza sentAt', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue(mockDossier);
    mockSendEmail.mockResolvedValue(undefined);
    mockPrisma.dossier.update.mockResolvedValue({ ...mockDossier, sentAt: new Date() });

    const result = await sendDossierByEmail('dos-1');
    expect(result).toEqual({ ok: true });
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joan@example.com',
        subject: expect.stringContaining('Joan Pla'),
      }),
    );
    expect(mockPrisma.dossier.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'dos-1' } }),
    );
  });

  it('retorna error si sendEmail falla', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue(mockDossier);
    mockSendEmail.mockRejectedValue(new Error('SMTP error'));

    const result = await sendDossierByEmail('dos-1');
    expect(result).toEqual({ ok: false, error: 'SMTP error' });
    expect(mockPrisma.dossier.update).not.toHaveBeenCalled();
  });

  it('filtra productes pels ids del dossier', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({
      ...mockDossier,
      productIds: ['bingo-musical'],
    });
    mockSendEmail.mockResolvedValue(undefined);
    mockPrisma.dossier.update.mockResolvedValue(mockDossier);

    await sendDossierByEmail('dos-1');
    expect(mockBuildHtml).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Joan Pla' }),
      expect.arrayContaining([expect.objectContaining({ id: 'bingo-musical' })]),
    );
  });
});
