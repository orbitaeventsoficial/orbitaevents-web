/**
 * CUSTOMER SERVICE - Supabase Version
 * =====================================
 * Gestió de clients amb Supabase
 * Esquema actualitzat amb UUID
 */

import {
  supabaseAdmin,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeInstagram,
  capitalizeName,
  type Customer,
} from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export interface UpsertCustomerInput {
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  instagram?: string;
  howFoundUs?: string;
  consentMarketing?: boolean;
  consentDataProcessing?: boolean;
  source?: string;
}

export interface UpsertCustomerResult {
  customer: Customer;
  isNew: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Buscar client per email
 */
// Camps essencials per a consultes de customers
const CUSTOMER_SELECT_FIELDS = 'id, email, name, name_normalized, phone, phone_normalized, city, instagram, how_found_us, is_vip, consent_marketing, consent_marketing_date, consent_data_processing, consent_data_processing_date, total_events, first_contact_date, last_contact_date, created_at, updated_at';

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  if (!supabaseAdmin) return null;
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select(CUSTOMER_SELECT_FIELDS)
    .eq('email', normalizedEmail)
    .single();

  if (error || !data) return null;
  return data as Customer;
}

/**
 * Crear o actualitzar client
 */
export async function upsertCustomer(input: UpsertCustomerInput): Promise<UpsertCustomerResult> {
  if (!supabaseAdmin) {
    throw new Error('Database not configured');
  }
  const normalizedEmail = normalizeEmail(input.email);

  // Buscar si ja existeix
  const existing = await findCustomerByEmail(normalizedEmail);

  if (existing) {
    // Actualitzar
    const updateData: Record<string, unknown> = {
      last_contact_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Actualitzar només camps nous
    if (input.name && !existing.name) {
      updateData.name = capitalizeName(input.name);
      updateData.name_normalized = normalizeName(input.name);
    }
    if (input.phone && !existing.phone) {
      updateData.phone = input.phone;
      updateData.phone_normalized = normalizePhone(input.phone);
    }
    if (input.city && !existing.city) {
      updateData.city = input.city;
    }
    if (input.instagram && !existing.instagram) {
      updateData.instagram = normalizeInstagram(input.instagram);
    }
    if (input.howFoundUs && !existing.how_found_us) {
      updateData.how_found_us = input.howFoundUs;
    }

    // Actualitzar consentiments si són nous
    if (input.consentMarketing && !existing.consent_marketing) {
      updateData.consent_marketing = true;
      updateData.consent_marketing_date = new Date().toISOString();
    }
    if (input.consentDataProcessing && !existing.consent_data_processing) {
      updateData.consent_data_processing = true;
      updateData.consent_data_processing_date = new Date().toISOString();
    }

    const { data: updated } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    return {
      customer: (updated as Customer) || existing,
      isNew: false,
    };
  }

  // Crear nou client
  const now = new Date().toISOString();
  const customerData = {
    email: normalizedEmail,
    name: input.name ? capitalizeName(input.name) : null,
    name_normalized: input.name ? normalizeName(input.name) : null,
    phone: input.phone || null,
    phone_normalized: input.phone ? normalizePhone(input.phone) : null,
    city: input.city || null,
    instagram: input.instagram ? normalizeInstagram(input.instagram) : null,
    how_found_us: input.howFoundUs || null,
    consent_marketing: input.consentMarketing || false,
    consent_marketing_date: input.consentMarketing ? now : null,
    consent_data_processing: input.consentDataProcessing || false,
    consent_data_processing_date: input.consentDataProcessing ? now : null,
    first_contact_date: now,
    last_contact_date: now,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error } = await supabaseAdmin
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creant client: ${error.message}`);
  }

  return {
    customer: created as Customer,
    isNew: true,
  };
}

/**
 * Obtenir client per ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Customer;
}

/**
 * Buscar clients
 */
export async function searchCustomers(query: string, limit = 20): Promise<Customer[]> {
  if (!supabaseAdmin) return [];
  const normalizedQuery = query.toLowerCase().trim();

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .or(`email.ilike.%${normalizedQuery}%,name_normalized.ilike.%${normalizedQuery}%,phone_normalized.ilike.%${normalizedQuery}%`)
    .limit(limit);

  if (error) return [];
  return (data as Customer[]) || [];
}

/**
 * Obtenir tots els clients
 */
export async function getAllCustomers(limit = 100): Promise<Customer[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as Customer[]) || [];
}

/**
 * Actualitzar client
 */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return data as Customer;
}

/**
 * Log activitat del client (ara usa audit_log)
 */
export async function logCustomerActivity(
  customerId: string,
  action: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('audit_log').insert({
    actor_type: 'customer',
    actor_id: customerId,
    action,
    resource_type: 'customer',
    resource_id: customerId,
    metadata: details,
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  });
}

/**
 * Registrar consentiment
 */
export async function recordConsent(
  customerId: string,
  consentType: string,
  granted: boolean,
  source: string,
  legalTextVersion: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('consent_records').insert({
    customer_id: customerId,
    consent_type: consentType,
    granted,
    source,
    legal_text_version: legalTextVersion,
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  });
}

/**
 * Obtenir estadístiques de clients
 */
export async function getCustomerStats() {
  if (!supabaseAdmin) return { total: 0, vip: 0, marketing: 0, withEvents: 0 };
  const { data: all } = await supabaseAdmin
    .from('customers')
    .select('id, is_vip, consent_marketing, total_events');

  if (!all) return { total: 0, vip: 0, marketing: 0, withEvents: 0 };

  const total = all.length;
  const vip = all.filter(c => c.is_vip).length;
  const marketing = all.filter(c => c.consent_marketing).length;
  const withEvents = all.filter(c => c.total_events > 0).length;

  return { total, vip, marketing, withEvents };
}
