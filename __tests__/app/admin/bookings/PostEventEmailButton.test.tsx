import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockLogError } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/lib/logger', () => ({
  log: { error: (...args: unknown[]) => mockLogError(...args) },
}));

import PostEventEmailButton from '@/app/admin/bookings/[id]/PostEventEmailButton';

describe('PostEventEmailButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra alerta accessible si enviar email post-event falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'SMTP aturat' }),
    } as Response);

    render(<PostEventEmailButton bookingId="booking-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Envia post-event al client' }));

    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('email real al client');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar enviament' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('SMTP aturat');
    });

    expect(screen.getByRole('button', { name: 'Envia post-event al client' })).toHaveAttribute('aria-invalid', 'true');
    expect(mockLogError).toHaveBeenCalled();
  });

  it('queda bloquejat quan el post-event ja consta enviat', () => {
    render(<PostEventEmailButton bookingId="booking-1" initiallySent />);

    const button = screen.getByRole('button', { name: '✓ Enviat!' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockFetchWithCsrf).not.toHaveBeenCalled();
  });
});
