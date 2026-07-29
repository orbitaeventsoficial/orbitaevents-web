import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCsrf } from '@/lib/csrf';
import { INITIAL_BOOKING_FORM } from '@/app/admin/bookings/booking-form.types';
import { useNewBookingSubmit } from '@/app/admin/bookings/useNewBookingSubmit';
import { mapLeadServiceLinesToBookingFormLines } from '@/app/admin/bookings/bookingLeadServiceLineMapper';
import { TRAVEL_HEADCOUNT_NOTE_PREFIX } from '@/lib/services/travelLaborCost';

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

  it('envia proposalId quan la reserva neix des d’un pressupost', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: validForm(),
      selectedExtras: {},
      proposalId: 'proposal-1',
      leadId: null,
      leadData: null,
      customerId: 'customer-1',
      internalTravelCost: 0,
      manualTotalPrice: 834,
      invoiceRequired: true,
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual(expect.objectContaining({
      proposalId: 'proposal-1',
      customerId: 'customer-1',
      manualTotalPrice: 834,
      invoiceRequired: true,
    }));
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
        notes: `${TRAVEL_HEADCOUNT_NOTE_PREFIX}2]`,
      },
    ]);
    expect(body.serviceLines[0]).not.toHaveProperty('travelHeadcount');
  });

  it('afegeix assistent de Bingo Musical quan el formulari té 70 pax o més', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: { ...validForm(), packId: '', guestCount: '70' },
      selectedExtras: {},
      leadId: null,
      leadData: null,
      customerId: null,
      internalTravelCost: 0,
      serviceLines: [
        {
          collaboratorId: 'masquerade',
          kind: 'PROVIDER_SERVICE',
          label: 'Bingo Musical (Masquerade)',
          revenueAmount: 240,
          costAmount: 200,
          quantity: 1,
          travelHeadcount: 1,
        },
      ],
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.serviceLines).toEqual([
      {
        collaboratorId: 'masquerade',
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical (Masquerade)',
        revenueAmount: 240,
        costAmount: 200,
        quantity: 1,
        notes: `${TRAVEL_HEADCOUNT_NOTE_PREFIX}1]`,
      },
      expect.objectContaining({
        kind: 'OTHER',
        label: 'Assistent Bingo Musical (+70 pax)',
        revenueAmount: 0,
        quantity: 1,
      }),
    ]);
    expect(body.serviceLines[1]).not.toHaveProperty('travelHeadcount');
  });

  it('afegeix les línies ocultes de ruta al payload sense fer-les visibles al formulari', async () => {
    const { result } = renderHook(() => useNewBookingSubmit({
      form: validForm(),
      selectedExtras: {},
      leadId: 'lead-1',
      leadData: null,
      customerId: null,
      internalTravelCost: 298,
      serviceLines: [
        {
          kind: 'PROVIDER_SERVICE',
          label: 'Bingo Musical',
          revenueAmount: 240,
          costAmount: 200,
          quantity: 1,
          travelHeadcount: 1,
        },
      ],
      routeCostLines: [
        {
          kind: 'OTHER',
          label: 'Temps ruta passatger · Masquerade Events',
          revenueAmount: 0,
          costAmount: 82.5,
          quantity: 1,
          collaboratorId: 'masquerade',
          notes: '[travel-cost] PASSENGER · 5.50 h · 15 EUR/h',
          travelHeadcount: 1,
        },
      ],
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.serviceLines).toEqual([
      {
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical',
        revenueAmount: 240,
        costAmount: 200,
        quantity: 1,
        notes: `${TRAVEL_HEADCOUNT_NOTE_PREFIX}1]`,
      },
      {
        kind: 'OTHER',
        label: 'Temps ruta passatger · Masquerade Events',
        revenueAmount: 0,
        costAmount: 82.5,
        quantity: 1,
        collaboratorId: 'masquerade',
        notes: '[travel-cost] PASSENGER · 5.50 h · 15 EUR/h',
      },
    ]);
  });

  it('blinda el salt lead→dossier→reserva amb serveis, ruta oculta, km, peatges i Bingo +70', async () => {
    const leadServiceLines = mapLeadServiceLinesToBookingFormLines([
      {
        collaboratorId: 'masquerade',
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical',
        revenueAmount: 490,
        costAmount: 275,
        quantity: 1,
        hours: 1,
        partyType: 'adult',
        notes: 'Servei validat al dossier',
      },
      {
        kind: 'SOUND_TECH',
        label: 'Tècnic de so inclòs',
        revenueAmount: 0,
        costAmount: -40,
        quantity: 1,
        notes: 'Assignat a Òrbita',
      },
    ]);
    const leadRouteCostLines = mapLeadServiceLinesToBookingFormLines([
      {
        collaboratorId: 'masquerade',
        kind: 'OTHER',
        label: 'Temps ruta passatger · Masquerade Events',
        revenueAmount: 0,
        costAmount: 82.5,
        quantity: 1,
        notes: '[travel-cost] PASSENGER · 5.50 h · 15 EUR/h',
      },
    ]);

    const { result } = renderHook(() => useNewBookingSubmit({
      form: {
        ...validForm(),
        packId: '',
        guestCount: '70',
        distanceKm: '411.4',
        tollsEur: '29',
      },
      selectedExtras: {},
      leadId: 'lead-zenit',
      leadData: { customerId: 'customer-zenit' },
      customerId: null,
      internalTravelCost: 344,
      serviceLines: leadServiceLines,
      routeCostLines: leadRouteCostLines,
    }));

    await act(async () => {
      await result.current.submit();
    });

    const [, init] = mockFetchWithCsrf.mock.calls[0];
    const body = JSON.parse(String(init?.body));

    expect(body).toEqual(expect.objectContaining({
      leadId: 'lead-zenit',
      customerId: 'customer-zenit',
      distanceKm: 411.4,
      tollsEur: 29,
      travelCost: 344,
    }));
    expect(body.serviceLines).toEqual([
      {
        collaboratorId: 'masquerade',
        kind: 'PROVIDER_SERVICE',
        label: 'Bingo Musical',
        revenueAmount: 490,
        costAmount: 275,
        quantity: 1,
        hours: 1,
        partyType: 'adult',
        notes: 'Servei validat al dossier',
      },
      {
        kind: 'SOUND_TECH',
        label: 'Tècnic de so inclòs',
        revenueAmount: 0,
        costAmount: -40,
        quantity: 1,
        notes: 'Assignat a Òrbita',
      },
      expect.objectContaining({
        kind: 'OTHER',
        label: 'Assistent Bingo Musical (+70 pax)',
        revenueAmount: 0,
        quantity: 1,
      }),
      {
        collaboratorId: 'masquerade',
        kind: 'OTHER',
        label: 'Temps ruta passatger · Masquerade Events',
        revenueAmount: 0,
        costAmount: 82.5,
        quantity: 1,
        notes: '[travel-cost] PASSENGER · 5.50 h · 15 EUR/h',
      },
    ]);
    expect(body.serviceLines.filter((line: { label?: string }) => line.label === 'Assistent Bingo Musical (+70 pax)')).toHaveLength(1);
    expect(body.serviceLines.every((line: Record<string, unknown>) => !('travelHeadcount' in line))).toBe(true);
    expect(pushMock).toHaveBeenCalledWith('/admin/leads/lead-zenit');
  });
});
