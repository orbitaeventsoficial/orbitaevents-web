/**
 * Email Service - Servei centralitzat d'enviament d'emails
 * Utilitzat per totes les APIs que necessiten enviar emails
 */

import nodemailer from 'nodemailer';
import { SITE_CONFIG } from '@/app/config/site-config';

// IP directa del servidor SMTP de Don Dominio (evita problemes DNS a Vercel)
const DONDOMINIO_SMTP_IP = '31.214.176.11';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

/**
 * Crear transporter de nodemailer
 */
function createTransporter() {
  // Trim all env vars to remove any trailing newlines from Vercel env
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = parseInt((process.env.SMTP_PORT || '587').trim());
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

/**
 * Enviar email
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();

  // Trim all env vars and options to remove any trailing newlines
  const smtpFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  const fromAddress = options.from?.trim() || `"Òrbita Events" <${smtpFrom}>`;
  const toAddress = options.to.trim();

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo?.trim(),
  });
}

/**
 * Enviar email de verificació per sol·licituds RGPD
 */
export async function sendPrivacyVerificationEmail(params: {
  to: string;
  name: string;
  requestType: string;
  requestId: string;
  verificationToken: string;
  legalDeadline: Date;
}): Promise<void> {
  const { to, name, requestType, requestId, verificationToken, legalDeadline } = params;

  const REQUEST_TYPE_LABELS: Record<string, string> = {
    ACCESS: "Dret d'Accés",
    RECTIFICATION: 'Dret de Rectificació',
    ERASURE: 'Dret de Supressió',
    RESTRICTION: 'Dret de Limitació',
    PORTABILITY: 'Dret de Portabilitat',
    OBJECTION: "Dret d'Oposició",
    AUTOMATED: 'Decisions Automatitzades',
  };

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com'}/api/privacy/verify?token=${verificationToken}`;
  const requestLabel = REQUEST_TYPE_LABELS[requestType] || requestType;

  await sendEmail({
    to,
    subject: `Verifica la teva sol·licitud de ${requestLabel} - Òrbita Events`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #DAA520, #B8860B); padding: 30px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 24px;">Òrbita Events</h1>
            <p style="color: rgba(0,0,0,0.7); margin: 8px 0 0 0; font-size: 14px;">Portal de Privacitat</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #DAA520; margin-top: 0;">Verifica la teva sol·licitud</h2>

            <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${name}</strong>,</p>

            <p style="font-size: 16px; line-height: 1.6;">
              Hem rebut la teva sol·licitud de <strong style="color: #DAA520;">${requestLabel}</strong>.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Per verificar la teva identitat i processar la sol·licitud, fes clic al següent botó:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background: linear-gradient(135deg, #DAA520, #B8860B);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                Verificar Sol·licitud
              </a>
            </div>

            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
              Aquest enllaç és vàlid durant <strong>7 dies</strong>.
              Si no has sol·licitat això, pots ignorar aquest email.
            </p>

            <!-- Info Box -->
            <div style="background: rgba(218,165,32,0.1); border: 1px solid rgba(218,165,32,0.3); border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #a3a3a3;">
                <strong style="color: #DAA520;">Referència:</strong> ${requestId}
              </p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                <strong style="color: #DAA520;">Termini legal de resposta:</strong> ${legalDeadline.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <!-- Alternative link -->
            <p style="color: #666; font-size: 12px; word-break: break-all;">
              Si el botó no funciona, copia i enganxa aquest enllaç al navegador:<br>
              <a href="${verificationUrl}" style="color: #DAA520;">${verificationUrl}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Òrbita Events. Tots els drets reservats.
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
              Aquest email ha estat enviat en resposta a una sol·licitud RGPD.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Enviar email de confirmació quan la sol·licitud ha estat processada
 */
export async function sendPrivacyRequestCompletedEmail(params: {
  to: string;
  name: string;
  requestType: string;
  result: 'approved' | 'rejected';
  notes?: string;
  downloadUrl?: string;
}): Promise<void> {
  const { to, name, requestType, result, notes, downloadUrl } = params;

  const REQUEST_TYPE_LABELS: Record<string, string> = {
    ACCESS: "Dret d'Accés",
    RECTIFICATION: 'Dret de Rectificació',
    ERASURE: 'Dret de Supressió',
    RESTRICTION: 'Dret de Limitació',
    PORTABILITY: 'Dret de Portabilitat',
    OBJECTION: "Dret d'Oposició",
    AUTOMATED: 'Decisions Automatitzades',
  };

  const requestLabel = REQUEST_TYPE_LABELS[requestType] || requestType;
  const isApproved = result === 'approved';

  await sendEmail({
    to,
    subject: `${isApproved ? '✅' : '❌'} Sol·licitud de ${requestLabel} ${isApproved ? 'processada' : 'rebutjada'} - Òrbita Events`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: ${isApproved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">
              ${isApproved ? '✅ Sol·licitud Processada' : '❌ Sol·licitud Rebutjada'}
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px; color: #e5e5e5;">
            <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${name}</strong>,</p>

            <p style="font-size: 16px; line-height: 1.6;">
              T'informem que la teva sol·licitud de <strong style="color: #DAA520;">${requestLabel}</strong>
              ha estat <strong>${isApproved ? 'processada correctament' : 'rebutjada'}</strong>.
            </p>

            ${notes ? `
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                <strong style="color: #fff;">Notes:</strong><br>
                ${notes}
              </p>
            </div>
            ` : ''}

            ${downloadUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${downloadUrl}"
                 style="background: linear-gradient(135deg, #DAA520, #B8860B);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                📥 Descarregar les teves dades
              </a>
            </div>
            ` : ''}

            <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3;">
              Si tens qualsevol dubte o necessites més informació, no dubtis en contactar-nos a
              <a href="mailto:${SITE_CONFIG.business.email}" style="color: #DAA520;">${SITE_CONFIG.business.email}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Òrbita Events. Tots els drets reservats.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Enviar email de gratitud amb canvas i codi de descompte
 */
export async function sendTestimonialApprovedEmail(params: {
  to: string;
  name: string;
  rating: number;
  discountCode: string;
  discountPercent?: number;
  eventType?: string;
}): Promise<void> {
  const { to, name, rating, discountCode, discountPercent = 10, eventType } = params;

  // Construir URL del canvas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
  const canvasParams = new URLSearchParams({
    name,
    rating: String(rating * 2), // Convertir 5 estrelles a 10
    code: discountCode,
    discount: String(discountPercent),
    preset: 'email',
  });
  if (eventType) canvasParams.append('eventType', eventType);
  const canvasUrl = `${baseUrl}/api/canvas/rating?${canvasParams.toString()}`;

  await sendEmail({
    to,
    subject: `Gràcies per la teva opinió! Aquí tens el teu ${discountPercent}% de descompte - Òrbita Events`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <!-- Header amb degradat daurat -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 40px; text-align: center;">
            <h1 style="color: #FFB800; margin: 0; font-size: 28px; font-weight: 300;">
              <span style="font-weight: 800;">ÒRBITA</span> EVENTS
            </h1>
            <p style="color: rgba(255,255,255,0.6); margin: 12px 0 0 0; font-size: 14px; letter-spacing: 2px;">
              GRÀCIES PER CONFIAR EN NOSALTRES
            </p>
          </div>

          <!-- Canvas image -->
          <div style="text-align: center; padding: 0;">
            <img src="${canvasUrl}" alt="El teu regal de ${discountPercent}% descompte" style="width: 100%; max-width: 600px; display: block; border: 0; outline: none; text-decoration: none;" />
          </div>
          <div style="padding: 12px 24px; background: #121212; text-align: center; font-size: 12px; color: #9ca3af;">
            Si no veus la imatge del regal, obre-la aqu¡: <a href="${canvasUrl}" style="color: #FFB800; text-decoration: none;">Veure regal</a>
          </div>

          <!-- Content -->
          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #FFB800; margin-top: 0; text-align: center;">Hola ${name.split(' ')[0]}!</h2>

            <p style="font-size: 16px; line-height: 1.6; text-align: center;">
              La teva opinió ha estat aprovada i publicada. Ens fa molta il·lusió llegir experiències com la teva!
            </p>

            <!-- Rating box -->
            <div style="background: rgba(255,184,0,0.1); border: 2px solid rgba(255,184,0,0.3); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 2px;">
                El teu codi exclusiu
              </p>
              <p style="margin: 0; font-size: 36px; font-weight: 800; color: #FFB800; letter-spacing: 4px;">
                ${discountCode}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 24px; font-weight: 700; color: #fff;">
                ${discountPercent}% DESCOMPTE
              </p>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                Vàlid durant 6 mesos per al teu pròxim event
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; text-align: center;">
              Comparteix aquest codi amb amics i familiars. Si organitzen un event amb nosaltres, tots sortiu guanyant!
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}"
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
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Òrbita Events. Tots els drets reservats.
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
              ${SITE_CONFIG.business.phone} · ${SITE_CONFIG.business.email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Notificar a l'admin quan hi ha una nova opinió per revisar
 */
export async function sendTestimonialAdminNotification(params: {
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  discountCode: string;
  discountPercent: number;
  hasPhoto: boolean;
  hasVideo: boolean;
}): Promise<void> {
  const { customerName, customerEmail, rating, comment, discountCode, discountPercent, hasPhoto, hasVideo } = params;
  const adminEmail = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';

  const stars = '⭐'.repeat(Math.min(5, Math.max(1, rating)));
  const mediaIndicators = [
    hasPhoto ? '📷 Foto' : null,
    hasVideo ? '🎬 Vídeo' : null,
  ].filter(Boolean).join(' · ') || 'Sense media';

  await sendEmail({
    to: adminEmail,
    subject: `📝 Nova opinió: ${customerName} ${stars} - Pendent d'aprovar`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">📝 Nova Opinió Rebuda</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">Pendent de revisió i aprovació</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Client info -->
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Client</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #fff;">${customerName}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #60a5fa;">${customerEmail}</p>
            </div>

            <!-- Rating -->
            <div style="text-align: center; margin: 24px 0;">
              <p style="margin: 0; font-size: 36px;">${stars}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #888;">${rating}/5 estrelles</p>
            </div>

            <!-- Comment -->
            <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #FFB800; padding: 16px; border-radius: 0 12px 12px 0; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; color: #e5e5e5; line-height: 1.6; font-style: italic;">
                "${comment.length > 300 ? comment.substring(0, 300) + '...' : comment}"
              </p>
            </div>

            <!-- Media & Discount -->
            <div style="display: flex; gap: 16px; margin: 20px 0;">
              <div style="flex: 1; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">Media</p>
                <p style="margin: 0; font-size: 14px; color: #fff;">${mediaIndicators}</p>
              </div>
              <div style="flex: 1; background: rgba(255,184,0,0.1); border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">Descompte generat</p>
                <p style="margin: 0; font-size: 14px; color: #FFB800; font-weight: bold;">${discountCode} (${discountPercent}%)</p>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0 10px;">
              <a href="${baseUrl}/admin/opiniones"
                 style="background: linear-gradient(135deg, #22c55e, #16a34a);
                        color: #fff;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                ✅ Revisar i Aprovar
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Òrbita Events · Sistema d'Opinions Automatitzat
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    replyTo: customerEmail,
  });
}

export async function sendTestimonialReceivedEmail(params: {
  to: string;
  name: string;
  rating: number;
  discountCode: string;
  discountPercent: number;
}): Promise<void> {
  const { to, name, rating, discountCode, discountPercent } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
  const firstName = name.split(' ')[0];

  // Badge segons rating
  const ratingBadge = rating >= 5 ? 'Excelent' : rating >= 4 ? 'Genial' : rating >= 3 ? 'Be' : 'Gracies';
  const stars = '*'.repeat(Math.min(5, Math.max(1, rating)));

  await sendEmail({
    to,
    subject: `${firstName}, aqui tens el teu ${discountPercent}% de descompte! - Orbita Events`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 40px; text-align: center;">
            <div style="font-size: 12px; margin-bottom: 12px; letter-spacing: 2px; color: #FFB800; text-transform: uppercase;">${ratingBadge}</div>
            <h1 style="color: #FFB800; margin: 0; font-size: 28px; font-weight: 300;">
              <span style="font-weight: 800;">GRACIES</span> ${firstName.toUpperCase()}!
            </h1>
            <p style="color: rgba(255,255,255,0.6); margin: 12px 0 0 0; font-size: 14px;">
              ${stars} La teva opinio ens fa molt felicos
            </p>
          </div>

          <!-- Discount Code Box -->
          <div style="padding: 30px;">
            <div style="background: linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,140,0,0.1)); border: 2px solid rgba(255,184,0,0.4); border-radius: 20px; padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 2px;">
                EL TEU CODI DE DESCOMPTE
              </p>
              <p style="margin: 8px 0; font-size: 42px; font-weight: 800; color: #FFB800; letter-spacing: 4px; font-family: monospace;">
                ${discountCode}
              </p>
              <div style="background: linear-gradient(135deg, #FFB800, #FF8C00); color: #000; display: inline-block; padding: 12px 24px; border-radius: 50px; margin-top: 12px;">
                <span style="font-size: 28px; font-weight: 900;">${discountPercent}% DESCOMPTE</span>
              </div>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                Valid durant 1 any - Per al teu proxim event
              </p>
            </div>
          </div>

          <!-- Message -->
          <div style="padding: 0 30px 30px; color: #e5e5e5;">
            <p style="font-size: 16px; line-height: 1.7; margin: 0;">
              Hem rebut la teva valoracio i la revisarem aviat. Mentrestant, <strong style="color: #FFB800;">ja pots utilitzar el teu codi de descompte</strong> per a qualsevol dels nostres serveis!
            </p>

            <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border-left: 3px solid #FFB800;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                <strong style="color: #fff;">Consell:</strong> Guarda aquest email o fes una captura de pantalla del codi. El necessitaras quan facis la reserva.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0 10px;">
              <a href="${baseUrl}/contacto"
                 style="background: linear-gradient(135deg, #FFB800, #CC9600);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                Reservar amb descompte
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Orbita Events - Barcelona i Girona
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
              ${SITE_CONFIG.business.phone} - ${SITE_CONFIG.business.email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}