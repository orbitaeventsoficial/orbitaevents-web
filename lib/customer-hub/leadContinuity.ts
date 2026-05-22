import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import type { LeadDTO } from './dto';

export type LeadContinuity = {
  hubHref: string;
  technicalHref: string;
  stageLabel: string;
  narrative: string;
};

const STAGE_BY_STATUS: Record<string, string> = {
  NEW: 'Entrada nova',
  CONTACTED: 'Primer contacte',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'Negociació oberta',
  WON: 'Conversió guanyada',
  LOST: 'Oportunitat perduda',
};

export function buildLeadContinuity(lead: LeadDTO, customerId: string): LeadContinuity {
  const ownerCustomerId = lead.customerId || customerId;
  const stageLabel = lead.booking
    ? 'Reserva vinculada'
    : STAGE_BY_STATUS[lead.status] || 'Seguiment comercial';

  return {
    hubHref: buildLeadCustomerHref({
      leadId: lead.id,
      customerId: ownerCustomerId,
      customerTab: 'leads',
    }),
    technicalHref: buildLeadWorkspaceHref(lead.id),
    stageLabel,
    narrative: 'Lead -> negociació -> reserva -> client recurrent',
  };
}
