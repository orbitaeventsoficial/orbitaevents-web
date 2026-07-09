import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockSendEmail,
  mockBuildHtml,
  mockGetDossierCollaboratorProductsByIds,
  mockCollaboratorProductToAnimacioProduct,
  mockLegacyDossierCollaboratorProductIdFor,
} = vi.hoisted(() => ({
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
    adminLog: {
      create: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  },
  mockSendEmail: vi.fn(),
  mockBuildHtml: vi.fn(),
  mockGetDossierCollaboratorProductsByIds: vi.fn(),
  mockCollaboratorProductToAnimacioProduct: vi.fn(),
  mockLegacyDossierCollaboratorProductIdFor: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/utils/dossier-html-builder', () => ({ buildDossierHtml: mockBuildHtml }));
vi.mock('@/lib/services/collaboratorProductService', () => ({
  getDossierCollaboratorProductsByIds: mockGetDossierCollaboratorProductsByIds,
  collaboratorProductToAnimacioProduct: mockCollaboratorProductToAnimacioProduct,
  legacyDossierCollaboratorProductIdFor: mockLegacyDossierCollaboratorProductIdFor,
}));
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
      kicker: '', title: '', greeting: '', greetingDefault: '', offerCountOne: '', offerCountMany: '',
      summaryOfferLabel: '', summaryFormatLabel: '', summaryFormatValue: '', summaryGoalLabel: '', summaryGoalValue: '',
    },
    chapter: { eyebrow: '', priceLabel: '', priceFromPrefix: '', priceCustom: '', durationLabel: '', includesTitle: '', noteLabel: '' },
    resum: { kicker: '', title: '', lead: '' },
    budget: {
      servicesLabel: '',
      travelTitle: '',
      travelNote: '',
      travelRoute: '',
      travelPriceLabel: '',
      travelBreakdownLabel: '',
      travelBreakdownVehicle: '',
      travelBreakdownVehicleDetail: '',
      travelBreakdownPeople: '',
      travelBreakdownTolls: '',
      travelBreakdownMeals: '',
      seasonDetail: '',
      vatNote: '',
    },
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
  buildDossierHtmlForDossier,
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
  mockGetDossierCollaboratorProductsByIds.mockResolvedValue([]);
  mockCollaboratorProductToAnimacioProduct.mockImplementation((product: unknown) => product);
  mockLegacyDossierCollaboratorProductIdFor.mockImplementation((product: { nom?: string }) => {
    if (product?.nom === 'Bingo Musical') return 'bingo-musical';
    if (product?.nom === 'Batalla Musical') return 'batalla-musical';
    return null;
  });
  mockPrisma.adminLog.create.mockResolvedValue({});
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
  lineSnapshot: null,
  sentAt: null,
  sentTo: null,
  deletedAt: null,
  createdAt: new Date(),
};

function lastRawQueryText(): string {
  const firstArg = mockPrisma.$queryRaw.mock.calls.at(-1)?.[0] as unknown;
  if (Array.isArray(firstArg)) return firstArg.join('');
  if (firstArg && typeof firstArg === 'object' && Array.isArray((firstArg as { raw?: unknown }).raw)) {
    return ((firstArg as { raw: string[] }).raw).join('');
  }
  return String(firstArg ?? '');
}

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

  it('desa la foto immutable del dossier quan arriba lineSnapshot', async () => {
    mockPrisma.dossier.create.mockResolvedValue(mockDossier);
    await createDossier({
      nom: 'Joan Pla',
      productIds: ['collab:bingo'],
      lineSnapshot: {
        version: 1,
        products: [{
          id: 'collab:bingo',
          nom: 'Bingo Musical congelat',
          descripcio: ['Text del moment'],
          inclou: ['Equip'],
          priceFrom: 240,
        }],
        travelKm: 70,
        travelLocation: 'Granollers',
      },
    });

    expect(mockPrisma.dossier.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lineSnapshot: expect.objectContaining({
          version: 1,
          travelKm: 70,
          travelLocation: 'Granollers',
          products: [expect.objectContaining({ id: 'collab:bingo', nom: 'Bingo Musical congelat' })],
        }),
      }),
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
      eventDate: '2026-07-25',
      travelLocation: 'Canyamars',
      distanceKm: null,
      tollsEur: null,
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

describe('buildDossierHtmlForDossier', () => {
  it('construeix la preview desada amb snapshot, transport i base absoluta d imatges', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({
      ...mockDossier,
      productIds: ['bingo-musical'],
      lineSnapshot: {
        version: 1,
        products: [{
          id: 'bingo-musical',
          nom: 'Bingo Musical congelat',
          descripcio: ['Text snapshot'],
          inclou: ['Equip snapshot'],
          image: '/img/collaborators/masquerade/bingo-musical.jpg',
          priceFrom: 999,
        }],
        travelKm: 123,
        travelTollsEur: 4.5,
        travelLocation: 'Snapshot City',
        eventDate: '2026-07-17',
      },
    });

    const result = await buildDossierHtmlForDossier('dos-1', {
      logoDataUri: 'data:image/svg+xml;base64,logo',
      assetBaseUrl: 'http://localhost:3000',
    });

    expect(result?.html).toBe('<html>dossier</html>');
    expect(mockBuildHtml).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Joan Pla' }),
      [expect.objectContaining({
        id: 'bingo-musical',
        nom: 'Bingo Musical congelat',
        image: '/img/collaborators/masquerade/bingo-musical.jpg',
      })],
      expect.anything(),
      expect.objectContaining({
        logoDataUri: 'data:image/svg+xml;base64,logo',
        assetBaseUrl: 'http://localhost:3000',
        travelKm: 123,
        travelTollsEur: 4.5,
        location: 'Snapshot City',
        eventDate: '2026-07-17',
      }),
    );
    expect(result?.dataSource).toBe('snapshot');
  });
});

