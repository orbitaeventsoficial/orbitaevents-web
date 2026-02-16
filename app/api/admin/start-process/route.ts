/**
 * API ROUTE: Start Process
 * ========================
 * POST - Iniciar un procés per un client
 * Tipus: review_request, post_event, welcome, promo
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, sendTestimonialApprovedEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Check if Supabase is configured
function checkSupabase() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }
  return null;
}

// Verificar autenticació admin
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  if (authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, 'base64').toString();
    const [user, pass] = decoded.split(':');
    return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
  }

  if (authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    return key === process.env.ADMIN_KEY;
  }

  return false;
}

/**
 * POST - Iniciar procés
 */
export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const dbError = checkSupabase();
  if (dbError) return dbError;

  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, bookingId, processType } = body;

    if (!customerId || !processType) {
      return NextResponse.json(
        { error: 'customerId i processType són obligatoris' },
        { status: 400 }
      );
    }

    // Obtenir client (només camps necessaris)
    const { data: customer, error: customerError } = await supabaseAdmin!
      .from('customers')
      .select('id, email, name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Client no trobat' }, { status: 404 });
    }

    // Executar procés segons tipus
    let result;

    switch (processType) {
      case 'review_request':
        result = await sendReviewRequestEmail(customer);
        break;

      case 'post_event':
        result = await sendPostEventSequence(customer, bookingId);
        break;

      case 'welcome':
        result = await sendWelcomeEmail(customer);
        break;

      case 'promo':
        result = await sendPromoEmail(customer);
        break;

      default:
        return NextResponse.json(
          { error: `Tipus de procés desconegut: ${processType}` },
          { status: 400 }
        );
    }

    // Actualitzar última data de contacte
    await supabaseAdmin!
      .from('customers')
      .update({
        last_contact_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    return NextResponse.json({
      success: true,
      processType,
      result,
    });
  } catch (error) {
    log.error('Error iniciant procés:', error);
    return NextResponse.json({ error: 'Error iniciant procés' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS DE PROCÉS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enviar email de sol·licitud d'opinió
 */
async function sendReviewRequestEmail(customer: { name: string; email: string }, locale = 'ca') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
  const reviewUrl = `${baseUrl}/${locale}/opiniones/nueva`;

  await sendEmail({
    to: customer.email,
    subject: `${customer.name}, ens agradaria saber la teva opinió! ⭐`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FFB800, #CC9600); padding: 40px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">ÒRBITA EVENTS</h1>
          </div>

          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #FFB800; margin-top: 0;">Hola ${customer.name.split(' ')[0]}!</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              Esperem que el teu esdeveniment hagi anat genial! 🎉
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Ens encantaria conèixer la teva experiència. La teva opinió ens ajuda a millorar i a arribar a més persones.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Com a agraïment, rebràs un <strong style="color: #FFB800;">descompte de fins al 25%</strong> per al teu pròxim esdeveniment!
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}"
                 style="background: linear-gradient(135deg, #FFB800, #CC9600);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                ⭐ Deixar la meva opinió
              </a>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center;">
              Només et portarà 2 minuts!
            </p>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Òrbita Events
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { emailSent: true, type: 'review_request' };
}

/**
 * Enviar seqüència post-event completa
 */
async function sendPostEventSequence(
  customer: { name: string; email: string },
  bookingId?: string
) {
  // 1. Generar codi de descompte personalitzat
  const cleanName = (customer.name || 'CLIENT')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '')
    .substring(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const discountCode = `${cleanName}10${random}`;

  // 2. Guardar codi a Supabase (si tenim bookingId)
  if (bookingId && supabaseAdmin) {
    await supabaseAdmin.from('discount_codes').insert({
      code: discountCode,
      discount_percent: 10,
      source: 'post_event',
      max_uses: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }

  // 3. Enviar email amb canvas
  await sendTestimonialApprovedEmail({
    to: customer.email,
    name: customer.name,
    rating: 5, // Assumim rating 5 per post-event
    discountCode,
    discountPercent: 10,
  });

  return { emailSent: true, type: 'post_event', discountCode };
}

/**
 * Enviar email de benvinguda
 */
async function sendWelcomeEmail(customer: { name: string; email: string }, locale = 'ca') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
  const websiteUrl = `${baseUrl}/${locale}`;

  await sendEmail({
    to: customer.email,
    subject: `Benvingut/da a Òrbita Events, ${customer.name.split(' ')[0]}! 🪐`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FFB800, #CC9600); padding: 40px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">BENVINGUT/DA! 🎉</h1>
          </div>

          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #FFB800; margin-top: 0;">Hola ${customer.name.split(' ')[0]}!</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              Gràcies per confiar en Òrbita Events per als teus esdeveniments especials.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Som especialistes en crear experiències úniques amb DJ professional, il·luminació espectacular i efectes especials.
            </p>

            <div style="background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #FFB800; margin: 0 0 12px 0;">Els nostres serveis:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #ccc;">
                <li>🎵 DJ Professional</li>
                <li>💡 Il·luminació i efectes</li>
                <li>🎤 So d'alta qualitat</li>
                <li>🎪 Producció tècnica</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${websiteUrl}"
                 style="background: linear-gradient(135deg, #FFB800, #CC9600);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                Veure els nostres serveis
              </a>
            </div>

            <p style="font-size: 14px; color: #888; text-align: center;">
              Qualsevol dubte, contacta'ns a ${SITE_CONFIG.business.phone}
            </p>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Òrbita Events
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { emailSent: true, type: 'welcome' };
}

/**
 * Enviar email promocional
 */
async function sendPromoEmail(customer: { name: string; email: string }) {
  // Generar codi promocional
  const promoCode = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  await sendEmail({
    to: customer.email,
    subject: `🎁 Oferta exclusiva per tu, ${customer.name.split(' ')[0]}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FF6B00, #FFB800); padding: 40px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 28px;">OFERTA EXCLUSIVA 🎁</h1>
          </div>

          <div style="padding: 30px; color: #e5e5e5; text-align: center;">
            <h2 style="color: #FFB800; margin-top: 0;">Hola ${customer.name.split(' ')[0]}!</h2>

            <p style="font-size: 16px; line-height: 1.6;">
              Tenim una oferta especial per tu!
            </p>

            <div style="background: rgba(255,184,0,0.1); border: 2px solid #FFB800; border-radius: 16px; padding: 30px; margin: 24px 0;">
              <p style="color: #FFB800; margin: 0 0 12px 0; font-size: 14px;">EL TEU CODI:</p>
              <p style="font-size: 36px; font-weight: bold; color: #FFB800; margin: 0; letter-spacing: 4px;">
                ${promoCode}
              </p>
              <p style="font-size: 24px; font-weight: bold; color: #fff; margin: 16px 0 0 0;">
                15% DESCOMPTE
              </p>
              <p style="color: #888; font-size: 12px; margin: 12px 0 0 0;">
                Vàlid durant 30 dies
              </p>
            </div>

            <p style="font-size: 14px; color: #888;">
              Contacta'ns per reservar el teu pròxim esdeveniment!
            </p>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Òrbita Events
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return { emailSent: true, type: 'promo', promoCode };
}
