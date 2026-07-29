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
vi.mock('@/app/admin/components/EditorControlStrip', () => ({
  EditorControlStrip: () => <section data-testid="editor-control-strip" />,
}));
vi.mock('@/app/admin/components/ConfirmDialog', () => ({
  default: () => null,
  useConfirmDialog: () => ({ confirm: vi.fn(), dialogProps: {} }),
}));

import StatsPage from '@/app/admin/stats/page';

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        stats: [
          {
            key: 'stats.events_completed',
            label: 'Esdeveniments realitzats',
            description: 'Total completat',
            icon: 'party',
            value: 20,
            fallback: 0,
            calculated: 20,
            isManual: false,
          },
          {
            key: 'stats.people_entertained',
            label: 'Persones entretingudes',
            description: 'Total convidats',
            icon: 'people',
            value: 2000,
            fallback: 2500,
            calculated: 2000,
            isManual: true,
          },
        ],
      }),
    });
  });

  it('renderitza icones reals en lloc de pintar les claus textuals', async () => {
    const { container } = render(<StatsPage />);

    await waitFor(() => expect(screen.getByText('Esdeveniments realitzats')).toBeInTheDocument());

    expect(screen.queryByText('party')).not.toBeInTheDocument();
    expect(screen.queryByText('people')).not.toBeInTheDocument();
    expect(container.querySelector('[data-stat-icon="party"] svg')).toBeInTheDocument();
    expect(container.querySelector('[data-stat-icon="people"] svg')).toBeInTheDocument();
  });
});
