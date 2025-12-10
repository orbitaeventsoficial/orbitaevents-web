/**
 * SUPABASE CLIENT
 * ================
 * Client centralitzat per connectar amb Supabase
 * Esquema actualitzat amb UUID i taules completes
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuració
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export type EventType =
  | 'boda'
  | 'cumpleaños'
  | 'corporativo'
  | 'comunion'
  | 'bautizo'
  | 'fiesta'
  | 'festival'
  | 'otro';

export type PackType = 'esencial' | 'premium' | 'deluxe' | 'custom';

export type EventStatus = 'lead' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';

export type TestimonialStatus = 'pending' | 'approved' | 'rejected' | 'featured';

export interface Customer {
  id: string;
  email: string;
  name?: string | null;
  name_normalized?: string | null;
  phone?: string | null;
  phone_normalized?: string | null;
  city?: string | null;
  instagram?: string | null;
  how_found_us?: string | null;
  consent_marketing: boolean;
  consent_marketing_date?: string | null;
  consent_data_processing: boolean;
  consent_data_processing_date?: string | null;
  total_events: number;
  total_spent: number;
  average_rating?: number | null;
  is_vip: boolean;
  first_contact_date: string;
  last_contact_date: string;
  last_event_date?: string | null;
  notes?: string | null;
  tags: string[];
  data_anonymized: boolean;
  anonymized_at?: string | null;
  deletion_requested_at?: string | null;
  deletion_scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  customer_id?: string | null;
  event_type: EventType;
  event_date?: string | null;
  event_time?: string | null;
  event_location?: string | null;
  venue_name?: string | null;
  pack_type?: PackType | null;
  guests_count?: number | null;
  duration_hours?: number | null;
  quote_amount?: number | null;
  final_amount?: number | null;
  deposit_paid: boolean;
  deposit_amount?: number | null;
  fully_paid: boolean;
  status: EventStatus;
  notes?: string | null;
  special_requests?: string | null;
  photos: string[];
  video_url?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Testimonial {
  id: string;
  customer_id?: string | null;
  event_id?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  photo_url?: string | null;
  photo_thumbnail_url?: string | null;
  consent_photo_publication: boolean;
  status: TestimonialStatus;
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  canvas_url?: string | null;
  canvas_generated_at?: string | null;
  discount_code?: string | null;
  submitted_name?: string | null;
  submitted_email?: string | null;
  submitted_city?: string | null;
  submitted_event_type?: string | null;
  submitted_event_date?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  source: 'testimonial' | 'referral' | 'promo' | 'manual';
  testimonial_id?: string | null;
  customer_id?: string | null;
  valid_from: string;
  valid_until?: string | null;
  max_uses: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  customer_id: string;
  consent_type: string;
  granted: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  source: string;
  legal_text_version: string;
  legal_text_hash?: string | null;
  created_at: string;
  expires_at?: string | null;
  raw_request?: Record<string, unknown> | null;
}

export interface DataRequest {
  id: string;
  email: string;
  customer_id?: string | null;
  request_type: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection' | 'withdraw_consent';
  description?: string | null;
  fields_affected?: string[] | null;
  verification_method?: string | null;
  verification_code?: string | null;
  verification_expires_at?: string | null;
  verified_at?: string | null;
  status: 'pending' | 'verified' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  rejection_reason?: string | null;
  response_notes?: string | null;
  response_file_url?: string | null;
  created_at: string;
  processed_at?: string | null;
  completed_at?: string | null;
  deadline_at?: string | null;
  processed_by?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface AuditLog {
  id: string;
  actor_type: 'customer' | 'admin' | 'system' | 'api';
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  description?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════

// Placeholder client per quan no hi ha configuració
const createPlaceholderClient = (): SupabaseClient => {
  const handler = {
    get: () => () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
  };
  return new Proxy({} as SupabaseClient, handler);
};

/**
 * Client públic - Per operacions del frontend
 */
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createPlaceholderClient();

/**
 * Client admin - Per operacions del servidor
 * Bypassa RLS
 */
export const supabaseAdmin: SupabaseClient = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : createPlaceholderClient();

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generar codi de descompte personalitzat
 */
export function generateDiscountCode(name: string, percent: number = 10): string {
  const cleanName = (name || 'ORBITA')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '')
    .substring(0, 6);

  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${percent}${random}`;
}

// Re-export normalization functions from centralized module
export {
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeInstagram,
  capitalizeName,
} from '@/lib/utils/normalize';

export default supabase;
