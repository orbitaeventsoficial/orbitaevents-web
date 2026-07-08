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

  it('envia billedCollaboratorId i línies de servei quan el partner contracta Òrbita', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: validForm(),
      selectedExtras: {},
      leadId: null,
      leadData: null,
      customerId: 'customer-1',
      internalTravelCost: 0,
      relationshipContext: {
        mode: 'PARTNER_HIRES_ORBITA',
        partnerId: 'partner-masquerade',
        partnerLabel: 'Masquerade Events',
        orbitaDjAmount: '300',
        orbitaTechAmount: '40',
      },
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.billedCollaboratorId).toBe('partner-masquerade');
    expect(body.customerId).toBe('customer-1');
    expect(body.notes).toBeUndefined();
    expect(body.serviceLines).toEqual([
      { kind: 'DJ', label: 'DJ Orbita', revenueAmount: 300, quantity: 1 },
      { kind: 'SOUND_TECH', label: 'Tecnic de so Orbita', revenueAmount: 40, quantity: 1 },
    ]);
  });

  it('envia cost de partner com a BookingServiceLine sense convertir-lo en notes', async () => {
    const form = { ...validForm(), notes: 'Observació humana' };
    const { result } = renderHook(() => useNewBookingSubmit({
      form,
      selectedExtras: {},
      leadId: null,
      leadData: null,
      customerId: null,
      internalTravelCost: 0,
      relationshipContext: {
        mode: 'ORBITA_HIRES_PARTNER',
        partnerId: 'partner-masquerade',
        partnerLabel: 'Masquerade Events',
        partnerRole: 'Animació',
        partnerCostAmount: '180',
      },
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.billedCollaboratorId).toBeUndefined();
    expect(body.notes).toBe('Observació humana');
    expect(body.serviceLines).toEqual([
      {
        collaboratorId: 'partner-masquerade',
        kind: 'PROVIDER_SERVICE',
        label: 'Animació',
        costAmount: 180,
        quantity: 1,
      },
    ]);
  });

  it('conserva hores/partyType i no envia travelHeadcount perquè és metadada local del formulari', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: validForm(),
      selectedExtras: {},
      leadId: null,
      leadData: null,
      customerId: null,
      internalTravelCost: 105,
      serviceLines: [
        {
          kind: 'PROVIDER_SERVICE',
          label: 'Bingo Musical',
          revenueAmount: 240,
          costAmount: 160,
          quantity: 1,
          hours: 1.5,
          partyType: 'infantil',
          travelHeadcount: 2,
        },
      ],
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.travelCost).toBe(105);
    expect(body.serviceLines).toEqual([
      {
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical',
        revenueAmount: 240,
        costAmount: 160,
        quantity: 1,
        hours: 1.5,
        partyType: 'infantil',
      },
    ]);
  });
});
