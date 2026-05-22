import {
  ADMIN_MANUAL_OPERATING_FLOW,
  type AdminManualOperatingFlowStepId,
} from '@/lib/constants/adminManual';
import { formatCurrency } from '@/lib/constants';

export type AdminOperatingCycleTone = 'success' | 'warning' | 'info';

export interface AdminOperatingCycleInput {
  leadsThisMonth: number;
  staleLeadsCount: number;
  quotesInFlightCount: number;
  bookingsConfirmed: number;
  pendingPayments: number;
  postEventPending: number;
}

export interface AdminOperatingCycleStep {
  step: AdminManualOperatingFlowStepId;
  title: string;
  href: string;
  cta: string;
  metric: string;
  detail: string;
  tone: AdminOperatingCycleTone;
}

const cycleCopy: Record<
  AdminManualOperatingFlowStepId,
  (input: AdminOperatingCycleInput) => Pick<AdminOperatingCycleStep, 'metric' | 'detail' | 'tone'>
> = {
  '01': ({ leadsThisMonth }) => ({
    metric: `${leadsThisMonth} entrades`,
    detail: leadsThisMonth > 0
      ? 'Hi ha demanda nova per qualificar abans que es refredi.'
      : 'La captació no està generant entrades noves aquest mes.',
    tone: leadsThisMonth > 0 ? 'success' : 'warning',
  }),
  '02': ({ staleLeadsCount }) => ({
    metric: `${staleLeadsCount} fredes`,
    detail: staleLeadsCount > 0
      ? 'La qualificació té leads sense moviment i pot frenar el cicle.'
      : 'No hi ha leads freds bloquejant la priorització.',
    tone: staleLeadsCount > 0 ? 'warning' : 'success',
  }),
  '03': ({ quotesInFlightCount }) => ({
    metric: `${quotesInFlightCount} pressupostos`,
    detail: quotesInFlightCount > 0
      ? 'Hi ha propostes en joc que demanen seguiment comercial.'
      : 'No hi ha pressupostos actius per convertir ara mateix.',
    tone: quotesInFlightCount > 0 ? 'info' : 'warning',
  }),
  '04': ({ bookingsConfirmed }) => ({
    metric: `${bookingsConfirmed} reserves`,
    detail: bookingsConfirmed > 0
      ? 'Operacions té reserves confirmades per preparar i executar.'
      : 'Encara no hi ha reserves confirmades dins del període.',
    tone: bookingsConfirmed > 0 ? 'success' : 'warning',
  }),
  '05': ({ pendingPayments }) => ({
    metric: formatCurrency(pendingPayments),
    detail: pendingPayments > 0
      ? 'Hi ha cobrament pendent abans de donar el cicle per sa.'
      : 'No hi ha imports pendents destacats.',
    tone: pendingPayments > 0 ? 'warning' : 'success',
  }),
  '06': ({ postEventPending }) => ({
    metric: `${postEventPending} post-event`,
    detail: postEventPending > 0
      ? 'Hi ha tancaments post-event pendents abans de reactivar.'
      : 'El tancament post-event no mostra backlog actiu.',
    tone: postEventPending > 0 ? 'warning' : 'success',
  }),
};

export function buildDashboardOperatingCycle(input: AdminOperatingCycleInput): AdminOperatingCycleStep[] {
  return ADMIN_MANUAL_OPERATING_FLOW.map((flowStep) => ({
    step: flowStep.step,
    title: flowStep.title,
    href: flowStep.entryHref,
    cta: flowStep.entryLabel,
    ...cycleCopy[flowStep.step](input),
  }));
}
