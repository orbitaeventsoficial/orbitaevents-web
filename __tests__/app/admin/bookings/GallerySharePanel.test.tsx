import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockClipboardWriteText } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockClipboardWriteText: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn() },
}));

import GallerySharePanel from '@/app/admin/bookings/[id]/GallerySharePanel';

describe('GallerySharePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
  });

  it('mostra error visible si no pot carregar el link compartit', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'Gallery share bloquejat' }),
    });

    render(<GallerySharePanel bookingId="booking-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Gallery share bloquejat');
    expect(screen.getByRole('button', { name: 'Generar link' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('mostra error visible si no pot copiar el link', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'share-token', passwordProtected: false }),
    });
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(<GallerySharePanel bookingId="booking-2" />);

    await screen.findByText(/\/ca\/gallery\/share-token$/);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No s\'ha pogut copiar el link');
    expect(screen.getByRole('button', { name: 'Copiar' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Revocar' })).not.toHaveAttribute('aria-invalid');
    expect(mockClipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('/ca/gallery/share-token'));
  });

  it('marca nomes crear si falla generar el link compartit', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: null, passwordProtected: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'No es pot generar galeria' }),
      });

    render(<GallerySharePanel bookingId="booking-3" />);

    const toggleButton = await screen.findByRole('button', { name: 'Generar link' });
    fireEvent.click(toggleButton);

    const passwordInput = screen.getByLabelText('Contrasenya (opcional)');
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No es pot generar galeria');
    expect(screen.getByRole('button', { name: 'Crear' })).toHaveAttribute('aria-invalid', 'true');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    expect(toggleButton).not.toHaveAttribute('aria-invalid');
  });

  it('marca nomes revocar si falla eliminar el link compartit', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'share-token', passwordProtected: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, error: 'No es pot revocar galeria' }),
      });

    render(<GallerySharePanel bookingId="booking-4" />);

    await screen.findByText(/\/ca\/gallery\/share-token$/);
    fireEvent.click(screen.getByRole('button', { name: 'Revocar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No es pot revocar galeria');
    expect(screen.getByRole('button', { name: 'Revocar' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Copiar' })).not.toHaveAttribute('aria-invalid');
  });
});
