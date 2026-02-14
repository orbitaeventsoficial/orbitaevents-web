// lib/constants/labels.ts
// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES CENTRALIZADAS - LABELS Y ETIQUETAS
// ═══════════════════════════════════════════════════════════════════════════
//
// Este archivo centraliza todas las constantes de etiquetas que estaban
// duplicadas en múltiples archivos del proyecto.
//
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Etiquetas de tipos de eventos
 * Usadas en: contact route, inbox, notifications, reviews
 */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Casament',
  birthday: 'Aniversari',
  corporate: 'Empresarial',
  private_party: 'Festa privada',
  themed_party: 'Festa temàtica',
  christening: 'Bateig',
  communion: 'Comunió',
  other: 'Altre',
} as const;

/**
 * Etiquetas de fuentes de leads
 * Usadas en: notifications, analytics
 */
export const SOURCE_LABELS: Record<string, string> = {
  website: 'Web',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  wallapop: 'Wallapop',
  referral: 'Referència',
  google: 'Google',
  other: 'Altre',
} as const;

/**
 * Etiquetas de estado de leads
 */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Nou',
  contacted: 'Contactat',
  qualified: 'Qualificat',
  proposal_sent: 'Proposta enviada',
  negotiation: 'Negociació',
  won: 'Guanyat',
  lost: 'Perdut',
  archived: 'Arxivat',
} as const;

/**
 * Etiquetas de estado de bookings
 */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendent',
  confirmed: 'Confirmat',
  in_progress: 'En curs',
  completed: 'Completat',
  cancelled: 'Cancel·lat',
} as const;

/**
 * Tipos de eventos (TypeScript types)
 */
export type EventType = keyof typeof EVENT_TYPE_LABELS;
export type LeadSource = keyof typeof SOURCE_LABELS;
export type LeadStatus = keyof typeof LEAD_STATUS_LABELS;
export type BookingStatus = keyof typeof BOOKING_STATUS_LABELS;
