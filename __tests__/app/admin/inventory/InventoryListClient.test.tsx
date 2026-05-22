import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchWithCsrf = vi.fn();
const mockUseSearchParams = vi.fn();
const toastApi = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt={String(props.alt || '')} {...props} />,
}));

vi.mock('@/app/admin/components/AdminPage', () => ({
  AdminPage: ({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {actions}
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/lib/inventory-utils', () => ({
  CATEGORY_CONFIG: {
    LIGHT: { icon: '💡', label: 'Il·luminació', badge: '' },
  },
  STATUS_CONFIG: {
    AVAILABLE: { label: 'Disponible', className: '' },
    IN_USE: { label: 'En ús', className: '' },
  },
  getInventoryCategoryDisplay: (category: string) => ({ icon: '💡', label: category, className: '' }),
  getInventoryStatusDisplay: (status: string) => ({ label: status, className: '' }),
  getInventoryConditionLabel: (condition: string) => condition,
  calculateLifeRemainingPercent: () => 50,
}));

vi.mock('@/lib/constants', () => ({
  DEFAULT_EXPECTED_LIFE_HOURS: 2000,
  INVENTORY_CATEGORY_OPTIONS: [{ value: 'LIGHT' }],
  INVENTORY_STATUS_OPTIONS: [{ value: 'AVAILABLE' }, { value: 'IN_USE' }],
  formatNumber: (value: number) => String(value),
}));

import InventoryListClient from '@/app/admin/inventory/InventoryListClient';

function response(payload: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  };
}

function makeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'inv-1',
    code: 'FOC-1',
    name: 'Focus principal',
    description: null,
    category: 'LIGHT',
    watts: null,
    value: 500,
    status: 'AVAILABLE',
    condition: 'GOOD',
    isConsumable: false,
    stockQuantity: null,
    minStock: null,
    imageUrl: null,
    purchasePrice: 300,
    expectedLifeHours: 1000,
    totalHoursUsed: 100,
    packItems: [{ id: 'pi-1', pack: { id: 'pack-1', slug: 'pack-1' } }],
    _count: { bookingItems: 1, usageHistory: 1 },
    ...overrides,
  };
}

describe('InventoryListClient health filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockFetchWithCsrf.mockImplementation((url: string) => {
      if (url.startsWith('/api/admin/inventory/bundles')) {
        return Promise.resolve(response({ bundles: [] }));
      }

      return Promise.resolve(
        response({
          items: [
            makeItem({ id: 'old', code: 'OLD-1', name: 'Cap mòbil gastat', totalHoursUsed: 980, expectedLifeHours: 1000, value: 900 }),
            makeItem({ id: 'aging', code: 'AGE-1', name: 'Barra LED envellint', totalHoursUsed: 1700, expectedLifeHours: 2000, value: 700 }),
            makeItem({ id: 'unused', code: 'UNU-1', name: 'Equip sense ús', totalHoursUsed: 0, expectedLifeHours: 2000, purchasePrice: 450, packItems: [], _count: { bookingItems: 0, usageHistory: 0 }, value: 450 }),
            makeItem({ id: 'fresh', code: 'NEW-1', name: 'Equip sa', totalHoursUsed: 200, expectedLifeHours: 2000, value: 300 }),
          ],
          stats: {},
        })
      );
    });
  });

  it('filtra i explica correctament el focus end-of-life', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('health=end-of-life'));

    render(<InventoryListClient />);

    expect((await screen.findAllByText('Mostrant equips que han superat el 95% de la vida útil')).length).toBeGreaterThan(0);
    expect(screen.getByText('Inventari')).toBeInTheDocument();
    expect(screen.getByText('1 elements · 900€ invertits — equips, estat i amortització')).toBeInTheDocument();
    expect(screen.getAllByText('Cap mòbil gastat').length).toBeGreaterThan(0);
    expect(screen.queryByText('Barra LED envellint')).not.toBeInTheDocument();
    expect(screen.queryByText('Equip sense ús')).not.toBeInTheDocument();
  });

  it('filtra i explica correctament el focus unused', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('health=unused'));

    render(<InventoryListClient />);

    expect((await screen.findAllByText('Mostrant equips amb valor econòmic sense cap ús a packs ni reserves')).length).toBeGreaterThan(0);
    expect(screen.getByText('1 elements · 450€ invertits — equips, estat i amortització')).toBeInTheDocument();
    expect(screen.getAllByText('Equip sense ús').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cap mòbil gastat')).not.toBeInTheDocument();
    expect(screen.queryByText('Equip sa')).not.toBeInTheDocument();
  });

  it('filtra i explica correctament el focus aging', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('health=aging'));

    render(<InventoryListClient />);

    expect((await screen.findAllByText('Mostrant equips entre el 80% i el 95% de la vida útil')).length).toBeGreaterThan(0);
    expect(screen.getByText('1 elements · 700€ invertits — equips, estat i amortització')).toBeInTheDocument();
    expect(screen.getAllByText('Barra LED envellint').length).toBeGreaterThan(0);
    expect(screen.queryByText('Cap mòbil gastat')).not.toBeInTheDocument();
    expect(screen.queryByText('Equip sense ús')).not.toBeInTheDocument();
  });

  it('fa emergir friccions operatives del parc abans de filtrar manualment', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
    mockFetchWithCsrf.mockImplementation((url: string) => {
      if (url.startsWith('/api/admin/inventory/bundles')) {
        return Promise.resolve(response({ bundles: [{ id: 'bundle-1', name: 'Lot principal', itemIds: ['linked'] }] }));
      }

      return Promise.resolve(
        response({
          items: [
            makeItem({ id: 'linked', code: 'LIN-1', name: 'Equip connectat', value: 500 }),
            makeItem({ id: 'missing', code: 'MIS-1', name: 'Equip sense cost', purchasePrice: null, expectedLifeHours: null, value: 250 }),
            makeItem({ id: 'unused', code: 'UNU-1', name: 'Equip sense ús', packItems: [], _count: { bookingItems: 0, usageHistory: 0 }, value: 450 }),
          ],
          stats: {},
        })
      );
    });

    render(<InventoryListClient />);

    expect(await screen.findByText('Completar cost i vida útil abans de llegir marge')).toBeInTheDocument();
    expect(screen.getByText('1 equips sense cost o vida útil completa.')).toBeInTheDocument();
    expect(screen.getByText('1 equips amb valor econòmic sense ús a packs ni reserves.')).toBeInTheDocument();
    expect(screen.getByText('2 equips ja estan connectats a almenys un pack.')).toBeInTheDocument();
    expect(screen.getByText('Obrir cost pendent').closest('a')).toHaveAttribute('href', '/admin/inventory?health=missing-cost');
  });
});
