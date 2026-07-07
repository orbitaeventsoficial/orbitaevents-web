import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { buildSocialWorkspaceHref } from '@/lib/admin/socialWorkspaceHref';
import { getEventLabel } from '@/lib/constants';
import type { PlaybookActionKey, PlaybookItem } from '@/lib/services/postEventPlaybookService';

export type PreparedPostEventAction = {
  key: PlaybookActionKey;
  title: string;
  detail: string;
  draft: string;
  ctaLabel: string;
  href: string;
  safetyLabel: string;
};

type PostEventActionItem = Pick<
  PlaybookItem,
  'bookingId' | 'customerId' | 'nextAction' | 'clientName' | 'eventType' | 'eventLocation' | 'daysSinceEvent'
>;

export function buildPostEventNextActionHref(item: Pick<PlaybookItem, 'bookingId' | 'customerId' | 'nextAction'>): string {
  switch (item.nextAction?.key) {
    case 'thank_you':
      return `${buildBookingHref(item.bookingId)}#sec-client`;
    case 'testimonial':
      return item.customerId
        ? buildCustomerWorkspaceTabHref(item.customerId, 'comms')
        : `${buildBookingHref(item.bookingId)}#sec-client`;
    case 'social_post':
      return buildSocialWorkspaceHref();
    case 'referral_ask':
      return '/admin/clientes/referrals';
    default:
      return '/admin/post-event/playbook';
  }
}

export function buildPreparedPostEventAction(item: PostEventActionItem): PreparedPostEventAction | null {
  if (!item.nextAction) return null;

  const href = buildPostEventNextActionHref(item);
  const firstName = getFirstName(item.clientName);
  const eventLabel = getEventLabel(item.eventType);
  const location = cleanText(item.eventLocation);
  const eventContext = location ? `${eventLabel} a ${location}` : eventLabel;
  const ageLabel = item.daysSinceEvent === 1 ? 'fa 1 dia' : `fa ${item.daysSinceEvent} dies`;
  const safetyLabel = 'Preparat, no enviat';

  switch (item.nextAction.key) {
    case 'thank_you':
      return {
        key: item.nextAction.key,
        title: 'Agraiment post-event',
        detail: `Revisa i envia des de la reserva; el bolo va ser ${ageLabel}.`,
        draft: `Hola ${firstName}, moltes gracies per confiar en Orbita per ${eventContext}. Espero que tot anes genial; qualsevol detall que vulguis comentar em servira per millorar.`,
        ctaLabel: 'Obrir reserva',
        href,
        safetyLabel,
      };
    case 'testimonial':
      return {
        key: item.nextAction.key,
        title: 'Testimoni curt',
        detail: 'Demana una frase aprofitable i verificable des de comunicacions del client.',
        draft: `Hola ${firstName}, si et va agradar ${eventContext}, em serviria molt un testimoni curt de 2 o 3 linies sobre l'experiencia.`,
        ctaLabel: item.customerId ? 'Obrir comunicacions' : 'Obrir reserva',
        href,
        safetyLabel,
      };
    case 'social_post':
      return {
        key: item.nextAction.key,
        title: 'Idea social segura',
        detail: 'Prepara la peça a Social; no publiquis noms ni imatges sense revisio i consentiment.',
        draft: `${eventContext}: so, llum i ritme per tancar una nit rodona. Contingut pendent de revisar abans de publicar.`,
        ctaLabel: 'Obrir Social',
        href,
        safetyLabel,
      };
    case 'referral_ask':
      return {
        key: item.nextAction.key,
        title: 'Referral segur',
        detail: 'Registra el moviment al programa de referrals abans de reactivar el client.',
        draft: `Hola ${firstName}, si coneixes algu que estigui preparant un esdeveniment similar, em pots passar el contacte o fer-nos la presentacio.`,
        ctaLabel: 'Obrir referrals',
        href,
        safetyLabel,
      };
    default:
      return null;
  }
}

function getFirstName(name: string): string {
  const trimmed = cleanText(name);
  if (!trimmed) return 'client';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function cleanText(value: string | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}
