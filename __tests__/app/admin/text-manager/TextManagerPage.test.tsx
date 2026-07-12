import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: mockFetchWithCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import TextManagerPage from '@/app/admin/text-manager/page';

describe('TextManagerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra un alert persistent si falla la carrega inicial', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'DB down' }),
    });

    render(<TextManagerPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('DB down'));
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
