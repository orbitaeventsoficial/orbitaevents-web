import type { HubStatus } from './dto';

type CustomerHubTone = {
  bg: string;
  text: string;
  border: string;
};

export function labelEstatReserva(status: string): string {
  if (status === 'CONFIRMED') return 'Confirmada';
  if (status === 'TENTATIVE') return 'Pendent';
  if (status === 'CANCELLED') return 'Cancel·lada';
  if (status === 'COMPLETED') return 'Completada';
  if (status === 'PREPARING') return 'En preparació';
  return status;
}

export function labelEstatPressupost(status: string): string {
  if (status === 'DRAFT') return 'Esborrany';
  if (status === 'SENT') return 'Enviat';
  if (status === 'VIEWED') return 'Llegit';
  if (status === 'ACCEPTED') return 'Acceptat';
  if (status === 'REJECTED') return 'Rebutjat';
  if (status === 'EXPIRED') return 'Caducat';
  return status;
}

export function labelEstatClient(status: string): string {
  if (status === 'CONFIRMED') return 'Confirmat';
  if (status === 'NEGOTIATION') return 'En negociació';
  if (status === 'POSTEVENT') return 'Post-esdeveniment';
  if (status === 'LOST') return 'Perdut';
  return 'Entrada';
}


export const CUSTOMER_HUB_STAGE_ORDER: HubStatus[] = ['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST'];

export const CUSTOMER_HUB_STAGE_LABELS: Record<HubStatus, string> = {
  LEAD: 'Entrada',
  NEGOTIATION: 'Negociació',
  CONFIRMED: 'Confirmat',
  POSTEVENT: 'Post-esdeveniment',
  LOST: 'Perdut',
};

export const CUSTOMER_HUB_STATUS_TONES: Record<HubStatus | 'default', CustomerHubTone> = {
  CONFIRMED: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
  },
  NEGOTIATION: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
  },
  POSTEVENT: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-300',
    border: 'border-indigo-500/40',
  },
  LOST: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
  },
  LEAD: {
    bg: 'bg-white/10',
    text: 'text-white/70',
    border: 'border-white/15',
  },
  default: {
    bg: 'bg-white/10',
    text: 'text-white/70',
    border: 'border-white/15',
  },
};

export const CUSTOMER_HUB_AVATAR_TONES: Record<HubStatus | 'default', string> = {
  LEAD: 'bg-gradient-to-br from-white/20 to-white/5',
  NEGOTIATION: 'bg-gradient-to-br from-amber-500/30 to-amber-600/10',
  CONFIRMED: 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/10',
  POSTEVENT: 'bg-gradient-to-br from-indigo-500/30 to-indigo-600/10',
  LOST: 'bg-gradient-to-br from-rose-500/30 to-rose-600/10',
  default: 'bg-gradient-to-br from-white/20 to-white/5',
};
