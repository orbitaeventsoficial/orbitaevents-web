import type { LeadStatus, Priority } from '@prisma/client';

export interface LeadOwnerControlLead {
  status: LeadStatus;
  priority: Priority;
  createdAt: Date;
  customerId: string | null;
  booking: { id: string } | null;
}

export interface LeadOwnerControlSummary {
  automaticSignals: string[];
  manualSignals: string[];
  nextStep: {
    href: string;
    label: string;
    detail: string;
  };
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function buildLeadOwnerControlSummary(
  leads: LeadOwnerControlLead[],
  now = new Date(),
): LeadOwnerControlSummary {
  const newLeads = leads.filter((lead) => lead.status === 'NEW').length;
  const hotLeads = leads.filter((lead) => lead.priority === 'HIGH' || lead.priority === 'URGENT').length;
  const wonLeads = leads.filter((lead) => lead.status === 'WON').length;
  const linkedCustomers = leads.filter((lead) => Boolean(lead.customerId)).length;
  const linkedBookings = leads.filter((lead) => Boolean(lead.booking)).length;
  const staleLeads = leads.filter((lead) => {
    if (lead.status === 'WON' || lead.status === 'LOST') return false;
    const hours = Math.floor((now.getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60));
    return hours >= 24;
  }).length;

  const automaticSignals = [
    newLeads > 0 ? `${newLeads} ${plural(newLeads, 'entrada nova', 'entrades noves')}` : null,
    hotLeads > 0 ? `${hotLeads} ${plural(hotLeads, 'entrada d’alta prioritat', 'entrades d’alta prioritat')}` : null,
    linkedCustomers > 0 ? `${linkedCustomers} ${plural(linkedCustomers, 'entrada ja viu a Fitxa 360', 'entrades ja viuen a Fitxa 360')}` : null,
    linkedBookings > 0 ? `${linkedBookings} ${plural(linkedBookings, 'entrada ja vinculada a reserva', 'entrades ja vinculades a reserva')}` : null,
  ].filter(Boolean) as string[];

  const manualSignals = [
    staleLeads > 0 ? `${staleLeads} ${plural(staleLeads, 'entrada fa', 'entrades fan')} més de 24h sense tancar` : null,
    newLeads > 0 ? `${newLeads} ${plural(newLeads, 'entrada pendent', 'entrades pendents')} de primera resposta` : null,
    wonLeads === 0 && leads.length > 0 ? 'Cap entrada guanyada a la vista actual' : null,
  ].filter(Boolean) as string[];

  if (staleLeads > 0) {
    return {
      automaticSignals,
      manualSignals,
      nextStep: {
        href: '/admin/leads?status=NEW',
        label: 'Respondre entrades fredes',
        detail: 'El risc principal és deixar refredar oportunitats que ja passen del llindar saludable.',
      },
    };
  }

  if (newLeads > 0) {
    return {
      automaticSignals,
      manualSignals,
      nextStep: {
        href: '/admin/leads?status=NEW',
        label: 'Atacar entrades noves',
        detail: 'La prioritat és fer la primera resposta comercial.',
      },
    };
  }

  if (hotLeads > 0) {
    return {
      automaticSignals,
      manualSignals,
      nextStep: {
        href: '/admin/leads?priority=HIGH&priority=URGENT',
        label: 'Revisar prioritats altes',
        detail: 'Queden oportunitats calentes que mereixen atenció abans del detall.',
      },
    };
  }

  return {
    automaticSignals,
    manualSignals,
    nextStep: {
      href: '/admin/intake',
      label: 'Crear entrada ràpida',
      detail: 'No hi ha tensió crítica a la vista actual.',
    },
  };
}
