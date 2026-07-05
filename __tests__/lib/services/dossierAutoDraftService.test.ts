import { describe, expect, it, vi } from 'vitest';
import type { AnimacioProduct } from '@/lib/constants/animacio-products';
import { DOSSIER_DJ_PRODUCT_ID } from '@/lib/services/dossierProductMappingService';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/constants/dossier-copy', () => ({ getOrbitaDossierProducts: vi.fn() }));
vi.mock('@/lib/services/collaboratorProductService', () => ({
  collaboratorProductToAnimacioProduct: vi.fn(),
  listDossierCollaboratorProducts: vi.fn(),
}));
vi.mock('@/lib/services/dossierService', () => ({
  createDossier: vi.fn(),
  getDossierLeadInitialData: vi.fn(),
}));

import { composeDossierDraftFromLead } from '@/lib/services/dossierAutoDraftService';

const products: AnimacioProduct[] = [
  { id: DOSSIER_DJ_PRODUCT_ID, nom: 'DJ Òrbita', descripcio: ['DJ'], inclou: ['DJ'], priceFrom: 150 },
  { id: 'collab:masq-bingo', nom: 'Bingo Musical', descripcio: ['Bingo'], inclou: ['Animació'], priceFrom: 250 },
];

const lead = {
  id: 'lead-1',
  nom: 'Alba Orna',
  email: 'alba@example.com',
  telefon: '600000000',
  eventDesc: 'Boda · 2026-09-05',
  travelLocation: 'Andorra',
  distanceKm: 422,
};

describe('composeDossierDraftFromLead', () => {
  it('crea input DRAFT amb productes congelats i transport del lead', () => {
    const result = composeDossierDraftFromLead({
      lead,
      products,
      serviceLines: [
        { kind: 'DJ', label: 'DJ · primera hora', revenueAmount: 150, quantity: 1 },
        { kind: 'DJ', label: 'DJ · hora extra', revenueAmount: 100, quantity: 2 },
        { kind: 'PROVIDER_SERVICE', label: 'Bingo Musical', revenueAmount: 250, quantity: 1 },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input).toMatchObject({
      leadId: 'lead-1',
      nom: 'Alba Orna',
      mode: 'DRAFT',
      productIds: [DOSSIER_DJ_PRODUCT_ID, 'collab:masq-bingo'],
    });
    expect(result.input.lineSnapshot).toMatchObject({
      version: 1,
      travelKm: 422,
      travelLocation: 'Andorra',
      products: [
        expect.objectContaining({ id: DOSSIER_DJ_PRODUCT_ID, priceFrom: 350, durada: '3h' }),
        expect.objectContaining({ id: 'collab:masq-bingo', nom: 'Bingo Musical' }),
      ],
    });
  });

  it('no crea esborrany si el lead no té cap línia mapejable', () => {
    const result = composeDossierDraftFromLead({
      lead,
      products,
      serviceLines: [{ kind: 'OTHER', label: 'Servei desconegut', revenueAmount: 100, quantity: 1 }],
    });
    expect(result).toEqual({ ok: false, error: 'El lead no té línies de bolo mapejables al catàleg del dossier.' });
  });
});
