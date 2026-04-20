import type { PendingFollowUp } from '@/lib/services/responseTrackingService';

type LeadCommercialBlockerInput = {
  status: string;
  booking?: { id: string } | null;
  followUp?: PendingFollowUp | null;
};

export function buildLeadCommercialBlocker(input: LeadCommercialBlockerInput): {
  label: string;
  context?: string;
  tone: 'DANGER' | 'WARNING' | 'INFO';
} | null {
  const { status, booking, followUp } = input;

  if (followUp) {
    if (followUp.urgency === 'URGENT') {
      return {
        label: 'Seguiment urgent',
        context: `${followUp.daysSinceOutbound}d sense resposta`,
        tone: 'DANGER',
      };
    }

    if (followUp.urgency === 'NORMAL') {
      return {
        label: 'Seguiment pendent',
        context: `${followUp.daysSinceOutbound}d sense resposta`,
        tone: 'WARNING',
      };
    }

    return {
      label: 'Contacte recent pendent',
      context: `${followUp.daysSinceOutbound}d des de l'últim outbound`,
      tone: 'INFO',
    };
  }

  if (status === 'NEW') {
    return {
      label: 'Primera resposta pendent',
      context: 'Lead nova sense primer moviment comercial visible',
      tone: 'WARNING',
    };
  }

  if (status === 'CONTACTED') {
    return {
      label: 'Contacte iniciat',
      context: 'Cal validar si el primer toc ha generat conversa real',
      tone: 'INFO',
    };
  }

  if (status === 'QUOTE_SENT') {
    return {
      label: 'Pressupost pendent',
      context: 'Cal desencallar si la proposta s\'ha revisat',
      tone: 'WARNING',
    };
  }

  if (status === 'NEGOTIATING') {
    return {
      label: 'Negociació oberta',
      context: 'Cal moure la conversa cap a decisió o reserva',
      tone: 'INFO',
    };
  }

  if (status === 'WON' && !booking) {
    return {
      label: 'Passar a reserva',
      context: 'Lead guanyada sense reserva vinculada',
      tone: 'WARNING',
    };
  }

  return null;
}
