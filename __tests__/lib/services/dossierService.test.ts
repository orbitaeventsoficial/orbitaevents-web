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
    lead: {
      findUnique: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
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
// El resolver real importa 'server-only' + getTranslations (next-intl/server). En
// vitest, next-intl resol de forma no determinista a la variant client (que llança
// "not supported in Client Components"). Mockem el resolver perquè el test no depengui
// de la resolució de next-intl i sigui determinista.
vi.mock('@/lib/constants/animacio-products-resolver', () => ({
  getAnimacioProducts: vi.fn(async () => [
    { id: 'bingo-musical', nom: 'Bingo Musical', descripcio: [], inclou: [] },
    { id: 'batalla-musical', nom: 'Batalla Musical', descripcio: [], inclou: [] },
  ]),
}));
// El resolver de textos del dossier també importa 'server-only' + next-intl/server.
// El mockem perquè el test sigui determinista (buildDossierHtml ja està mockejat).
vi.mock('@/lib/constants/dossier-copy', () => ({
  getDossierCopy: vi.fn(async () => ({
    portada: { eyebrow: '', clientLabel: '', bottom: '' },
    intro: {
      kicker: '', title: '', greetingDefault: '', offerCountOne: '', offerCountMany: '',
      summaryOfferLabel: '', summaryFormatLabel: '', summaryFormatValue: '', summaryGoalLabel: '', summaryGoalValue: '',
    },
    chapter: { eyebrow: '', priceLabel: '', priceFromPrefix: '', priceCustom: '', durationLabel: '', includesTitle: '', noteLabel: '' },
    resum: { kicker: '', title: '', lead: '', totalLabel: '', travelLabel: '' },
    cta: { label: '' },
  })),
  getOrbitaDossierProducts: vi.fn(async () => []),
}));

import {
  createDossier,
  getDossiersByLead,
  getDossierById,
  getAllDossiers,
  getDossierLeadInitialData,
  softDeleteDossier,
  restoreDossier,
  purgeDossier,
  getDeletedDossiers,
  purgeExpiredDossiers,
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
  deletedAt: null,
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

describe('getDossierLeadInitialData', () => {
  it('precarrega dades completes del lead per obrir un dossier vinculat', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-estel',
      name: 'Estel Giralt',
      email: 'estel.giralt@gmail.com',
      phone: '661431040',
      eventType: 'BIRTHDAY',
      eventDate: new Date('2026-07-25T12:00:00.000Z'),
      eventStartTime: '21:00',
      eventEndTime: '23:00',
        eventLocation: 'Dosrius',
        eventAddress: null,
        guestCount: 30,
        message: 'Adreça: Canyamars\nDJ 2 hores aniversari del seu marit',
    });

    const result = await getDossierLeadInitialData('lead-estel');

    expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-estel' },
    }));
    expect(result).toEqual({
      id: 'lead-estel',
      nom: 'Estel Giralt',
      email: 'estel.giralt@gmail.com',
      telefon: '661431040',
      eventDesc: 'Aniversari · 2026-07-25 · 21:00-23:00 · Canyamars · 30 pax · DJ 2 hores aniversari del seu marit',
      distanceKm: null,
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

describe('getAllDossiers', () => {
  it('retorna dossiers actius via $queryRaw', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([mockDossier]);
    const result = await getAllDossiers();
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

describe('softDeleteDossier', () => {
  it('fa soft-delete via $executeRaw', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(1);
    await softDeleteDossier('dos-1');
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
  });
});

describe('restoreDossier', () => {
  it('restaura el dossier via $executeRaw', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(1);
    await restoreDossier('dos-1');
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
  });
});

describe('purgeDossier', () => {
  it('elimina permanentment via dossier.delete', async () => {
    mockPrisma.dossier.delete.mockResolvedValue(mockDossier);
    await purgeDossier('dos-1');
    expect(mockPrisma.dossier.delete).toHaveBeenCalledWith({ where: { id: 'dos-1' } });
  });
});

describe('getDeletedDossiers', () => {
  it('retorna dossiers de la paperera via $queryRaw', async () => {
    const deleted = { ...mockDossier, deletedAt: new Date() };
    mockPrisma.$queryRaw.mockResolvedValue([deleted]);
    const result = await getDeletedDossiers();
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});

describe('purgeExpiredDossiers', () => {
  it('purga dossiers antics via $executeRaw i retorna count', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(3);
    const cutoff = new Date('2026-01-01');
    const count = await purgeExpiredDossiers(cutoff);
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    expect(count).toBe(3);
  });
});

describe('deleteDossier (deprecated)', () => {
  it('crida softDeleteDossier internament', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(1);
    await deleteDossier('dos-1');
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
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
      expect.anything(),
      expect.anything(),
    );
  });
});
