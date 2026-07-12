import { describe, expect, it } from 'vitest';

import {
  projectAdminTodayActions,
  projectContractWorkflowTodayAction,
  projectDossierDraftTodayAction,
  projectNextEventEconomicTodayAction,
  projectPostEventTodayAction,
  projectProposalBookingConversionTodayAction,
  projectProposalDraftTodayAction,
} from '@/app/admin/lib/today-actions';
import type { BriefAction } from '@/lib/services/dailyBriefService';
import type { ContractWorkflowSuggestion } from '@/lib/services/contractWorkflowSuggestionService';
import type { DossierDraftSuggestion } from '@/lib/services/dossierDraftSuggestionService';
import type { NextBestAction } from '@/lib/services/nextBestActionService';
import type { ProposalBookingConversionSuggestion } from '@/lib/services/proposalBookingConversionSuggestionService';
import type { ProposalDraftSuggestion } from '@/lib/services/proposalDraftSuggestionService';

function nbaAction(overrides: Partial<NextBestAction> = {}): NextBestAction {
  return {
    rank: 1,
    id: 'nba-1',
    domain: 'lead',
    actionType: 'CONTACT_NOW',
    urgency: 'CRITICAL',
    icon: '!',
    title: 'Contactar Anna',
    subtitle: 'Lead nou',
    href: '/admin/leads/l1',
    score: 150,
    entity: { type: 'lead', id: 'l1', name: 'Anna' },
    reasoning: 'Lead sense resposta dins SLA',
    estimatedImpact: 'HIGH',
    timeWindow: 'Ara',
    ...overrides,
  };
}

function briefAction(overrides: Partial<BriefAction> = {}): BriefAction {
  return {
    priority: 1,
    label: 'Tancar tasques',
    detail: 'Hi ha tasques vencudes',
    href: '/admin/tasks',
    ...overrides,
  };
}

function dossierDraftAction(overrides: Partial<DossierDraftSuggestion> = {}): DossierDraftSuggestion {
  return {
    leadId: 'lead-doc-1',
    name: 'Cristina',
    status: 'NEGOTIATING',
    priority: 'HIGH',
    score: 88,
    band: 'ALTA',
    href: '/admin/dossiers?leadId=lead-doc-1',
    reasons: ['Sense dossier actiu', 'Bolo configurat', 'Data propera'],
    eventDate: new Date('2026-07-17T20:30:00.000Z'),
    daysUntilEvent: 4,
    budget: null,
    serviceLinesCount: 2,
    ...overrides,
  };
}

function contractWorkflowAction(overrides: Partial<ContractWorkflowSuggestion> = {}): ContractWorkflowSuggestion {
  return {
    proposalId: 'prop-contract-1',
    reference: 'PROP-2026-0001',
    customerId: 'cust-1',
    name: 'Anna',
    total: 1200,
    action: 'SEND_CONTRACT',
    score: 108,
    band: 'ALTA',
    href: '/admin/clientes/cust-1?tab=proposals',
    reasons: ['Pressupost acceptat', 'Contracte generat', 'Pendent d\'enviar'],
    contractStatus: 'DRAFT',
    contractReference: 'CTR-2026-0001',
    daysSinceAccepted: 2,
    daysSinceSent: null,
    daysUntilEvent: 6,
    ...overrides,
  };
}

function proposalDraftAction(overrides: Partial<ProposalDraftSuggestion> = {}): ProposalDraftSuggestion {
  return {
    proposalId: 'prop-draft-1',
    reference: 'PROP-2026-0027',
    customerId: 'cust-1',
    leadId: 'lead-1',
    bookingId: null,
    name: 'Cristina',
    total: 302.5,
    score: 91,
    band: 'ALTA',
    href: '/admin/presupuestos?customerId=cust-1&proposalId=prop-draft-1',
    reasons: ['Pressupost en esborrany', 'Client assignat', 'Bolo vinculat'],
    daysSinceUpdated: 0,
    daysUntilEvent: 8,
    ...overrides,
  };
}

function proposalBookingAction(overrides: Partial<ProposalBookingConversionSuggestion> = {}): ProposalBookingConversionSuggestion {
  return {
    proposalId: 'prop-booking-1',
    reference: 'PROP-2026-0042',
    customerId: 'cust-1',
    leadId: 'lead-1',
    name: 'Anna',
    total: 1200,
    score: 126,
    band: 'ALTA',
    href: '/admin/bookings/new?proposalId=prop-booking-1&leadId=lead-1&prefill=lead',
    reasons: ['Pressupost acceptat', 'Reserva pendent de crear', 'Data propera'],
    daysSinceAccepted: 2,
    daysUntilEvent: 6,
    ...overrides,
  };
}

