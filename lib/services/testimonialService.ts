/**
 * TESTIMONIAL SERVICE - Supabase Version
 * ========================================
 * Gestió d'opinions/testimonis amb Supabase
 * Esquema actualitzat amb UUID i status en lloc de is_approved
 */

import {
  supabaseAdmin,
  generateDiscountCode,
  type Testimonial,
  type TestimonialStatus,
} from '@/lib/supabase';
import { upsertCustomer, logCustomerActivity } from './customerService';
import { sendTestimonialApprovedEmail } from '@/lib/email';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateTestimonialInput {
  // Dades del client
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  instagram?: string;

  // Testimoni
  comment: string;
  rating: number;
  title?: string;
  eventType?: string;
  eventDate?: string;

  // Media
  photoUrl?: string;
  videoUrl?: string;

  // NPS i recompenses
  npsScore?: number; // 0-10
  allowGoogleShare?: boolean;

  // Verificació booking
  verifiedBookingId?: string;

  // Consentiments
  consentPhotoPublication?: boolean;
  consentDataProcessing: boolean;
  consentMarketing?: boolean;
}

export interface TestimonialResult {
  testimonial: Testimonial;
  discountCode: string;
  isNewCustomer: boolean;
}

export interface TestimonialWithCustomer extends Omit<Testimonial, 'customer'> {
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    city?: string | null;
    instagram?: string | null;
  } | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS PÚBLIQUES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea un nou testimoni des del formulari públic
 */
export async function createTestimonial(
  input: CreateTestimonialInput
): Promise<TestimonialResult> {
  // 1. Crear o actualitzar client
  const { customer, isNew } = await upsertCustomer({
    email: input.email,
    name: input.name,
    phone: input.phone,
    city: input.city,
    instagram: input.instagram,
    consentDataProcessing: input.consentDataProcessing,
    consentMarketing: input.consentMarketing,
    source: 'testimonial_form',
  });

  // 2. Calcular descompte basat en recompenses
  // Base: 5% + foto: 5% + video: 10% + Google: 5% = màx 25%
  let discountPercent = 5; // Base
  if (input.photoUrl) discountPercent += 5;
  if (input.videoUrl) discountPercent += 10;
  if (input.allowGoogleShare) discountPercent += 5;

  // Generar codi de descompte personalitzat
  const discountCode = generateDiscountCode(input.name || 'CLIENT', discountPercent);

  // 3. Crear el testimoni
  const testimonialData = {
    customer_id: customer.id,
    rating: Math.min(5, Math.max(1, input.rating)),
    title: input.title?.trim() || null,
    comment: input.comment.trim(),
    photo_url: input.photoUrl || null,
    video_url: input.videoUrl || null,
    nps_score: input.npsScore ?? null,
    allow_google_share: input.allowGoogleShare ?? false,
    verified_booking_id: input.verifiedBookingId || null,
    consent_photo_publication: input.consentPhotoPublication ?? false,
    status: 'pending' as TestimonialStatus,
    discount_code: discountCode,
    discount_percent: discountPercent,
    submitted_name: input.name || null,
    submitted_email: input.email,
    submitted_city: input.city || null,
    submitted_event_type: input.eventType || null,
    submitted_event_date: input.eventDate || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: testimonial, error } = await supabaseAdmin
    .from('testimonials')
    .insert(testimonialData)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creant testimoni: ${error.message}`);
  }

  // 4. Crear codi de descompte a la taula
  await supabaseAdmin.from('discount_codes').insert({
    code: discountCode,
    discount_percent: discountPercent,
    source: 'testimonial',
    testimonial_id: testimonial!.id,
    customer_id: customer.id,
    max_uses: 1,
    times_used: 0,
    is_active: true,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 any
    created_at: new Date().toISOString(),
  });

  // 5. Log activitat
  await logCustomerActivity(customer.id, 'create', {
    testimonialId: testimonial!.id,
    rating: input.rating,
    npsScore: input.npsScore,
    discountCode,
    discountPercent,
    hasPhoto: !!input.photoUrl,
    hasVideo: !!input.videoUrl,
    allowGoogleShare: input.allowGoogleShare,
  });

  return {
    testimonial: testimonial as Testimonial,
    discountCode,
    isNewCustomer: isNew,
  };
}

/**
 * Obtenir tots els testimonis aprovats (per la web)
 */
export async function getApprovedTestimonials(limit = 20): Promise<TestimonialWithCustomer[]> {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select(
      `
      *,
      customer:customers (
        id,
        name,
        email,
        phone,
        city,
        instagram
      )
    `
    )
    .in('status', ['approved', 'featured'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as TestimonialWithCustomer[]) || [];
}

/**
 * Obtenir testimonis destacats (featured, rating >= 4)
 */
export async function getFeaturedTestimonials(limit = 6): Promise<TestimonialWithCustomer[]> {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select(
      `
      *,
      customer:customers (
        id,
        name,
        email,
        phone,
        city,
        instagram
      )
    `
    )
    .eq('status', 'featured')
    .gte('rating', 4)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as TestimonialWithCustomer[]) || [];
}

/**
 * Obtenir testimonis pendents d'aprovació (per admin)
 */
export async function getPendingTestimonials(): Promise<TestimonialWithCustomer[]> {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select(
      `
      *,
      customer:customers (
        id,
        name,
        email,
        phone,
        city,
        instagram
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as TestimonialWithCustomer[]) || [];
}

