import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCsrf } from '@/lib/csrf';
import ProtocolValidationToggle from '@/app/admin/docs/protocol/ProtocolValidationToggle';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const mockFetchWithCsrf = vi.mocked(fetchWithCsrf);

describe('ProtocolValidationToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderitza l’estat validat amb metadata i nota registrada', () => {
    render(
      <ProtocolValidationToggle
        canviN={466}
        validation={{
          canviN: 466,
          validatedAt: '2026-05-01T10:00:00.000Z',
          validatedBy: 'OWNER',
          notes: 'OK',
        }}
      />,
    );

    expect(screen.getByText(/validat per owner/i)).toBeInTheDocument();
    expect(screen.getByText('Nota registrada: OK')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desfer validació/i })).toBeInTheDocument();
  });

  it('marca una validació humana amb nota opcional', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, validation: { canviN: 467 } }), { status: 200 }),
    );

    render(<ProtocolValidationToggle canviN={467} validation={null} />);

    fireEvent.change(screen.getByPlaceholderText(/revisat en mòbil/i), {
      target: { value: 'CTA clar' },
    });
    fireEvent.click(screen.getByRole('button', { name: /marcar validació humana/i }));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/protocol/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canviN: 467, notes: 'CTA clar' }),
      });
    });
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('desfà una validació existent', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, removed: true }), { status: 200 }),
    );

    render(
      <ProtocolValidationToggle
        canviN={466}
        validation={{
          canviN: 466,
          validatedAt: '2026-05-01T10:00:00.000Z',
          validatedBy: 'OWNER',
          notes: 'OK',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /desfer validació/i }));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/protocol/validations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canviN: 466 }),
      });
    });
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('mostra error si la validació falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 }),
    );

    render(<ProtocolValidationToggle canviN={467} validation={null} />);

    fireEvent.click(screen.getByRole('button', { name: /marcar validació humana/i }));

    expect(await screen.findByText('forbidden')).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('mostra error si desfer la validació falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: 'cannot-delete' }), { status: 500 }),
    );

    render(
      <ProtocolValidationToggle
        canviN={466}
        validation={{
          canviN: 466,
          validatedAt: '2026-05-01T10:00:00.000Z',
          validatedBy: 'OWNER',
          notes: 'OK',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /desfer validació/i }));

    expect(await screen.findByText('cannot-delete')).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