describe('projectAdminTodayActions', () => {
  it('prioritza el ranking NBA i mostra domini + finestra temporal', () => {
    const actions = projectAdminTodayActions(
      [nbaAction({ domain: 'customer', timeWindow: 'Avui', urgency: 'HIGH' })],
      [briefAction()],
    );

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual(
      expect.objectContaining({
        id: 'nba-1',
        href: '/admin/leads/l1',
        label: 'Contactar Anna',
        detail: 'Lead sense resposta dins SLA',
        badge: 'Client · Avui',
        badgeClass: 'ap-badge ap-badge--warning',
        source: 'nba',
        sourceId: 'nba-1',
      }),
    );
    expect(actions[1]).toEqual(
      expect.objectContaining({
        id: 'brief-/admin/tasks-0',
        source: 'brief',
      }),
    );
  });

  it('fa fallback a dailyBrief si no hi ha accions NBA', () => {
    const actions = projectAdminTodayActions([], [
      briefAction({ href: '/admin/manual', label: 'Executar captacio' }),
    ]);

    expect(actions).toEqual([
      expect.objectContaining({
        id: 'brief-/admin/manual-0',
        href: '/admin/manual',
        label: 'Executar captacio',
        badge: null,
        source: 'brief',
      }),
    ]);
  });

  it('limita el resultat al top 3 per defecte', () => {
    const actions = projectAdminTodayActions([
      nbaAction({ id: 'nba-1' }),
      nbaAction({ id: 'nba-2' }),
      nbaAction({ id: 'nba-3' }),
      nbaAction({ id: 'nba-4' }),
    ], []);

    expect(actions.map((action) => action.id)).toEqual(['nba-1', 'nba-2', 'nba-3']);
  });

  it('usa el control complet si una accio NBA no porta href', () => {
    const [action] = projectAdminTodayActions([nbaAction({ href: '' })], []);

    expect(action.href).toBe('/admin/control');
  });

  it('omple buits del ranking amb post-event abans de caure al dailyBrief', () => {
    const postEvent = projectPostEventTodayAction({
      bookingId: 'book-1',
      href: '/admin/post-event/playbook',
      clientName: 'Maria',
      nextActionLabel: 'Demanar testimoni',
      daysSinceEvent: 4,
      priority: 'MITJANA',
    });

    const actions = projectAdminTodayActions(
      [nbaAction({ id: 'nba-1' })],
      [briefAction({ label: 'Brief generic' })],
      3,
      [postEvent],
    );

    expect(actions.map((action) => action.source)).toEqual(['nba', 'postEvent', 'brief']);
    expect(actions[1]).toMatchObject({
      id: 'post-event-book-1',
      label: 'Tancar post-event: Maria',
      badge: 'Post-event · MITJANA',
      sourceId: 'book-1',
    });
    expect(actions[2]).toMatchObject({
      id: 'brief-/admin/tasks-0',
      label: 'Brief generic',
    });
  });

  it('usa post-event com a cua principal si no hi ha NBA', () => {
    const postEvent = projectPostEventTodayAction({
      bookingId: 'book-2',
      href: '/admin/post-event/playbook',
      clientName: 'Anna',
      nextActionLabel: 'Demanar referral',
      daysSinceEvent: 1,
      priority: 'BAIXA',
    });

    const actions = projectAdminTodayActions([], [briefAction()], 3, [postEvent]);

    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({
      source: 'postEvent',
      detail: 'Ara toca: Demanar referral · fa 1 dia',
    });
    expect(actions[1]).toMatchObject({
      source: 'brief',
      label: 'Tancar tasques',
    });
  });

  it('projecta dossiers pendents com a accio documental executiva', () => {
    const action = projectDossierDraftTodayAction(dossierDraftAction());

    expect(action).toMatchObject({
      id: 'document-dossier-lead-doc-1',
      href: '/admin/dossiers?leadId=lead-doc-1',
      label: 'Preparar dossier: Cristina',
      badge: 'Document · ALTA',
      badgeClass: 'ap-badge ap-badge--danger',
      source: 'document',
      sourceId: 'lead-doc-1',
      queuePriority: 100,
    });
    expect(action.detail).toContain('Sense dossier actiu');
    expect(action.detail).toContain('data en 4 dies');
    expect(action.detail).toContain('2 línies de bolo');
  });

  it('fa pujar document pendent abans del fallback generic del brief', () => {
    const document = projectDossierDraftTodayAction(dossierDraftAction({ score: 74, band: 'MITJANA' }));
    const actions = projectAdminTodayActions([], [briefAction({ label: 'Revisar el dia' })], 3, [document]);

    expect(actions.map((action) => action.source)).toEqual(['document', 'brief']);
    expect(actions[0]).toMatchObject({
      label: 'Preparar dossier: Cristina',
      badge: 'Document · MITJANA',
    });
  });

  it('projecta contractes pendents com a accio documental executiva', () => {
    const action = projectContractWorkflowTodayAction(contractWorkflowAction());

    expect(action).toMatchObject({
      id: 'document-contract-prop-contract-1',
      href: '/admin/clientes/cust-1?tab=proposals',
      label: 'Enviar contracte: Anna',
      badge: 'Contracte · ALTA',
      badgeClass: 'ap-badge ap-badge--danger',
      source: 'document',
      sourceId: 'prop-contract-1',
      queuePriority: 115,
    });
    expect(action.detail).toContain('Pressupost acceptat');
    expect(action.detail).toContain('data en 6 dies');
    expect(action.detail).toContain('1.200');
  });

  it('fa pujar contracte pendent abans del fallback generic del brief', () => {
    const document = projectContractWorkflowTodayAction(contractWorkflowAction({
      action: 'GENERATE_CONTRACT',
      score: 76,
      band: 'MITJANA',
      contractReference: null,
    }));
    const actions = projectAdminTodayActions([], [briefAction({ label: 'Revisar el dia' })], 3, [document]);

    expect(actions.map((action) => action.source)).toEqual(['document', 'brief']);
    expect(actions[0]).toMatchObject({
      label: 'Generar contracte: Anna',
      badge: 'Contracte · MITJANA',
    });
  });

  it('projecta pressupostos draft com a accio documental cap al Studio', () => {
    const action = projectProposalDraftTodayAction(proposalDraftAction());

    expect(action).toMatchObject({
      id: 'document-proposal-prop-draft-1',
      href: '/admin/presupuestos?customerId=cust-1&proposalId=prop-draft-1',
      label: 'Revisar pressupost: Cristina',
      badge: 'Pressupost · ALTA',
      badgeClass: 'ap-badge ap-badge--danger',
      source: 'document',
      sourceId: 'prop-draft-1',
      queuePriority: 105,
    });
    expect(action.detail).toContain('Pressupost en esborrany');
    expect(action.detail).toContain('data en 8 dies');
    expect(action.detail).toContain('303');
  });

  it('projecta pressupostos acceptats sense reserva com a accio de creacio de reserva', () => {
    const action = projectProposalBookingConversionTodayAction(proposalBookingAction());

    expect(action).toMatchObject({
      id: 'document-proposal-booking-prop-booking-1',
      href: '/admin/bookings/new?proposalId=prop-booking-1&leadId=lead-1&prefill=lead',
      label: 'Crear reserva: Anna',
      badge: 'Reserva · ALTA',
      badgeClass: 'ap-badge ap-badge--danger',
      source: 'document',
      sourceId: 'prop-booking-1',
      queuePriority: 130,
    });
    expect(action.detail).toContain('Pressupost acceptat');
    expect(action.detail).toContain('Reserva pendent de crear');
    expect(action.detail).toContain('data en 6 dies');
    expect(action.detail).toContain('1.200');
  });

  it('fa pujar reserva pendent per sobre de contracte pendent', () => {
    const booking = projectProposalBookingConversionTodayAction(proposalBookingAction({ score: 120, band: 'ALTA' }));
    const contract = projectContractWorkflowTodayAction(contractWorkflowAction({ score: 108, band: 'ALTA' }));
    const actions = projectAdminTodayActions([], [], 2, [contract, booking]);

    expect(actions.map((action) => action.id)).toEqual([
      'document-proposal-booking-prop-booking-1',
      'document-contract-prop-contract-1',
    ]);
  });

  it('fa pujar pressupost draft abans del fallback generic del brief', () => {
    const document = projectProposalDraftTodayAction(proposalDraftAction({ score: 76, band: 'MITJANA' }));
    const actions = projectAdminTodayActions([], [briefAction({ label: 'Revisar el dia' })], 3, [document]);

    expect(actions.map((action) => action.source)).toEqual(['document', 'brief']);
    expect(actions[0]).toMatchObject({
      label: 'Revisar pressupost: Cristina',
      badge: 'Pressupost · MITJANA',
    });
  });

  it('no repeteix un fallback del brief si ja hi ha una accio amb el mateix href', () => {
    const actions = projectAdminTodayActions(
      [nbaAction({ href: '/admin/tasks', title: 'Tasca urgent', domain: 'task' })],
      [briefAction({ href: '/admin/tasks', label: 'Tancar tasques vençudes' })],
      3,
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      source: 'nba',
      href: '/admin/tasks',
      label: 'Tasca urgent',
    });
  });

  it('projecta risc economic del proper bolo com a accio executiva', () => {
    const action = projectNextEventEconomicTodayAction({
      bookingId: 'book-eco',
      href: '/admin/bookings/book-eco',
      clientName: 'Laia',
      daysUntil: 1,
      marginPct: 18,
      netMargin: 120,
      outstandingAmount: 420,
    });

    expect(action).toMatchObject({
      id: 'economic-next-event-book-eco',
      href: '/admin/bookings/book-eco',
      label: 'Revisar marge i caixa: Laia',
      badge: 'Economia · CRÍTIC',
      badgeClass: 'ap-badge ap-badge--danger',
      source: 'economic',
      sourceId: 'book-eco',
    });
    expect(action?.detail).toContain('marge 18%');
    expect(action?.detail).toContain('pendent');
    expect(action?.detail).toContain('bolo demà');
  });

  it('no projecta economia si marge i caixa ja estan sans', () => {
    const action = projectNextEventEconomicTodayAction({
      bookingId: 'book-ok',
      href: '/admin/bookings/book-ok',
      clientName: 'Marc',
      daysUntil: 8,
      marginPct: 52,
      netMargin: 420,
      outstandingAmount: 0,
    });

    expect(action).toBeNull();
  });

  it('projecta caixa pendent dins la finestra economica de 7 dies', () => {
    const action = projectNextEventEconomicTodayAction({
      bookingId: 'book-week',
      href: '/admin/bookings/book-week',
      clientName: 'Nora',
      daysUntil: 6,
      marginPct: 52,
      netMargin: 420,
      outstandingAmount: 300,
    });

    expect(action).toMatchObject({
      id: 'economic-next-event-book-week',
      label: 'Cobrar pendent: Nora',
      badge: 'Economia · risc',
      badgeClass: 'ap-badge ap-badge--warning',
      source: 'economic',
    });
    expect(action?.detail).toContain('pendent');
    expect(action?.detail).toContain('bolo en 6 dies');
  });

  it('no projecta caixa pendent fora de la finestra economica de 7 dies', () => {
    const action = projectNextEventEconomicTodayAction({
      bookingId: 'book-late',
      href: '/admin/bookings/book-late',
      clientName: 'Pau',
      daysUntil: 8,
      marginPct: 52,
      netMargin: 420,
      outstandingAmount: 300,
    });

    expect(action).toBeNull();
  });

  it('fa pujar economia critica per sobre de NBA alt no critic', () => {
    const economic = projectNextEventEconomicTodayAction({
      bookingId: 'book-eco',
      href: '/admin/bookings/book-eco',
      clientName: 'Laia',
      daysUntil: 0,
      marginPct: 20,
      netMargin: 90,
      outstandingAmount: 500,
    });

    const actions = projectAdminTodayActions([
      nbaAction({ id: 'nba-critical', urgency: 'CRITICAL', score: 150 }),
      nbaAction({ id: 'nba-high', urgency: 'HIGH', score: 95 }),
      nbaAction({ id: 'nba-medium', urgency: 'MEDIUM', score: 65 }),
    ], [], 3, economic ? [economic] : []);

    expect(actions.map((action) => action.source)).toEqual(['nba', 'economic', 'nba']);
    expect(actions.map((action) => action.id)).toEqual([
      'nba-critical',
      'economic-next-event-book-eco',
      'nba-high',
    ]);
  });
});
