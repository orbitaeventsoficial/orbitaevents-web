import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: mockFetchWithCsrf }));
vi.mock('@/app/admin/components/AdminPage', () => ({
  AdminPage: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/app/admin/components/EditorControlStrip', () => ({
  EditorControlStrip: () => <div data-testid="editor-control-strip" />,
}));

import AdminCssManagerPage from '@/app/admin/css-manager/page';

describe('AdminCssManagerPage load error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'DB down' }),
    });
  });

  it('mostra un alert persistent quan falla la carrega inicial', async () => {
    render(<AdminCssManagerPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('DB down'));
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
