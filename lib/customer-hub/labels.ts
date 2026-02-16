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

