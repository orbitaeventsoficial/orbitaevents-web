import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

import InvoiceSection from '@/app/admin/bookings/[id]/InvoiceSection';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('InvoiceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('mostra el context client/lead encara que la factura no estigui creada', () => {
    render(
      <InvoiceSection
        bookingId="booking-1"
        customerHref="/admin/clientes/customer-1"
        leadHref="/admin/leads/lead-1"
        invoices={[]}
      />,
    );

    expect(screen.getByText('Context de la factura')).toBeInTheDocument();
    expect(screen.getByText(/reserva actual/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Client 360' })).toHaveAttribute('href', '/admin/clientes/customer-1');
    expect(screen.getByRole('link', { name: 'Lead origen' })).toHaveAttribute('href', '/admin/leads/lead-1');
  });

  it('mostra alerta accessible si crear factura falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Holded sense credencials' }),
    } as Response);

    render(<InvoiceSection bookingId="booking-1" invoices={[]} />);

    const button = screen.getByRole('button', { name: /Crear factura/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Holded sense credencials');
    });

    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: 'booking-1' }),
    });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('marca nomes reintentar sync si la sincronitzacio falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Holded continua caigut' }),
    } as Response);

    render(
      <InvoiceSection
        bookingId="booking-1"
        invoices={[
          {
            id: 'invoice-1',
            reference: 'F-001',
            status: 'SYNC_ERROR',
            total: 300,
            holdedSyncError: 'Error previ de Holded',
            createdAt: '2026-07-07T08:00:00.000Z',
          },
        ]}
      />,
    );

    const retryButton = screen.getByRole('button', { name: /Reintentar sync/ });
    const paidButton = screen.getByRole('button', { name: /Marcar pagada/ });
    const cancelButton = screen.getByRole('button', { name: /Cancel·lar/ });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Holded continua caigut')).toBeInTheDocument();
    });

    expect(retryButton).toHaveAttribute('aria-invalid', 'true');
    expect(paidButton).not.toHaveAttribute('aria-invalid');
    expect(cancelButton).not.toHaveAttribute('aria-invalid');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('marca nomes marcar pagada si confirmar el cobrament falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'No es pot marcar pagada' }),
    } as Response);

    render(
      <InvoiceSection
        bookingId="booking-1"
        invoices={[
          {
            id: 'invoice-2',
            reference: 'F-002',
            status: 'DRAFT',
            total: 500,
            createdAt: '2026-07-07T08:00:00.000Z',
          },
        ]}
      />,
    );

    const paidButton = screen.getByRole('button', { name: /Marcar pagada/ });
    const cancelButton = screen.getByRole('button', { name: /Cancel·lar/ });
    fireEvent.click(paidButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No es pot marcar pagada');
    });

    expect(paidButton).toHaveAttribute('aria-invalid', 'true');
    expect(cancelButton).not.toHaveAttribute('aria-invalid');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
