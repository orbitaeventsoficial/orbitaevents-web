import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LeadQuickStatus from '@/app/admin/leads/LeadQuickStatus';

const mockRefresh = vi.fn();
const mockFetchWithCsrf = vi.fn();
const toastError = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: toastError,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('LeadQuickStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manté el flux simple per canvis d’estat normals', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, lead: { id: 'lead-1', status: 'CONTACTED' } }),
    });

    render(<LeadQuickStatus leadId="lead-1" currentStatus="NEW" />);

    fireEvent.change(screen.getByLabelText('Canviar estat'), {
      target: { value: 'CONTACTED' },
    });

    await waitFor(() =>
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/api/admin/leads/lead-1/status',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONTACTED' }),
        })
      )
    );
    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.queryByText('Motiu canònic')).not.toBeInTheDocument();
  });

  it("mostra el missatge d'error real de l'API al toast en lloc d'un text genèric", async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'Lead orfe — customer eliminat' }),
    });

    render(<LeadQuickStatus leadId="lead-1" currentStatus="NEW" />);

    fireEvent.change(screen.getByLabelText('Canviar estat'), {
      target: { value: 'CONTACTED' },
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith('Lead orfe — customer eliminat');
  });

  it('demana motiu i nota abans de marcar el lead com a perdut', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ok: true,
        lead: { id: 'lead-1', status: 'LOST', lostReason: 'PRICE_TOO_HIGH', lostAt: new Date().toISOString() },
      }),
    });

    render(<LeadQuickStatus leadId="lead-1" currentStatus="CONTACTED" />);

    fireEvent.change(screen.getByLabelText('Canviar estat'), {
      target: { value: 'LOST' },
    });

    expect(screen.getByText('Per marcar aquest lead com a perdut cal classificar-ne el motiu.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Motiu canònic'), {
      target: { value: 'PRICE_TOO_HIGH' },
    });
    fireEvent.change(screen.getByLabelText('Nota interna (opcional)'), {
      target: { value: 'Pressupost per sobre del topall del client' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar perdut' }));

    await waitFor(() =>
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/api/admin/leads/lead-1/status',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'LOST',
            lostReason: 'PRICE_TOO_HIGH',
            note: 'Pressupost per sobre del topall del client',
          }),
        })
      )
    );
    expect(mockRefresh).toHaveBeenCalled();
  });
});
