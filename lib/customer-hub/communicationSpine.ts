import {
  buildCustomerTaskCreateHref,
  buildCustomerWorkspaceTabHref,
} from '@/lib/admin/customerWorkspaceHref';
import type { CustomerCommSummaryDTO, CustomerFollowUpSummaryDTO } from './dto';

export type CustomerCommunicationSpine = {
  stateLabel: string;
  ownerLabel: string;
  detail: string;
  hubHref: string;
  taskHref: string;
};

export function buildCustomerCommunicationSpine(input: {
  customerId: string;
  commSummary: CustomerCommSummaryDTO;
  followUpSummary?: CustomerFollowUpSummaryDTO;
}): CustomerCommunicationSpine {
  const { customerId, commSummary, followUpSummary } = input;
  const topFollowUp = followUpSummary?.topItem;
  const stateLabel = commSummary.pendingResponseFrom === 'TEAM'
    ? 'Client esperant resposta'
    : commSummary.pendingResponseFrom === 'CLIENT'
      ? 'Esperem resposta del client'
      : 'Conversa sense cua oberta';
  const ownerLabel = commSummary.pendingResponseFrom === 'TEAM'
    ? 'Moure ara: equip'
    : commSummary.pendingResponseFrom === 'CLIENT'
      ? 'Moure quan respongui el client'
      : 'Sense propietari actiu';
  const detail = topFollowUp
    ? `${topFollowUp.name} · ${topFollowUp.daysSinceOutbound}d sense resposta · ${topFollowUp.suggestedAction}`
    : commSummary.lastContactAt
      ? `Últim contacte registrat · ${commSummary.lastContactChannel || 'canal desconegut'}`
      : 'Encara no hi ha contacte registrat';

  return {
    stateLabel,
    ownerLabel,
    detail,
    hubHref: buildCustomerWorkspaceTabHref(customerId, 'comms'),
    taskHref: buildCustomerTaskCreateHref(customerId),
  };
}
