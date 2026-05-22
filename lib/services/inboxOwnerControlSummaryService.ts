export interface InboxOwnerControlLead {
  customerId: string | null;
}

export interface InboxOwnerControlStats {
  todayLeads: number;
  unreadLeads: number;
}

export interface InboxOwnerControlFollowUps {
  total: number;
  urgent: number;
}

export interface InboxOwnerControlSummary {
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

export function buildInboxOwnerControlSummary(input: {
  imapConfigured: boolean;
  leads: InboxOwnerControlLead[];
  stats: InboxOwnerControlStats;
  followUps: InboxOwnerControlFollowUps;
}): InboxOwnerControlSummary {
  const linkedCustomers = input.leads.filter((lead) => Boolean(lead.customerId)).length;

  const automaticSignals = [
    input.imapConfigured ? 'Correu IMAP configurat' : 'Només entren leads web; el correu real encara no està configurat',
    input.stats.todayLeads > 0 ? `${input.stats.todayLeads} ${plural(input.stats.todayLeads, 'entrada avui', 'entrades avui')}` : null,
    input.followUps.total > 0 ? `${input.followUps.total} ${plural(input.followUps.total, 'seguiment pendent', 'seguiments pendents')}` : null,
    linkedCustomers > 0 ? `${linkedCustomers} ${plural(linkedCustomers, 'conversa ja viu a Fitxa 360', 'converses ja viuen a Fitxa 360')}` : null,
  ].filter(Boolean) as string[];

  const manualSignals = [
    input.stats.unreadLeads > 0 ? `${input.stats.unreadLeads} ${plural(input.stats.unreadLeads, 'entrada nova', 'entrades noves')}` : null,
    input.followUps.urgent > 0 ? `${input.followUps.urgent} ${plural(input.followUps.urgent, 'seguiment urgent', 'seguiments urgents')}` : null,
    !input.imapConfigured ? 'Configurar IMAP per operar la safata real' : null,
  ].filter(Boolean) as string[];

  if (input.followUps.urgent > 0) {
    return {
      automaticSignals,
      manualSignals,
      nextStep: {
        href: '#pending-followups',
        label: 'Atacar seguiments urgents',
        detail: 'Hi ha leads contactats sense resposta que ja passen del llindar saludable.',
      },
    };
  }

  if (input.stats.unreadLeads > 0) {
    return {
      automaticSignals,
      manualSignals,
      nextStep: {
        href: '#inbox-main',
        label: 'Revisar entrades noves',
        detail: 'La prioritat és buidar les entrades noves abans que es refredin.',
      },
    };
  }

  if (!input.imapConfigured) {
    return {
      automaticSignals,
      manualSignals,
      nextStep: {
        href: '/admin/inbox/settings',
        label: 'Configurar correu real',
        detail: 'La safata encara no és completa fins que IMAP estigui connectat.',
      },
    };
  }

  return {
    automaticSignals,
    manualSignals,
    nextStep: {
      href: '/admin/inbox/compose',
      label: 'Enviar correu nou',
      detail: 'No hi ha tensió crítica ara mateix; pots iniciar comunicació nova.',
    },
  };
}
