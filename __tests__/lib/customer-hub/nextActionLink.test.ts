import { describe, expect, it } from 'vitest';

import { buildCustomerCommercialRiskLink, buildCustomerNextActionLink } from '@/lib/customer-hub/nextActionLink';
import {
  buildCustomerBookingListHref,
  buildCustomerComposeHref,
  buildCustomerProposalHref,
  buildCustomerTaskListHref,
} from '@/lib/admin/customerWorkspaceHref';

const BASE_COMM_SUMMARY = {
  total: 0,
  channels: { EMAIL: 0, WHATSAPP: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
  lastContactAt: null,
  lastContactChannel: null,
  lastContactDirection: null,
  pendingResponseFrom: 'NONE' as const,
  daysSinceLastContact: null,
  responseGap: null,
};

describe('buildCustomerNextActionLink', () => {
  it('reutilitza el helper canònic quan l’acció és crear pressupost', () => {
    const result = buildCustomerNextActionLink({
      customerId: 'cust-1',
      customerName: 'Anna',
      nextAction: {
        type: 'SEND_PROPOSAL',
        label: 'Enviar pressupost',
        urgency: 'HIGH',
      },
      commSummary: BASE_COMM_SUMMARY,
    });

    expect(result).toEqual({
      href: buildCustomerProposalHref('cust-1'),
      label: 'Crear pressupost',
    });
  });

  it('obre WhatsApp si el seguiment ve d’un últim toc per WhatsApp i hi ha telèfon', () => {
    const result = buildCustomerNextActionLink({
      customerId: 'cust-1',
      customerName: 'Anna',
      customerPhone: '+34 600 11 22 33',
      nextAction: {
        type: 'FOLLOW_UP',
        label: 'Respondre al client',
        urgency: 'HIGH',
      },
      commSummary: {
        ...BASE_COMM_SUMMARY,
        lastContactChannel: 'WHATSAPP',
      },
    });

    expect(result).toMatchObject({
      label: 'Respondre per WhatsApp',
      external: true,
    });
    expect(result?.href).toContain('https://wa.me/34600112233?text=');
  });

  it('cau a compose email si el seguiment no és WhatsApp', () => {
    const result = buildCustomerNextActionLink({
      customerId: 'cust-1',
      customerName: 'Anna',
      customerPhone: '+34 600 11 22 33',
      nextAction: {
        type: 'FOLLOW_UP',
        label: 'Respondre al client',
        urgency: 'HIGH',
      },
      commSummary: {
        ...BASE_COMM_SUMMARY,
        lastContactChannel: 'EMAIL',
      },
    });

    expect(result).toEqual({
      href: buildCustomerComposeHref('cust-1', 'recordatori'),
      label: 'Respondre per email',
    });
  });

  it('reutilitza el helper canònic quan l’acció és revisar cobraments o tasques', () => {
    expect(
      buildCustomerNextActionLink({
        customerId: 'cust-1',
        customerName: 'Anna',
        nextAction: {
          type: 'COLLECT_PAYMENT',
          label: 'Revisar cobraments',
          urgency: 'MEDIUM',
        },
        commSummary: BASE_COMM_SUMMARY,
      })
    ).toEqual({
      href: buildCustomerBookingListHref('cust-1'),
      label: 'Revisar cobraments',
    });

    expect(
      buildCustomerNextActionLink({
        customerId: 'cust-1',
        customerName: 'Anna',
        nextAction: {
          type: 'COMPLETE_TASK',
          label: 'Completar tasca',
          urgency: 'MEDIUM',
        },
        commSummary: BASE_COMM_SUMMARY,
      })
    ).toEqual({
      href: buildCustomerTaskListHref('cust-1'),
      label: 'Veure tasques',
    });
  });
});

describe('buildCustomerCommercialRiskLink', () => {
  it('obre WhatsApp si el risc és alt i el top follow-up urgent té telèfon', () => {
    const result = buildCustomerCommercialRiskLink({
      customerId: 'cust-1',
      customerName: 'Anna',
      customerPhone: '+34 600 11 22 33',
      commercialRisk: {
        level: 'HIGH',
        label: 'Risc comercial alt',
      },
      followUpSummary: {
        total: 1,
        urgent: 1,
        normal: 0,
        low: 0,
        topItem: {
          leadId: 'lead-1',
          name: 'Anna',
          phone: '+34 600 11 22 33',
          urgency: 'URGENT',
          daysSinceOutbound: 6,
          suggestedAction: 'Trucar o enviar WhatsApp',
        },
      },
    });

    expect(result).toMatchObject({
      label: 'Desencallar per WhatsApp',
      external: true,
    });
    expect(result?.href).toContain('https://wa.me/34600112233?text=');
  });

  it('cau a seguiment email si el risc existeix però no hi ha via WhatsApp urgent', () => {
    const result = buildCustomerCommercialRiskLink({
      customerId: 'cust-1',
      customerName: 'Anna',
      commercialRisk: {
        level: 'MEDIUM',
        label: 'Relació en refredament',
      },
      followUpSummary: {
        total: 1,
        urgent: 0,
        normal: 1,
        low: 0,
        topItem: {
          leadId: 'lead-1',
          name: 'Anna',
          phone: null,
          urgency: 'NORMAL',
          daysSinceOutbound: 3,
          suggestedAction: 'Enviar recordatori',
        },
      },
    });

    expect(result).toEqual({
      href: buildCustomerComposeHref('cust-1', 'seguiment'),
      label: 'Reactivar conversa',
    });
  });
});
