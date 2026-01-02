// app/types/index.ts

// Re-exportar tipos de packs-config
export type { ServiceSlug, PackDefinition, ExtraDefinition } from '@/config/packs-config';

// Tipos de formularios
export interface ContactFormData {
  name: string;
  contact: string;
  event: string;
  message?: string;
  // Campos del configurador
  packId?: string;
  packName?: string;
  estimatedPrice?: number;
  eventDate?: string;
  guests?: number;
  extras?: string[];
}

// Tipos de API responses
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StatsData {
  eventsCompleted: number;
  eventsThisYear: number;
  eventsThisMonth: number;
  eventsNext90Days: number;
  clientsTotal: number;
  blockedDaysTotal: number;
  blockedDaysNext90Days: number;
  nextEvent: {
    id: string;
    fechaEvento: string;
    clienteNombre: string | null;
  } | null;
  experiencia: {
    años: number;
    display: string;
  };
}

export interface CalendarDay {
  fecha: string;
  reservas: Array<{
    id: string;
    fechaEvento: string;
    clienteNombre?: string | null;
    estado?: string | null;
  }>;
  bloqueos: Array<{
    id: string;
    fecha: string;
    motivo?: string | null;
  }>;
  disponible: boolean;
}

// Tipos de eventos de analytics
export type AnalyticsEvent =
  | 'page_view'
  | 'lead_form_submit'
  | 'configurador_start'
  | 'configurador_complete'
  | 'whatsapp_click'
  | 'phone_click'
  | 'pack_select'
  | 'extra_toggle'
  | 'cta_click';

export interface AnalyticsEventData {
  page?: string;
  pack_id?: string;
  pack_name?: string;
  price?: number;
  event_type?: string;
  source?: string;
  [key: string]: unknown;
}

// Extensiones de tipos globales del navegador
declare global {
  interface Window {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

// Export necesario para que TypeScript trate esto como un módulo
export {};
