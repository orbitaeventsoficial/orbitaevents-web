import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCsrf } from '@/lib/csrf';
import { INITIAL_BOOKING_FORM } from '@/app/admin/bookings/booking-form.types';
import { useNewBookingSubmit } from '@/app/admin/bookings/useNewBookingSubmit';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const mockFetchWithCsrf = vi.mocked(fetchWithCsrf);

function validForm() {
  return {
    ...INITIAL_BOOKING_FORM,
    clientName: 'Laia Test',
    clientEmail: 'laia@example.com',
    clientPhone: '600000000',
    eventDate: '2026-06-20',
    eventLocation: 'Vic',
    packId: 'pack-premium',
  };
}

describe('useNewBookingSubmit', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockFetchWithCsrf.mockReset();
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, booking: { id: 'booking-1' } }),
    } as Response);
  });

  it('torna a la fitxa del lead quan la reserva neix des de Leads', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: validForm(),
      selectedExtras: {},
      leadId: 'lead-1',
      leadData: { customerId: null },
      customerId: null,
      internalTravelCost: 0,
    }));

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/leads/lead-1'));
  });

  it('obre la fitxa de reserva quan no hi ha lead d’origen', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: validForm(),
      selectedExtras: {},
      leadId: null,
      leadData: null,
      customerId: null,
      internalTravelCost: 0,
    }));

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/bookings/booking-1'));
  });
});
