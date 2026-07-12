import { describe, expect, it } from 'vitest';

import {
  buildCustomerActivityTimelineEvents,
  buildCustomerBusinessTimelineEvents,
} from '@/lib/customer-hub/timeline';

// buildTimeline ja no és un export públic (funció òrfena eliminada, #1936); aquest helper
// de test reprodueix la mateixa fusió per conservar la cobertura de les dues funcions vives.
function buildTimeline(input: Parameters<typeof buildCustomerBusinessTimelineEvents>[0] & Parameters<typeof buildCustomerActivityTimelineEvents>[0]) {
  const events = [
    ...buildCustomerBusinessTimelineEvents(input),
    ...buildCustomerActivityTimelineEvents(input),
  ];
  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  return events.slice(0, 250);
}

describe('buildTimeline', () => {
  it('preserva metadata útil de comunicació per a la timeline del customer hub', () => {
    const events = buildTimeline({
      proposals: [],
      bookings: [],
      tasks: [],
      messages: [
        {
          id: 'msg-1',
          channel: 'EMAIL',
          direction: 'INBOUND',
          subject: 'Resposta client',
          bodyPreview: 'El client demana disponibilitat per dissabte.',
          createdAt: '2026-04-16T10:00:00.000Z',
          sentAt: '2026-04-16T10:00:00.000Z',
          leadId: 'lead-1',
        },
      ],
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'EMAIL_RECEIVED',
      title: 'Email rebut: Resposta client',
      meta: {
        channel: 'EMAIL',
        direction: 'INBOUND',
        preview: 'El client demana disponibilitat per dissabte.',
      },
      link: {
        label: 'Veure entrada',
        href: '/admin/leads/lead-1',
      },
    });
  });

  it('pot consumir events canònics preservant el preview a la timeline', () => {
    const events = buildCustomerActivityTimelineEvents({
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
      canonicalEvents: [
        {
          id: 'la:msg-1',
          source: 'leadActivity',
          entityType: 'lead',
          entityId: 'lead-1',
          kind: 'message',
          title: 'Resposta client',
          body: 'El client demana disponibilitat per dissabte.',
          occurredAt: '2026-04-16T10:00:00.000Z',
          metadata: { channel: 'EMAIL', direction: 'INBOUND' },
          timelineType: 'EMAIL_RECEIVED',
          link: { label: 'Veure entrada', href: '/admin/leads/lead-1' },
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'EMAIL_RECEIVED',
      title: 'Resposta client',
      meta: {
        channel: 'EMAIL',
        direction: 'INBOUND',
        preview: 'El client demana disponibilitat per dissabte.',
      },
      link: {
        label: 'Veure entrada',
        href: '/admin/leads/lead-1',
      },
    });
  });

  it('separa els events de negoci dels d’activitat i després els combina ordenats', () => {
    const business = buildCustomerBusinessTimelineEvents({
      proposals: [{
        id: 'prop-1',
        reference: 'P-001',
        customerId: 'cust-1',
        leadId: 'lead-1',
        bookingId: 'booking-1',
        status: 'SENT',
        total: 1000,
        createdAt: '2026-04-10T10:00:00.000Z',
        sentAt: '2026-04-11T10:00:00.000Z',
      }],
      bookings: [],
      tasks: [],
      messages: [],
    });

    expect(business.map((event) => event.type)).toEqual(['PROPOSAL_CREATED', 'PROPOSAL_SENT']);
    expect(business[1]).toMatchObject({
      link: {
        label: 'Obrir pressupost',
        href: '/admin/presupuestos?proposalId=prop-1',
      },
      originLinks: [
        { label: 'Client origen', href: '/admin/clientes/cust-1' },
        { label: 'Entrada origen', href: '/admin/leads/lead-1' },
        { label: 'Reserva origen', href: '/admin/bookings/booking-1' },
      ],
    });

    const combined = buildTimeline({
      proposals: [],
      bookings: [],
      tasks: [],
      messages: [],
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
      canonicalEvents: [
        {
          id: 'la:msg-1',
          source: 'leadActivity',
          entityType: 'lead',
          entityId: 'lead-1',
          kind: 'message',
          title: 'Resposta client',
          body: 'El client demana disponibilitat per dissabte.',
          occurredAt: '2026-04-16T10:00:00.000Z',
          metadata: { channel: 'EMAIL', direction: 'INBOUND' },
          timelineType: 'EMAIL_RECEIVED',
          link: { label: 'Veure entrada', href: '/admin/leads/lead-1' },
        },
      ],
    });

    expect(combined).toHaveLength(1);
    expect(combined[0]).toMatchObject({
      type: 'EMAIL_RECEIVED',
      title: 'Resposta client',
      meta: {
        channel: 'EMAIL',
        direction: 'INBOUND',
        preview: 'El client demana disponibilitat per dissabte.',
      },
      link: {
        label: 'Veure entrada',
        href: '/admin/leads/lead-1',
      },
    });
  });

  it('projecta contracte signat com event de negoci amb link al PDF', () => {
    const events = buildCustomerBusinessTimelineEvents({
      proposals: [{
        id: 'prop-1',
        reference: 'P-001',
        customerId: 'cust-1',
        leadId: 'lead-1',
        bookingId: 'booking-1',
        status: 'ACCEPTED',
        total: 1000,
        createdAt: '2026-04-10T10:00:00.000Z',
        acceptedAt: '2026-04-11T10:00:00.000Z',
        contractReference: 'CTR-2026-001',
        contractStatus: 'SIGNED',
        contractPdfUrl: 'https://cdn.test/contracte.pdf',
        contractSignedAt: '2026-04-12T10:00:00.000Z',
      }],
      bookings: [],
      tasks: [],
      messages: [],
    });

    expect(events.find((event) => event.id === 'proposal:prop-1:contract-signed')).toMatchObject({
      type: 'ACTIVITY',
      title: 'Contracte signat (CTR-2026-001)',
      link: {
        label: 'Obrir PDF signat',
        href: 'https://cdn.test/contracte.pdf',
      },
      meta: {
        documentType: 'CONTRACT',
        contractReference: 'CTR-2026-001',
      },
      originLinks: [
        { label: 'Client origen', href: '/admin/clientes/cust-1' },
        { label: 'Entrada origen', href: '/admin/leads/lead-1' },
        { label: 'Reserva origen', href: '/admin/bookings/booking-1' },
      ],
    });
  });

  it('projecta contracte enviat amb PDF quan encara no esta signat', () => {
    const events = buildCustomerBusinessTimelineEvents({
      proposals: [
        {
          id: 'prop-sent',
          reference: 'P-001',
          customerId: 'cust-1',
          leadId: 'lead-1',
          bookingId: 'booking-1',
          status: 'ACCEPTED',
          total: 1000,
          createdAt: '2026-04-10T10:00:00.000Z',
          acceptedAt: '2026-04-11T10:00:00.000Z',
          contractReference: 'CTR-2026-001',
          contractStatus: 'SENT',
          contractPdfUrl: 'https://cdn.test/contracte-enviat.pdf',
          contractSentAt: '2026-04-12T10:00:00.000Z',
        },
        {
          id: 'prop-no-pdf',
          reference: 'P-002',
          customerId: 'cust-1',
          status: 'ACCEPTED',
          total: 1000,
          createdAt: '2026-04-10T10:00:00.000Z',
          contractReference: 'CTR-2026-002',
          contractStatus: 'SENT',
          contractPdfUrl: null,
          contractSentAt: '2026-04-12T11:00:00.000Z',
        },
        {
          id: 'prop-cancelled',
          reference: 'P-003',
          customerId: 'cust-1',
          status: 'ACCEPTED',
          total: 1000,
          createdAt: '2026-04-10T10:00:00.000Z',
          contractReference: 'CTR-2026-003',
          contractStatus: 'CANCELLED',
          contractPdfUrl: 'https://cdn.test/contracte-cancelled.pdf',
          contractSentAt: '2026-04-12T12:00:00.000Z',
        },
        {
          id: 'prop-signed',
          reference: 'P-004',
          customerId: 'cust-1',
          status: 'ACCEPTED',
          total: 1000,
          createdAt: '2026-04-10T10:00:00.000Z',
          contractReference: 'CTR-2026-004',
          contractStatus: 'SIGNED',
          contractPdfUrl: 'https://cdn.test/contracte-signed.pdf',
          contractSentAt: '2026-04-12T13:00:00.000Z',
          contractSignedAt: '2026-04-12T14:00:00.000Z',
        },
      ],
      bookings: [],
      tasks: [],
      messages: [],
    });

    expect(events.find((event) => event.id === 'proposal:prop-sent:contract-sent')).toMatchObject({
      type: 'ACTIVITY',
      at: '2026-04-12T10:00:00.000Z',
      title: 'Contracte enviat (CTR-2026-001)',
      link: {
        label: 'Obrir PDF contracte',
        href: 'https://cdn.test/contracte-enviat.pdf',
      },
      meta: {
        documentType: 'CONTRACT',
        contractReference: 'CTR-2026-001',
        contractStatus: 'SENT',
        contractPdfUrl: 'https://cdn.test/contracte-enviat.pdf',
      },
      originLinks: [
        { label: 'Client origen', href: '/admin/clientes/cust-1' },
        { label: 'Entrada origen', href: '/admin/leads/lead-1' },
        { label: 'Reserva origen', href: '/admin/bookings/booking-1' },
      ],
    });
    expect(events.find((event) => event.id === 'proposal:prop-no-pdf:contract-sent')).toBeUndefined();
    expect(events.find((event) => event.id === 'proposal:prop-cancelled:contract-sent')).toBeUndefined();
    expect(events.find((event) => event.id === 'proposal:prop-signed:contract-sent')).toBeUndefined();
    expect(events.find((event) => event.id === 'proposal:prop-signed:contract-signed')).toBeDefined();
  });

  it('projecta report i enquesta post-event dins la timeline del customer hub', () => {
    const events = buildCustomerBusinessTimelineEvents({
      proposals: [],
      bookings: [{
        id: 'booking-1',
        reference: 'OE-2026-010',
        date: '2026-05-01T18:00:00.000Z',
        status: 'COMPLETED',
        postEventReport: {
          id: 'report-1',
          status: 'COMPLETED',
          completedAt: '2026-05-02T10:00:00.000Z',
          createdAt: '2026-05-02T09:55:00.000Z',
          soundQuality: 5,
          maxDancefloor: 80,
          hadIncidents: false,
        },
        clientSurvey: {
          id: 'survey-1',
          submittedAt: '2026-05-02T11:00:00.000Z',
          overallRating: 5,
          npsScore: 10,
          testimonialPermission: 'YES_ANONYMOUS',
          createdTestimonialId: null,
        },
      }],
      tasks: [],
      messages: [],
    });

    expect(events.find((event) => event.id === 'booking:booking-1:post-event-report')).toMatchObject({
      type: 'ACTIVITY',
      title: 'Informe post-event completat (OE-2026-010)',
      link: { label: 'Veure post-event', href: '/admin/bookings/booking-1#sec-post-event' },
      meta: {
        documentType: 'POST_EVENT_REPORT',
        reportId: 'report-1',
        status: 'COMPLETED',
        soundQuality: 5,
        maxDancefloor: 80,
        hadIncidents: false,
      },
    });
    expect(events.find((event) => event.id === 'booking:booking-1:client-survey')).toMatchObject({
      type: 'ACTIVITY',
      title: 'Enquesta post-event rebuda (OE-2026-010)',
      link: { label: 'Veure post-event', href: '/admin/bookings/booking-1#sec-post-event' },
      meta: {
        documentType: 'CLIENT_SURVEY',
        surveyId: 'survey-1',
        overallRating: 5,
        npsScore: 10,
      },
    });
  });

  it('projecta albarà signat amb PDF dins la timeline del customer hub', () => {
    const events = buildCustomerBusinessTimelineEvents({
      proposals: [],
      bookings: [{
        id: 'booking-1',
        reference: 'OE-2026-010',
        date: '2026-05-01T18:00:00.000Z',
        status: 'COMPLETED',
        deliveryNotes: [
          {
            id: 'alb-draft',
            reference: 'ALB-2026-0001',
            status: 'DRAFT',
            pdfUrl: 'https://cdn.test/draft.pdf',
            signedAt: null,
            createdAt: '2026-05-01T20:00:00.000Z',
          },
          {
            id: 'alb-signed',
            reference: 'ALB-2026-0002',
            status: 'SIGNED',
            pdfUrl: 'https://cdn.test/albaran.pdf',
            signedAt: '2026-05-02T00:30:00.000Z',
            createdAt: '2026-05-01T21:00:00.000Z',
          },
        ],
      }],
      tasks: [],
      messages: [],
    });

    expect(events.find((event) => event.id === 'booking:booking-1:delivery-note:alb-signed:signed')).toMatchObject({
      type: 'ACTIVITY',
      at: '2026-05-02T00:30:00.000Z',
      title: 'Albarà signat (ALB-2026-0002)',
      link: { label: 'Obrir PDF albarà', href: 'https://cdn.test/albaran.pdf' },
      meta: {
        documentType: 'DELIVERY_NOTE',
        deliveryNoteId: 'alb-signed',
        reference: 'ALB-2026-0002',
        bookingId: 'booking-1',
        bookingReference: 'OE-2026-010',
        pdfUrl: 'https://cdn.test/albaran.pdf',
      },
    });
    expect(events.find((event) => event.id.includes('alb-draft'))).toBeUndefined();
  });

  it('projecta factura activa amb document dins la timeline del customer hub', () => {
    const events = buildCustomerBusinessTimelineEvents({
      proposals: [],
      bookings: [{
        id: 'booking-1',
        reference: 'OE-2026-010',
        date: '2026-05-01T18:00:00.000Z',
        status: 'COMPLETED',
        invoices: [
          {
            id: 'inv-cancelled',
            reference: 'FAC-2026-0001',
            status: 'CANCELLED',
            total: 1000,
            pdfUrl: 'https://cdn.test/cancelled.pdf',
            holdedInvoiceUrl: null,
            createdAt: '2026-05-02T08:00:00.000Z',
          },
          {
            id: 'inv-empty',
            reference: 'FAC-2026-0002',
            status: 'DRAFT',
            total: 1000,
            pdfUrl: null,
            holdedInvoiceUrl: null,
            createdAt: '2026-05-02T09:00:00.000Z',
          },
          {
            id: 'inv-active',
            reference: 'FAC-2026-0003',
            status: 'PAID',
            total: 1210,
            pdfUrl: 'https://cdn.test/factura.pdf',
            holdedInvoiceUrl: 'https://app.holded.com/invoices/1',
            createdAt: '2026-05-02T10:00:00.000Z',
          },
        ],
      }],
      tasks: [],
      messages: [],
    });

    expect(events.find((event) => event.id === 'booking:booking-1:invoice:inv-active:document')).toMatchObject({
      type: 'ACTIVITY',
      at: '2026-05-02T10:00:00.000Z',
      title: 'Factura disponible (FAC-2026-0003)',
      link: { label: 'Obrir PDF factura', href: 'https://cdn.test/factura.pdf' },
      meta: {
        documentType: 'INVOICE',
        invoiceId: 'inv-active',
        reference: 'FAC-2026-0003',
        status: 'PAID',
        bookingId: 'booking-1',
        bookingReference: 'OE-2026-010',
        total: 1210,
        pdfUrl: 'https://cdn.test/factura.pdf',
        holdedInvoiceUrl: 'https://app.holded.com/invoices/1',
      },
    });
    expect(events.find((event) => event.id.includes('inv-cancelled'))).toBeUndefined();
    expect(events.find((event) => event.id.includes('inv-empty'))).toBeUndefined();
  });
});
