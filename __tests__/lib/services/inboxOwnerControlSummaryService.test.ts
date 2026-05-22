import { describe, expect, it } from 'vitest';
import { buildInboxOwnerControlSummary } from '@/lib/services/inboxOwnerControlSummaryService';

describe('buildInboxOwnerControlSummary', () => {
  it('mostra converses que ja viuen a Fitxa 360', () => {
    const result = buildInboxOwnerControlSummary({
      imapConfigured: true,
      leads: [{ customerId: 'cust-1' }, { customerId: null }, { customerId: 'cust-2' }],
      stats: { todayLeads: 1, unreadLeads: 0 },
      followUps: { total: 2, urgent: 0 },
    });

    expect(result.automaticSignals).toContain('2 converses ja viuen a Fitxa 360');
    expect(result.automaticSignals).toContain('1 entrada avui');
    expect(result.automaticSignals).toContain('2 seguiments pendents');
  });

  it('prioritza seguiments urgents sobre entrades noves', () => {
    const result = buildInboxOwnerControlSummary({
      imapConfigured: true,
      leads: [],
      stats: { todayLeads: 0, unreadLeads: 3 },
      followUps: { total: 4, urgent: 1 },
    });

    expect(result.manualSignals).toContain('3 entrades noves');
    expect(result.manualSignals).toContain('1 seguiment urgent');
    expect(result.nextStep).toEqual({
      href: '#pending-followups',
      label: 'Atacar seguiments urgents',
      detail: 'Hi ha leads contactats sense resposta que ja passen del llindar saludable.',
    });
  });

  it('demana configurar IMAP quan no hi ha tensió i el correu real no està actiu', () => {
    const result = buildInboxOwnerControlSummary({
      imapConfigured: false,
      leads: [],
      stats: { todayLeads: 0, unreadLeads: 0 },
      followUps: { total: 0, urgent: 0 },
    });

    expect(result.manualSignals).toContain('Configurar IMAP per operar la safata real');
    expect(result.nextStep.href).toBe('/admin/inbox/settings');
  });
});
