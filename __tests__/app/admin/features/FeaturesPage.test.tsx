import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: mockFetchWithCsrf }));
vi.mock('@/app/admin/components/ToastProvider', () => ({ useToast: () => toastApi }));
vi.mock('@/app/admin/components/AdminPage', () => ({
  AdminPage: ({ title, children }: { title: string; children: ReactNode }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
  AdminEmptyState: ({ title, action }: { title: string; action?: ReactNode }) => (
    <section role="alert">
      <h2>{title}</h2>
      {action}
    </section>
  ),
}));

import FeaturesPage from '@/app/admin/features/page';

describe('FeaturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        features: [
          {
            key: 'features.reviews_enabled',
            label: 'Ressenyes públiques',
            description: 'Mostrar ressenyes al web',
            icon: 'star',
            enabled: true,
          },
          {
            key: 'features.calendar_enabled',
            label: 'Calendari de disponibilitat',
            description: 'Mostrar calendari al web',
            icon: 'calendar',
            enabled: false,
          },
        ],
      }),
    });
  });

  it('renderitza icones reals en lloc de pintar les claus textuals', async () => {
    const { container } = render(<FeaturesPage />);

    await waitFor(() => expect(screen.getByText('Ressenyes públiques')).toBeInTheDocument());

    expect(screen.queryByText('star')).not.toBeInTheDocument();
    expect(screen.queryByText('calendar')).not.toBeInTheDocument();
    expect(container.querySelector('[data-feature-icon="star"] svg')).toBeInTheDocument();
    expect(container.querySelector('[data-feature-icon="calendar"] svg')).toBeInTheDocument();
  });
});
