import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockGetDossierById,
  mockResolveDossierTraceOrigin,
  mockGetAnimacioProducts,
  mockGetCollaboratorProducts,
  mockProductsFromSnapshot,
  mockGeneratePdf,
  mockAdminLogCreate,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGetDossierById: vi.fn(),
  mockResolveDossierTraceOrigin: vi.fn(),
  mockGetAnimacioProducts: vi.fn(),
  mockGetCollaboratorProducts: vi.fn(),
  mockProductsFromSnapshot: vi.fn(),
  mockGeneratePdf: vi.fn(),
  mockAdminLogCreate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/constants/animacio-products-resolver', () => ({ getAnimacioProducts: mockGetAnimacioProducts }));
vi.mock('@/lib/services/dossierService', () => ({
  getDossierById: mockGetDossierById,
  resolveDossierTraceOrigin: mockResolveDossierTraceOrigin,
}));
vi.mock('@/lib/services/dossierCompositePdfService', () => ({ generateDossierCompositePDF: mockGeneratePdf }));
vi.mock('@/lib/services/collaboratorProductService', () => ({ getDossierCollaboratorProductsByIds: mockGetCollaboratorProducts }));
vi.mock('@/lib/services/dossierSnapshotService', () => ({ productsFromDossierLineSnapshot: mockProductsFromSnapshot }));
vi.mock('@/lib/prisma', () => ({ prisma: { adminLog: { create: mockAdminLogCreate } } }));

import { GET } from '@/app/api/admin/dossiers/[id]/composite/route';

function req(url = 'http://localhost/api/admin/dossiers/d1/composite') {
  return new NextRequest(url);
}

describe('GET /api/admin/dossiers/[id]/composite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockGetDossierById.mockResolvedValue({
      id: 'd1',
      leadId: 'lead-1',
      nom: 'Anna',
      empresa: null,
      telefon: null,
      email: null,
      eventDesc: 'Festa',
      salutacio: null,
      productIds: ['p1'],
      lineSnapshot: null,
    });
    mockProductsFromSnapshot.mockReturnValue(null);
    mockResolveDossierTraceOrigin.mockResolvedValue({
      leadId: 'lead-1',
      leadName: 'Anna lead',
      customerId: 'cust-1',
      customerName: 'Anna client',
    });
    mockGetAnimacioProducts.mockResolvedValue([
      { id: 'p1', nom: 'Bingo', durada: '1h', descripcio: ['Desc'], inclou: ['Equip'] },
    ]);
    mockGetCollaboratorProducts.mockResolvedValue([]);
    mockGeneratePdf.mockResolvedValue({
      output: () => new Uint8Array([1, 2, 3]).buffer,
    });
    mockAdminLogCreate.mockResolvedValue({});
  });

  it('genera PDF i registra traça documental a adminLog', async () => {
    const res = await GET(req('http://localhost/api/admin/dossiers/d1/composite?extras=Transport:50'), {
      params: { id: 'd1' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(mockAdminLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_DOSSIER_COMPOSITE_PDF_GENERATED',
        entity: 'dossier',
        entityId: 'd1',
        details: expect.objectContaining({
          documentType: 'DOSSIER',
          source: 'dossier_composite_pdf',
          dataSource: 'live_catalog',
          dossierId: 'd1',
          leadId: 'lead-1',
          customerId: 'cust-1',
          filename: 'dossier-complet-d1.pdf',
          clientName: 'Anna',
          productIds: ['p1'],
          productCount: 1,
          collaboratorProductCount: 0,
          extrasCount: 1,
        }),
      }),
    });
  });

  it('retorna igualment el PDF si adminLog falla', async () => {
    mockAdminLogCreate.mockRejectedValueOnce(new Error('log down'));

    const res = await GET(req(), { params: { id: 'd1' } });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });
});
