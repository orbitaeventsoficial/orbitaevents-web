import type { ReactNode } from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SummaryPanel from '@/app/admin/clientes/[id]/_components/panels/SummaryPanel';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { getEventLabel } from '@/lib/constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

import { fetchWithCsrf } from '@/lib/csrf';

const mockFetchWithCsrf = vi.mocked(fetchWithCsrf);

beforeEach(() => {
  mockFetchWithCsrf.mockReset();
});

const HUB: CustomerHubDTO = {
  customer: {
    id: 'cust-1',
    name: 'Anna',
    email: 'anna@example.com',
    phone: '+34 600 112 233',
    status: 'NEGOTIATION',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  kpis: {},
  active: { source: 'NONE' },
  proposals: [],
  bookings: [],
  tasks: [],
  messages: [],
  commSummary: {
    total: 0,
    channels: { EMAIL: 0, WHATSAPP: 0, INSTAGRAM: 0, FORM: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
    lastContactAt: null,
    lastContactChannel: null,
    lastContactDirection: null,
    pendingResponseFrom: 'NONE',
    daysSinceLastContact: null,
    responseGap: null,
  },
  timeline: [],
  discountCodes: [],
  leads: [
    {
      id: 'lead-1',
      name: 'Lead fred',
      email: 'fred@example.com',
      phone: null,
      eventType: 'BODA',
      status: 'QUOTE_SENT',
      priority: 'LOW',
      createdAt: '2026-04-10T10:00:00.000Z',
      commercialBlocker: {
        label: 'Pressupost pendent',
        context: 'Cal desencallar si la proposta s\'ha revisat',
        tone: 'WARNING',
      },
    },
    {
      id: 'lead-2',
      name: 'Lead calenta',
      email: 'calenta@example.com',
      phone: '+34 600 112 233',
      eventType: 'BODA',
      status: 'NEW',
      priority: 'HIGH',
      createdAt: '2026-04-11T10:00:00.000Z',
      commercialBlocker: {
        label: 'Seguiment urgent',
        context: '6d sense resposta',
        tone: 'DANGER',
      },
    },
  ],
  contacts: [],
  insights: {
    nextAction: { type: 'NONE', label: 'Cap', urgency: 'LOW' },
    commercialRisk: { level: 'NONE', label: 'Sense risc comercial actiu' },
    relationalHealth: 'GOOD',
    ltv: 0,
    recurrence: 0,
    completedEvents: 0,
    daysSinceLastContact: null,
    daysSinceLastEvent: null,
    daysUntilNextEvent: null,
    openTasksCount: 0,
    pendingPaymentTotal: 0,
  },
  reactivation: null,
};

describe('SummaryPanel', () => {
  it('mostra ubicació i distància guardada de la reserva al resum del client', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 10);
    const routedHub: CustomerHubDTO = {
      ...HUB,
      bookings: [
        {
          id: 'booking-map-1',
          reference: 'ORB-2026-050',
          status: 'CONFIRMED',
          date: soonDate.toISOString(),
          startTime: '19:00',
          location: 'Girona',
          venue: 'Masia Can Riera',
          distanceKm: 86.4,
        },
      ],
    };

    render(<SummaryPanel data={routedHub} />);

    expect(screen.getByText('Ubicació i ruta')).toBeInTheDocument();
    expect(screen.getByText('Masia Can Riera')).toBeInTheDocument();
    expect(screen.getAllByText('Girona').length).toBeGreaterThan(0);
    expect(screen.getByText('🚗 86,4 km A/T')).toBeInTheDocument();
    expect(screen.getByText('Distància guardada a la reserva')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir a Google Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Masia%20Can%20Riera%2C%20Girona'
    );
  });

  it('calcula la ruta viva via Google Maps si la reserva encara no té km guardats', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        oneWayKm: 43.2,
        roundTripKm: 86.4,
        durationText: '48 min',
        originResolved: 'Granollers, Barcelona',
        destinationResolved: 'Masia Can Riera, Girona',
      }),
    } as Response);

    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 12);
    const routedHub: CustomerHubDTO = {
      ...HUB,
      bookings: [
        {
          id: 'booking-map-2',
          reference: 'ORB-2026-051',
          status: 'CONFIRMED',
          date: soonDate.toISOString(),
          location: 'Girona',
          venue: 'Masia Can Riera',
        },
      ],
    };

    render(<SummaryPanel data={routedHub} />);

    await waitFor(() => {
      expect(screen.getByText('🚗 86,4 km A/T')).toBeInTheDocument();
    });

    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/maps/distance', expect.objectContaining({
      method: 'POST',
    }));
    expect(screen.getByText('Distància viva via Google Maps')).toBeInTheDocument();
    expect(screen.getByText('43,2 km anada')).toBeInTheDocument();
    expect(screen.getByText('⏱️ 48 min')).toBeInTheDocument();
    expect(screen.getByText('Base Òrbita: Granollers, Barcelona')).toBeInTheDocument();
  });

  it('mostra l’oportunitat comercial principal i la seva CTA', () => {
    render(<SummaryPanel data={HUB} />);

    expect(screen.getByText('Oportunitat comercial')).toBeInTheDocument();
    expect(screen.getByText('Lead calenta')).toBeInTheDocument();
    expect(screen.getByText('Seguiment urgent · 6d sense resposta')).toBeInTheDocument();
    expect(screen.getByText('Nou')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText(getEventLabel('BODA'))).toBeInTheDocument();
    expect(screen.getByText(/Lead oberta/)).toBeInTheDocument();
    expect(screen.getByText('Conversió: sense reserva vinculada')).toBeInTheDocument();
    expect(screen.getByText('Canal suggerit: WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Prioritat del pas: Alta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anar a Comunicacions' })).toHaveAttribute(
      'href',
      '/admin/clientes/cust-1?tab=comms'
    );
    expect(screen.getAllByText('Desencallar per WhatsApp').length).toBeGreaterThan(0);
  });

  it('no duplica quick actions si la lead prioritària i el risc comercial apunten al mateix pas', () => {
    const duplicatedHub: CustomerHubDTO = {
      ...HUB,
      insights: {
        ...HUB.insights,
        commercialRisk: {
          level: 'HIGH',
          label: 'Risc comercial alt',
          context: '1 seguiment urgent sense resposta',
        },
      },
      followUpSummary: {
        total: 1,
        urgent: 1,
        normal: 0,
        low: 0,
        topItem: {
          leadId: 'lead-2',
          name: 'Lead calenta',
          phone: '+34 600 112 233',
          urgency: 'URGENT',
          daysSinceOutbound: 6,
          suggestedAction: 'Trucar o enviar WhatsApp',
        },
      },
    };

    render(<SummaryPanel data={duplicatedHub} />);

    const quickActionsCard = screen.getByTestId('customer-summary-quick-actions');
    expect(within(quickActionsCard).getAllByText('Desencallar per WhatsApp')).toHaveLength(1);
  });

  it('mostra accés directe a la reserva quan la lead prioritària ja està convertida', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 7);
    const convertedHub: CustomerHubDTO = {
      ...HUB,
      leads: [
        {
          ...HUB.leads[0],
          id: 'lead-booked',
          name: 'Lead convertida',
          priority: 'URGENT',
          status: 'WON',
          booking: {
            id: 'booking-1',
            reference: 'ORB-2026-001',
            status: 'CONFIRMED',
            total: 1200,
            depositAmount: 300,
            remainingAmount: 900,
            discountCode: 'FLASH15',
            eventType: 'BODA',
            date: soonDate.toISOString(),
            startTime: '18:00',
            endTime: '02:00',
            location: 'Masia Can Ribas',
            venue: 'Sala Gran',
            distanceKm: 62,
            guestCount: 120,
            depositPaid: true,
            remainingPaid: false,
          },
          commercialBlocker: {
            label: 'Passar a reserva',
            context: 'Lead guanyada sense reserva vinculada',
            tone: 'WARNING',
          },
        },
      ],
    };

    render(<SummaryPanel data={convertedHub} />);

    expect(screen.getByText('Conversió: reserva vinculada (ORB-2026-001)')).toBeInTheDocument();
    expect(screen.getByText('Estat de la reserva: Confirmada')).toBeInTheDocument();
    expect(screen.getByText(/Data de la reserva:/)).toBeInTheDocument();
    expect(screen.getByText(/Dies fins a la reserva:/)).toBeInTheDocument();
    expect(screen.getByText('Ubicació: Masia Can Ribas')).toBeInTheDocument();
    expect(screen.getByText('Recinte: Sala Gran')).toBeInTheDocument();
    expect(screen.getByText(/Bestreta prevista:/)).toBeInTheDocument();
    expect(screen.getByText(/Pendent de cobrament:/)).toBeInTheDocument();
    expect(screen.getByText('Estat econòmic: cobrament parcial')).toBeInTheDocument();
    expect(screen.getByText(/Risc temporal:/)).toBeInTheDocument();
    expect(screen.getByText('Descompte aplicat: FLASH15')).toBeInTheDocument();
    expect(screen.getByText(`Tipus de reserva: ${getEventLabel('BODA')}`)).toBeInTheDocument();
    expect(screen.getByText('Horari: 18:00 - 02:00')).toBeInTheDocument();
    expect(screen.getByText('Aforament previst: 120 convidats')).toBeInTheDocument();
    expect(screen.getByText(/Valor de la reserva:/)).toBeInTheDocument();
    expect(screen.getByText('Cobrament: Bestreta cobrada')).toBeInTheDocument();
    expect(screen.getByText('Canal suggerit: Fitxa reserva')).toBeInTheDocument();
    expect(screen.getAllByText('Obrir reserva').length).toBeGreaterThan(0);
    expect(screen.getByText('Obrir reserva vinculada')).toBeInTheDocument();
  });

  it('mostra reactivació assistida sense convertir-la en enviament automàtic', () => {
    const reactivationHub: CustomerHubDTO = {
      ...HUB,
      leads: [],
  contacts: [],
      reactivation: {
        reasonLabel: 'VIP dormant',
        priority: 'ALTA',
        score: 95,
        suggestedChannels: ['whatsapp', 'email'],
        suggestedSubject: 'Et trobem a faltar 💜',
        suggestedMessage: 'Hola Anna',
        whatsappUrl: 'https://wa.me/34600112233?text=Hola%20Anna',
        mailtoUrl: 'mailto:anna@example.com?subject=Et%20trobem',
        daysSinceLastEvent: 220,
        daysSinceLastContact: 95,
      },
    };

    render(<SummaryPanel data={reactivationHub} />);

    expect(screen.getByText('Reactivació suggerida')).toBeInTheDocument();
    expect(screen.getByText('VIP dormant · Prioritat alta')).toBeInTheDocument();
    expect(screen.getByText(/Últim event fa 220 dies/)).toBeInTheDocument();
    expect(screen.getByText('Canal suggerit: whatsapp · email')).toBeInTheDocument();
    expect(screen.getByText(/mode assistit/)).toBeInTheDocument();
    expect(screen.getAllByText('Preparar reactivació').length).toBeGreaterThan(0);
    expect(screen.getByText('Obrir esborrany')).toBeInTheDocument();
    const taskLinks = screen.getAllByText('Crear tasca');
    expect(taskLinks.length).toBeGreaterThan(0);
    const taskHref = taskLinks[0].closest('a')?.getAttribute('href') || '';
    expect(taskHref).toContain('/admin/tasks/new?');
    expect(taskHref).toContain('source=reactivation');
    expect(taskHref).toContain('customerId=cust-1');
    expect(taskHref).toContain('taskSource=REACTIVATION');
    expect(taskHref).toContain('dedupeKey=reactivation%3Acust-1');
  });
});