describe('getAllDossiers', () => {
  it('retorna dossiers actius via $queryRaw', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([mockDossier]);
    const result = await getAllDossiers();
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(lastRawQueryText()).toContain('LEFT JOIN "customers"');
    expect(lastRawQueryText()).toContain("'customerId'");
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
    expect(lastRawQueryText()).toContain('LEFT JOIN "customers"');
    expect(lastRawQueryText()).toContain("'customerName'");
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

  it('registra traça documental amb origen client/lead en enviar dossier', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({
      ...mockDossier,
      lineSnapshot: {
        version: 1,
        products: [{
          id: 'bingo-musical',
          nom: 'Bingo Musical congelat',
          descripcio: ['Text snapshot'],
          inclou: ['Equip snapshot'],
          priceFrom: 999,
        }],
      },
    });
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-1',
      name: 'Lead Joan',
      customerId: 'cust-1',
      customer: { name: 'Client Joan' },
    });
    mockSendEmail.mockResolvedValue(undefined);
    mockPrisma.dossier.update.mockResolvedValue(mockDossier);

    const result = await sendDossierByEmail('dos-1');

    expect(result).toEqual({ ok: true });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_DOSSIER_SENT',
        entity: 'dossier',
        entityId: 'dos-1',
        details: expect.objectContaining({
          documentType: 'DOSSIER',
          source: 'dossier_email_send',
          dataSource: 'snapshot',
          dossierId: 'dos-1',
          leadId: 'lead-1',
          leadName: 'Lead Joan',
          customerId: 'cust-1',
          customerName: 'Client Joan',
          to: 'joan@example.com',
          productCount: 1,
        }),
      }),
    });
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

  it('envia usant el lineSnapshot si existeix, no el cataleg actual', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({
      ...mockDossier,
      productIds: ['bingo-musical'],
      lineSnapshot: {
        version: 1,
        products: [{
          id: 'bingo-musical',
          nom: 'Bingo Musical congelat',
          descripcio: ['Text snapshot'],
          inclou: ['Equip snapshot'],
          priceFrom: 999,
        }],
        travelKm: 123,
        travelLocation: 'Snapshot City',
      },
    });
    mockSendEmail.mockResolvedValue(undefined);
    mockPrisma.dossier.update.mockResolvedValue(mockDossier);

    await sendDossierByEmail('dos-1');

    expect(mockPrisma.lead.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-1' },
      select: expect.objectContaining({ customerId: true }),
    }));
    expect(mockBuildHtml).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Joan Pla' }),
      [expect.objectContaining({ id: 'bingo-musical', nom: 'Bingo Musical congelat', priceFrom: 999 })],
      expect.anything(),
      expect.objectContaining({ travelKm: 123, location: 'Snapshot City' }),
    );
  });

  it('rehidrata peatges del lead si un snapshot antic de productes no els portava', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({
      ...mockDossier,
      productIds: ['bingo-musical'],
      lineSnapshot: {
        version: 1,
        products: [{
          id: 'bingo-musical',
          nom: 'Bingo Musical congelat',
          descripcio: ['Text snapshot'],
          inclou: ['Equip snapshot'],
          priceFrom: 999,
        }],
        travelKm: 422,
        travelLocation: "l'Aldosa",
      },
    });
    mockPrisma.lead.findUnique
      .mockResolvedValueOnce({
        distanceKm: 422,
        tollsEur: 18.5,
        eventLocation: "l'Aldosa",
      })
      .mockResolvedValueOnce({
        id: 'lead-1',
        name: 'Lead Joan',
        customerId: null,
        customer: null,
      });
    mockSendEmail.mockResolvedValue(undefined);
    mockPrisma.dossier.update.mockResolvedValue(mockDossier);

    await sendDossierByEmail('dos-1');

    expect(mockBuildHtml).toHaveBeenCalledWith(
      expect.objectContaining({ nom: 'Joan Pla' }),
      [expect.objectContaining({ id: 'bingo-musical', nom: 'Bingo Musical congelat', priceFrom: 999 })],
      expect.anything(),
      expect.objectContaining({ travelKm: 422, travelTollsEur: 18.5, location: "l'Aldosa" }),
    );
  });

  it('envia el dossier amb ubicació de ruta neta del lead, no amb el resum complet de l\'event', async () => {
    mockPrisma.dossier.findUnique.mockResolvedValue({
      ...mockDossier,
      eventDesc: "2026-09-05 · 17:00-18:30 · l'Aldosa · 30 pax",
      productIds: ['bingo-musical'],
    });
    mockPrisma.lead.findUnique.mockResolvedValue({ distanceKm: 422, eventLocation: "l'Aldosa" });
    mockSendEmail.mockResolvedValue(undefined);
    mockPrisma.dossier.update.mockResolvedValue(mockDossier);

    await sendDossierByEmail('dos-1');

    expect(mockBuildHtml).toHaveBeenCalledWith(
      expect.objectContaining({ eventDesc: "2026-09-05 · 17:00-18:30 · l'Aldosa · 30 pax" }),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ travelKm: 422, location: "l'Aldosa" }),
    );
  });
});
