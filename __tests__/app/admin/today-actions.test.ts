import { describe, expect, it } from 'vitest';

import { projectAdminTodayActions, projectNextEventEconomicTodayAction, projectPostEventTodayAction } from '@/app/admin/lib/today-actions';
import type { BriefAction } from '@/lib/services/dailyBriefService';
import type { NextBestAction } from '@/lib/services/nextBestActionService';

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