/**
 * Obtenir tots els testimonis (per admin)
 */
export async function getAllTestimonials(): Promise<TestimonialWithCustomer[]> {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select(
      `
      *,
      customer:customers (
        id,
        name,
        email,
        phone,
        city,
        instagram
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as TestimonialWithCustomer[]) || [];
}

/**
 * Obtenir un testimoni per ID
 */
export async function getTestimonialById(id: string): Promise<TestimonialWithCustomer | null> {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .select(
      `
      *,
      customer:customers (
        id,
        name,
        email,
        phone,
        city,
        instagram
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as TestimonialWithCustomer;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS ADMIN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Aprovar un testimoni
 * Envia email amb canvas i codi de descompte
 */
export async function approveTestimonial(
  id: string,
  featured = false
): Promise<Testimonial | null> {
  const newStatus: TestimonialStatus = featured ? 'featured' : 'approved';

  // Obtenir testimoni amb dades del client
  const testimonial = await getTestimonialById(id);
  if (!testimonial) return null;

  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .update({
      status: newStatus,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;

  // Log activitat
  if (data.customer_id) {
    await logCustomerActivity(data.customer_id, 'update', {
      testimonialId: id,
      action: 'approved',
      featured,
    });
  }

  // Enviar email amb canvas i codi de descompte
  try {
    const customerEmail = testimonial.customer?.email || testimonial.submitted_email;
    const customerName = testimonial.customer?.name || testimonial.submitted_name || 'Client';
    const discountCode = testimonial.discount_code;
    // Obtenir el percentatge del testimoni o usar 10% per defecte
    const discountPercent = (testimonial as unknown as { discount_percent?: number }).discount_percent || 10;

    if (customerEmail && discountCode) {
      await sendTestimonialApprovedEmail({
        to: customerEmail,
        name: customerName,
        rating: testimonial.rating,
        discountCode,
        discountPercent,
        eventType: testimonial.submitted_event_type || undefined,
      });
      console.log(`Email enviat a ${customerEmail} amb codi ${discountCode} (${discountPercent}%)`);
    }
  } catch (emailError) {
    // Log error però no fallar l'aprovació
    console.error('Error enviant email d\'aprovació:', emailError);
  }

  return data as Testimonial;
}

/**
 * Rebutjar un testimoni
 */
export async function rejectTestimonial(
  id: string,
  reason?: string
): Promise<Testimonial | null> {
  const { data, error } = await supabaseAdmin
    .from('testimonials')
    .update({
      status: 'rejected' as TestimonialStatus,
      rejection_reason: reason || 'Rebutjat per admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;

  // Log activitat
  if (data.customer_id) {
    await logCustomerActivity(data.customer_id, 'update', {
      testimonialId: id,
      action: 'rejected',
      reason,
    });
  }

  return data as Testimonial;
}

/**
 * Eliminar un testimoni
 */
export async function deleteTestimonial(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from('testimonials').delete().eq('id', id);
  return !error;
}

/**
 * Marcar/desmarcar com a destacat
 * Utilitza updates condicionals per evitar race conditions
 */
export async function toggleFeatured(id: string): Promise<Testimonial | null> {
  // Primer intentar canviar featured -> approved
  const { data: unfeatured, error: err1 } = await supabaseAdmin
    .from('testimonials')
    .update({
      status: 'approved' as TestimonialStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'featured')
    .select()
    .single();

  if (!err1 && unfeatured) {
    return unfeatured as Testimonial;
  }

  // Si no era featured, intentar approved -> featured
  const { data: featured, error: err2 } = await supabaseAdmin
    .from('testimonials')
    .update({
      status: 'featured' as TestimonialStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'approved')
    .select()
    .single();

  if (!err2 && featured) {
    return featured as Testimonial;
  }

  return null;
}

/**
 * Obtenir estadístiques de testimonis
 */
export async function getTestimonialStats() {
  const { data: all } = await supabaseAdmin
    .from('testimonials')
    .select('id, status, rating');

  if (!all) return { total: 0, pending: 0, approved: 0, featured: 0, avgRating: 0 };

  const total = all.length;
  const pending = all.filter(t => t.status === 'pending').length;
  const approved = all.filter(t => t.status === 'approved' || t.status === 'featured').length;
  const featured = all.filter(t => t.status === 'featured').length;
  const approvedItems = all.filter(t => t.status === 'approved' || t.status === 'featured');
  const avgRating =
    approvedItems.length > 0
      ? approvedItems.reduce((acc, t) => acc + t.rating, 0) / approvedItems.length
      : 0;

  return {
    total,
    pending,
    approved,
    featured,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}
