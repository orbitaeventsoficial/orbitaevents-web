import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toastApi } = vi.hoisted(() => ({
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({ useToast: () => toastApi }));
vi.mock('@/app/admin/components/ConfirmDialog', () => ({
  default: () => null,
  useConfirmDialog: () => ({ confirm: vi.fn(), dialogProps: {} }),
}));
vi.mock('@/app/admin/collaborators/CollaboratorProductsPanel', () => ({
  default: ({ products }: { products: Array<{ id: string; name: string }> }) => (
    <div data-testid="collaborator-products">
      {products.map((product) => (
        <span key={product.id}>{product.name}</span>
      ))}
    </div>
  ),
}));

import CollaboratorsClient from '@/app/admin/collaborators/CollaboratorsClient';

const collaboratorsResponse = {
  collaborators: [
    {
      id: 'carlos-lucas-fernandez',
      name: 'Carlos Lucas Fernández',
      company: 'Masquerade Events',
      email: null,
      phone: null,
      specialty: 'Presentador',
      roles: ['PROVIDER', 'CLIENT_PARTNER', 'REFERRER'],
      commissionPct: 0,
      pricingModel: 'DISCOUNT',
      costPerHour: 100,
      notes: null,
      isActive: true,
      products: [
        { id: 'active-product', name: 'Bingo Musical', isActive: true },
        { id: 'inactive-product', name: 'ZENIT E2E alta baixa 20260710', isActive: false },
      ],
      _count: { sourcedLeads: 0, sourcedBookings: 0 },
    },
    {
      id: 'proveidor-so',
      name: 'Proveïdor de so',
      company: null,
      email: null,
      phone: null,
      specialty: 'So',
      roles: ['PROVIDER'],
      commissionPct: 0,
      pricingModel: 'DISCOUNT',
      costPerHour: null,
      notes: null,
      isActive: true,
      products: [],
      _count: { sourcedLeads: 0, sourcedBookings: 0 },
    },
  ],
  kpis: {
    total: 2,
    active: 2,
    totalProducts: 0,
    catalogValue: 0,
    totalSourcedLeads: 0,
    totalSourcedBookings: 0,
  },
};

describe('CollaboratorsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => collaboratorsResponse,
    }));
  });

  it('filtra socis-clients pel rol CLIENT_PARTNER', async () => {
    render(<CollaboratorsClient />);

    await waitFor(() => expect(screen.getByText('Carlos Lucas Fernández')).toBeInTheDocument());
    expect(screen.getByText('Proveïdor de so')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ens contracta com a partner \(1\)/ }));

    expect(screen.getByText('Carlos Lucas Fernández')).toBeInTheDocument();
    expect(screen.queryByText('Proveïdor de so')).not.toBeInTheDocument();
  });

  it('oculta productes inactius del catàleg resum fins que s’activa el filtre', async () => {
    render(<CollaboratorsClient />);

    await waitFor(() => expect(screen.getByText('Carlos Lucas Fernández')).toBeInTheDocument());

    expect(screen.getByText('Bingo Musical')).toBeInTheDocument();
    expect(screen.queryByText('ZENIT E2E alta baixa 20260710')).not.toBeInTheDocument();
    expect(screen.getByText('1 productes inactius ocults. Activa el filtre per revisar-los.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mostrar productes inactius' }));

    expect(screen.getByText('ZENIT E2E alta baixa 20260710')).toBeInTheDocument();
  });
});
