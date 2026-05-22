import { describe, expect, it } from 'vitest';

import { buildCustomerCommunicationSpine } from '@/lib/customer-hub/communicationSpine';
import type { CustomerCommSummaryDTO } from '@/lib/customer-hub/dto';

const BASE_COMM_SUMMARY: CustomerCommSummaryDTO = {
  total: 1,
  channels: { EMAIL: 0, WHATSAPP: 1, INSTAGRAM: 0, FORM: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
  lastContactAt: '2026-04-17T09:00:00.000Z',
  lastContactChannel: 'WHATSAPP',
  lastContactDirection: 'INBOUND',
  pendingResponseFrom: 'TEAM',
  daysSinceLastContact: 1,
  responseGap: 1,
};

describe('buildCustomerCommunicationSpine', () => {
  it('marca l’equip com a propietari quan el client espera resposta', () => {
    expect(
      buildCustomerCommunicationSpine({
        customerId: 'cust-1',
        commSummary: BASE_COMM_SUMMARY,
      })
    ).toEqual({
      stateLabel: 'Client esperant resposta',
      ownerLabel: 'Moure ara: equip',
      detail: 'Últim contacte registrat · WHATSAPP',
      hubHref: '/admin/clientes/cust-1?tab=comms',
      taskHref: '/admin/tasks/new?customerId=cust-1',
    });
  });

  it('posa el seguiment canònic per damunt del resum genèric', () => {
    expect(
      buildCustomerCommunicationSpine({
        customerId: 'cust-1',
        commSummary: BASE_COMM_SUMMARY,
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
      }).detail
    ).toBe('Anna · 6d sense resposta · Trucar o enviar WhatsApp');
  });

  it('marca la conversa sense cua quan no hi ha resposta pendent', () => {
    const spine = buildCustomerCommunicationSpine({
      customerId: 'cust-1',
      commSummary: {
        ...BASE_COMM_SUMMARY,
        pendingResponseFrom: 'NONE',
        lastContactAt: null,
        lastContactChannel: null,
      },
    });

    expect(spine.stateLabel).toBe('Conversa sense cua oberta');
    expect(spine.ownerLabel).toBe('Sense propietari actiu');
    expect(spine.detail).toBe('Encara no hi ha contacte registrat');
  });
});
