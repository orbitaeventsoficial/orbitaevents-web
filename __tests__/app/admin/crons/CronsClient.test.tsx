import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toastApi } = vi.hoisted(() => ({
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({ useToast: () => toastApi }));

import CronsClient from '@/app/admin/crons/CronsClient';

describe('CronsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mostra un error persistent si falla la carrega inicial', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'DB down' }),
    }));

    render(<CronsClient />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('DB down'));
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(toastApi.error).toHaveBeenCalledWith('DB down');
  });
});
