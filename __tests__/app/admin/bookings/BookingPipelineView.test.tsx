import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchWithCsrf = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const mockUseSearchParams = vi.fn();
const toastApi = {
  success: toastSuccess,
  error: toastError,
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/lib/constants', () => ({
  BOOKING_PIPELINE_COLUMNS: [
    { status: 'PENDING', label: 'Pendents', toneClass: '', cardTone: 'pending-tone' },
    { status: 'CONFIRMED', label: 'Confirmades', toneClass: '', cardTone: 'confirmed-tone' },
    { status: 'PREPARING', label: 'Preparant', toneClass: '', cardTone: 'preparing-tone' },
    { status: 'COMPLETED', label: 'Completades', toneClass: '', cardTone: 'completed-tone' },
  ],
  BOOKING_STATUS_CONFIG: {
    PENDING: { text: 'pending-text' },
    CONFIRMED: { text: 'confirmed-text' },
    PREPARING: { text: 'preparing-text' },
    COMPLETED: { text: 'completed-text' },
  },
  formatDateShort: (date: string) => `DATE:${date}`,
  formatCurrency: (amount: number) => `${amount} EUR`,
}));

import BookingPipelineView from '@/app/admin/bookings/BookingPipelineView';

function makeBooking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'booking-1',
    reference: 'B-001',
    clientName: 'Maria Serra',
    customerId: 'customer-1',
    eventDate: '2026-09-20T00:00:00.000Z',
    eventType: 'WEDDING',
    total: 1200,
    depositAmount: 300,
    depositPaid: false,
    remainingAmount: 900,
    remainingPaid: false,
    cashAmount: null,
    status: 'PENDING',
    leadId: null,
    marginPct: 38,
    ...overrides,
  };
}

function mockJsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  };
}

describe('BookingPipelineView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const params = new URLSearchParams('payment=overdue&page=3&view=pipeline&status=CONFIRMED');
    mockUseSearchParams.mockReturnValue(params);
  });

  it('carrega el kanban amb els filtres actius i amaga les cancel·lades del tauler', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      mockJsonResponse({
        data: {
          bookings: [
            makeBooking(),
            makeBooking({ id: 'booking-2', reference: 'B-002', status: 'CONFIRMED', depositPaid: true }),
            makeBooking({ id: 'booking-3', reference: 'B-003', status: 'CANCELLED' }),
          ],
        },
      })
    );

    render(<BookingPipelineView />);

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));

    const [url, options] = mockFetchWithCsrf.mock.calls[0];
    expect(url).toBe('/api/admin/bookings?payment=overdue&status=CONFIRMED&limit=500&pipeline=true');
    expect(options).toEqual({ credentials: 'include' });

    expect(await screen.findByText('B-001')).toBeInTheDocument();
    expect(screen.getByText('B-002')).toBeInTheDocument();
    expect(screen.queryByText('B-003')).not.toBeInTheDocument();
    expect(screen.getByText('+ 1 cancel·lada (ocultes del kanban)')).toBeInTheDocument();
  });

  it('no mostra la pill de pagament pendent si cashAmount cobreix la bestreta', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      mockJsonResponse({
        data: {
          bookings: [
            makeBooking({ cashAmount: 300, depositPaid: false, remainingPaid: false }),
          ],
        },
      })
    );

    render(<BookingPipelineView />);

    expect(await screen.findByText('B-001')).toBeInTheDocument();
    expect(screen.queryByText('Paga pendent')).not.toBeInTheDocument();
  });

  it('manté la pill si queda bestreta pendent real', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce(
      mockJsonResponse({
        data: {
          bookings: [
            makeBooking({ cashAmount: 100, depositPaid: false, remainingPaid: false }),
          ],
        },
      })
    );

    render(<BookingPipelineView />);

    expect(await screen.findByText('B-001')).toBeInTheDocument();
    expect(screen.getByText('Paga pendent')).toBeInTheDocument();
  });

  it('preserva customerId quan el kanban s’obre des del Customer Hub', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('customerId=customer-1&view=kanban&page=2'));
    mockFetchWithCsrf.mockResolvedValueOnce(mockJsonResponse({ data: { bookings: [] } }));

    render(<BookingPipelineView />);

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url] = mockFetchWithCsrf.mock.calls[0];
    expect(url).toBe('/api/admin/bookings?customerId=customer-1&limit=500&pipeline=true');
  });

  it('mou una reserva endavant i mostra toast d’èxit quan el PATCH respon OK', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce(mockJsonResponse({ data: { bookings: [makeBooking()] } }))
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }));

    render(<BookingPipelineView />);

    expect(await screen.findByText('B-001')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Moure a Confirmades'));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenNthCalledWith(
        2,
        '/api/admin/bookings/booking-1/status',
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        })
      );
    });

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Reserva moguda a Confirmades'));
    expect(screen.getByTitle('Moure a Pendents')).toBeInTheDocument();
  });

  it('reverteix el canvi i mostra toast d’error quan el PATCH falla', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce(mockJsonResponse({ data: { bookings: [makeBooking()] } }))
      .mockResolvedValueOnce(mockJsonResponse({ error: 'boom' }, false));

    render(<BookingPipelineView />);

    expect(await screen.findByText('B-001')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Moure a Confirmades'));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Error canviant l'estat"));
    expect(screen.queryByTitle('Moure a Pendents')).not.toBeInTheDocument();
    expect(screen.getByTitle('Moure a Confirmades')).toBeInTheDocument();
  });
});
