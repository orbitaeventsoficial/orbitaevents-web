/**
 * Email Service - Servicio centralizado de envio de emails
 * Utilizado por todas las APIs que necesitan enviar emails
 */

import nodemailer from 'nodemailer';
import { SITE_CONFIG } from '@/app/config/site-config';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  text?: string;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function createTransporter() {
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

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();

  const smtpFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  const fromAddress = options.from?.trim() || `"Orbita Events" <${smtpFrom}>`;
  const toAddress = options.to.trim();

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    subject: sanitizeHeader(options.subject),
    html: options.html,
    text: options.text?.trim() || htmlToText(options.html),
    replyTo: options.replyTo?.trim(),
  });
}

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
    ACCESS: "Derecho de acceso",
    RECTIFICATION: 'Derecho de rectificacion',
    ERASURE: 'Derecho de supresion',
    RESTRICTION: 'Derecho de limitacion',
    PORTABILITY: 'Derecho de portabilidad',
    OBJECTION: 'Derecho de oposicion',
    AUTOMATED: 'Decisiones automatizadas',
  };

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com'}/api/privacy/verify?token=${verificationToken}`;
  const requestLabel = REQUEST_TYPE_LABELS[requestType] || requestType;

  await sendEmail({
    to,
    subject: sanitizeHeader(`Verifica tu solicitud de ${requestLabel} - Orbita Events`),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #DAA520, #B8860B); padding: 30px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 24px;">Orbita Events</h1>
            <p style="color: rgba(0,0,0,0.7); margin: 8px 0 0 0; font-size: 14px;">Portal de privacidad</p>
          </div>

          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #DAA520; margin-top: 0;">Verifica tu solicitud</h2>

            <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${escapeHtml(name)}</strong>,</p>

            <p style="font-size: 16px; line-height: 1.6;">
              Hemos recibido tu solicitud de <strong style="color: #DAA520;">${escapeHtml(requestLabel)}</strong>.
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
              Para verificar tu identidad y procesar la solicitud, haz clic en el siguiente boton:
            </p>

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
                Verificar solicitud
              </a>
            </div>

            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
              Este enlace es valido durante <strong>7 dias</strong>.
              Si no has solicitado esto, puedes ignorar este email.
            </p>

            <div style="background: rgba(218,165,32,0.1); border: 1px solid rgba(218,165,32,0.3); border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #a3a3a3;">
                <strong style="color: #DAA520;">Referencia:</strong> ${escapeHtml(requestId)}
              </p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                <strong style="color: #DAA520;">Plazo legal de respuesta:</strong> ${legalDeadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <p style="color: #666; font-size: 12px; word-break: break-all;">
              Si el boton no funciona, copia y pega este enlace en el navegador:<br>
              <a href="${verificationUrl}" style="color: #DAA520;">${verificationUrl}</a>
            </p>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Orbita Events. Todos los derechos reservados.
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #444;">
              Este email ha sido enviado en respuesta a una solicitud RGPD.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

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
    ACCESS: "Derecho de acceso",
    RECTIFICATION: 'Derecho de rectificacion',
    ERASURE: 'Derecho de supresion',
    RESTRICTION: 'Derecho de limitacion',
    PORTABILITY: 'Derecho de portabilidad',
    OBJECTION: 'Derecho de oposicion',
    AUTOMATED: 'Decisiones automatizadas',
  };

  const requestLabel = REQUEST_TYPE_LABELS[requestType] || requestType;
  const isApproved = result === 'approved';

  await sendEmail({
    to,
    subject: sanitizeHeader(`${isApproved ? 'Solicitud procesada' : 'Solicitud rechazada'} - ${requestLabel} - Orbita Events`),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: ${isApproved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">
              ${isApproved ? 'Solicitud procesada' : 'Solicitud rechazada'}
            </h1>
          </div>

          <div style="padding: 30px; color: #e5e5e5;">
            <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${escapeHtml(name)}</strong>,</p>

            <p style="font-size: 16px; line-height: 1.6;">
              Te informamos que tu solicitud de <strong style="color: #DAA520;">${escapeHtml(requestLabel)}</strong>
              ha sido <strong>${isApproved ? 'procesada correctamente' : 'rechazada'}</strong>.
            </p>

            ${notes ? `
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                <strong style="color: #fff;">Notas:</strong><br>
                ${escapeHtml(notes)}
              </p>
            </div>
            ` : ''}

            ${downloadUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${escapeHtml(downloadUrl)}"
                 style="background: linear-gradient(135deg, #DAA520, #B8860B);
                        color: #000;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                Descargar tus datos
              </a>
            </div>
            ` : ''}

            <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3;">
              Si tienes cualquier duda o necesitas mas informacion, contactanos en
              <a href="mailto:${SITE_CONFIG.business.email}" style="color: #DAA520;">${SITE_CONFIG.business.email}</a>
            </p>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Orbita Events. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendTestimonialApprovedEmail(params: {
  to: string;
  name: string;
  rating: number;
  discountCode: string;
  discountPercent?: number;
  eventType?: string;
}): Promise<void> {
  const { to, name, rating, discountCode, discountPercent = 10, eventType } = params;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
  const canvasParams = new URLSearchParams({
    name,
    rating: String(rating * 2),
    code: discountCode,
    discount: String(discountPercent),
    preset: 'email',
  });
  if (eventType) canvasParams.append('eventType', eventType);
  const canvasUrl = `${baseUrl}/api/canvas/rating?${canvasParams.toString()}`;

  await sendEmail({
    to,
    subject: `Gracias por tu opinion! Aqui tienes tu ${discountPercent}% de descuento - Orbita Events`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 40px; text-align: center;">
            <h1 style="color: #FFB800; margin: 0; font-size: 28px; font-weight: 300;">
              <span style="font-weight: 800;">ORBITA</span> EVENTS
            </h1>
            <p style="color: rgba(255,255,255,0.6); margin: 12px 0 0 0; font-size: 14px; letter-spacing: 2px;">
              GRACIAS POR CONFIAR EN NOSOTROS
            </p>
          </div>

          <div style="text-align: center; padding: 0;">
            <img src="${canvasUrl}" alt="Tu regalo de ${discountPercent}% de descuento" style="width: 100%; max-width: 600px; display: block; border: 0; outline: none; text-decoration: none;" />
          </div>
          <div style="padding: 12px 24px; background: #121212; text-align: center; font-size: 12px; color: #9ca3af;">
            Si no ves la imagen, abrela aqui: <a href="${canvasUrl}" style="color: #FFB800; text-decoration: none;">Ver regalo</a>
          </div>

          <div style="padding: 30px; color: #e5e5e5;">
            <h2 style="color: #FFB800; margin-top: 0; text-align: center;">Hola ${name.split(' ')[0]}!</h2>

            <p style="font-size: 16px; line-height: 1.6; text-align: center;">
              Tu opinion ha sido aprobada y publicada. Nos hace mucha ilusion leerte.
            </p>

            <div style="background: rgba(255,184,0,0.1); border: 2px solid rgba(255,184,0,0.3); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 2px;">
                Tu codigo exclusivo
              </p>
              <p style="margin: 0; font-size: 36px; font-weight: 800; color: #FFB800; letter-spacing: 4px;">
                ${escapeHtml(discountCode)}
              </p>
              <p style="margin: 12px 0 0 0; font-size: 24px; font-weight: 700; color: #fff;">
                ${discountPercent}% DESCUENTO
              </p>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                Valido durante 6 meses para tu proximo evento
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; text-align: center;">
              Comparte este codigo con amigos y familia. Si organizan un evento con nosotros, todos ganais.
            </p>

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
                Ver nuestros servicios
              </a>
            </div>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Orbita Events. Todos los derechos reservados.
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

  const stars = '*'.repeat(Math.min(5, Math.max(1, rating)));
  const mediaIndicators = [
    hasPhoto ? 'Foto' : null,
    hasVideo ? 'Video' : null,
  ].filter(Boolean).join(' y ') || 'Sin media';

  await sendEmail({
    to: adminEmail,
    subject: sanitizeHeader(`Nueva opinion: ${customerName} ${stars} - Pendiente de aprobar`),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Nueva opinion recibida</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">Pendiente de revision y aprobacion</p>
          </div>

          <div style="padding: 30px;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Cliente</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #fff;">${escapeHtml(customerName)}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #60a5fa;">${escapeHtml(customerEmail)}</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <p style="margin: 0; font-size: 36px;">${stars}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #888;">${rating}/5 estrellas</p>
            </div>

            <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #FFB800; padding: 16px; border-radius: 0 12px 12px 0; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; color: #e5e5e5; line-height: 1.6; font-style: italic;">
                "${escapeHtml(comment.length > 300 ? comment.substring(0, 300) + '...' : comment)}"
              </p>
            </div>

            <div style="display: flex; gap: 16px; margin: 20px 0;">
              <div style="flex: 1; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">Media</p>
                <p style="margin: 0; font-size: 14px; color: #fff;">${mediaIndicators}</p>
              </div>
              <div style="flex: 1; background: rgba(255,184,0,0.1); border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">Descuento generado</p>
                <p style="margin: 0; font-size: 14px; color: #FFB800; font-weight: bold;">${escapeHtml(discountCode)} (${discountPercent}%)</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0 10px;">
              <a href="${baseUrl}/admin/ressenyes"
                 style="background: linear-gradient(135deg, #22c55e, #16a34a);  
                        color: #fff;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 12px;
                        font-weight: bold;
                        font-size: 16px;
                        display: inline-block;">
                Revisar y aprobar
              </a>
            </div>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              Orbita Events | Sistema de opiniones automatizado
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    replyTo: customerEmail,
  });
}

export async function sendTestimonialsReminderEmail(params: {
  to: string;
  pendingCount: number;
  testimonials: Array<{
    name: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  dashboardUrl: string;
}): Promise<void> {
  const { to, pendingCount, testimonials, dashboardUrl } = params;
  const previewRows = testimonials
    .map((t) => {
      const date = t.createdAt.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });
      return `
        <tr>
          <td style="padding: 8px 0; color: #fff; font-size: 14px;">${escapeHtml(t.name)}</td>
          <td style="padding: 8px 0; color: #FFB800; font-size: 14px;">⭐ ${t.rating}/5</td>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 12px;">${date}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 0 0 12px 0; color: #d1d5db; font-size: 13px;">
            "${escapeHtml(t.comment.slice(0, 140))}${t.comment.length > 140 ? '…' : ''}"
          </td>
        </tr>
      `;
    })
    .join('');

  await sendEmail({
    to,
    subject: sanitizeHeader(
      `Tienes ${pendingCount} testimonio${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'}`
    ),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1f2937, #111827); padding: 32px; text-align: center;">
            <h1 style="color: #FFB800; margin: 0; font-size: 24px;">Testimonios pendientes</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 10px 0 0;">${pendingCount} en espera de revisión</p>
          </div>
          <div style="padding: 24px 32px; color: #e5e7eb;">
            <p style="margin: 0 0 20px;">Aquí tienes un resumen rápido de los últimos testimonios:</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${previewRows}
            </table>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background: linear-gradient(135deg, #FFB800, #CC9600);
                        color: #000;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 999px;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;">
                Revisar testimonios
              </a>
            </div>
          </div>
          <div style="padding: 16px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #6b7280;">
              ${new Date().getFullYear()} Òrbita Events
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
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

  const ratingBadge = rating >= 5 ? 'Excelente' : rating >= 4 ? 'Genial' : rating >= 3 ? 'Bien' : 'Gracias';
  const stars = '*'.repeat(Math.min(5, Math.max(1, rating)));

  await sendEmail({
    to,
    subject: sanitizeHeader(`${firstName}, aqui tienes tu ${discountPercent}% de descuento! - Orbita Events`),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1f00 50%, #3d2800 100%); padding: 40px; text-align: center;">
            <div style="font-size: 12px; margin-bottom: 12px; letter-spacing: 2px; color: #FFB800; text-transform: uppercase;">${ratingBadge}</div>
            <h1 style="color: #FFB800; margin: 0; font-size: 28px; font-weight: 300;">
              <span style="font-weight: 800;">GRACIAS</span> ${firstName.toUpperCase()}!
            </h1>
            <p style="color: rgba(255,255,255,0.6); margin: 12px 0 0 0; font-size: 14px;">
              ${stars} Tu opinion nos hace muy felices
            </p>
          </div>

          <div style="padding: 30px;">
            <div style="background: linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,140,0,0.1)); border: 2px solid rgba(255,184,0,0.4); border-radius: 20px; padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 2px;">
                TU CODIGO DE DESCUENTO
              </p>
              <p style="margin: 8px 0; font-size: 42px; font-weight: 800; color: #FFB800; letter-spacing: 4px; font-family: monospace;">
                ${escapeHtml(discountCode)}
              </p>
              <div style="background: linear-gradient(135deg, #FFB800, #FF8C00); color: #000; display: inline-block; padding: 12px 24px; border-radius: 50px; margin-top: 12px;">
                <span style="font-size: 28px; font-weight: 900;">${discountPercent}% DESCUENTO</span>
              </div>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.5);">
                Valido durante 1 ano - Para tu proximo evento
              </p>
            </div>
          </div>

          <div style="padding: 0 30px 30px; color: #e5e5e5;">
            <p style="font-size: 16px; line-height: 1.7; margin: 0;">
              Hemos recibido tu valoracion y la revisaremos pronto. Mientras tanto, <strong style="color: #FFB800;">puedes usar tu codigo de descuento</strong> en cualquiera de nuestros servicios.
            </p>

            <div style="margin-top: 24px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border-left: 3px solid #FFB800;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                <strong style="color: #fff;">Consejo:</strong> Guarda este email o haz una captura del codigo. Lo necesitaras cuando reserves.
              </p>
            </div>

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
                Reservar con descuento
              </a>
            </div>
          </div>

          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Orbita Events - Barcelona y Girona
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

/**
 * Send booking confirmation email to client
 */
export async function sendBookingConfirmation(booking: any): Promise<void> {
  const eventDate = new Date(booking.eventDate);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const packName =
    booking.pack.translations.find((t: any) => t.locale === booking.preferredLocale)?.name ||
    booking.pack.slug;

  let extrasHtml = '';
  if (booking.extras && booking.extras.length > 0) {
    extrasHtml = booking.extras
      .map((extra: any) => {
        const extraName =
          extra.extra.translations.find((t: any) => t.locale === booking.preferredLocale)?.name ||
          extra.extra.slug;
        return `<li>${escapeHtml(extraName)} - ${extra.price}€</li>`;
      })
      .join('');
  }

  await sendEmail({
    to: booking.clientEmail,
    subject: `Confirmación de Reserva #${booking.reference} - Òrbita Events`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff;">
        <div style="max-width: 600px; margin: 0 auto; background: #111;">
          <!-- Header -->
          <div style="padding: 32px 20px; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #fff; font-weight: bold;">
              ¡Reserva Confirmada! 🎉
            </h1>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">
              Referencia: <strong>${escapeHtml(booking.reference)}</strong>
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 20px;">
            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #ccc;">
              Hola <strong>${escapeHtml(booking.clientName)}</strong>,
            </p>

            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #ccc;">
              Tu reserva ha sido confirmada. A continuación encontrarás todos los detalles:
            </p>

            <!-- Event Details -->
            <div style="background: #1a1a1a; border-left: 4px solid #7C3AED; padding: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">📅 Detalles del Evento</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">Fecha:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; font-weight: bold; text-align: right;">
                    ${formattedDate}
                  </td>
                </tr>
                ${booking.eventStartTime ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">Horario:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${escapeHtml(booking.eventStartTime)}${booking.eventEndTime ? ` - ${escapeHtml(booking.eventEndTime)}` : ''}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">Ubicación:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${escapeHtml(booking.eventLocation)}
                  </td>
                </tr>
                ${booking.eventVenue ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">Local:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${escapeHtml(booking.eventVenue)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 14px;">Invitados:</td>
                  <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right;">
                    ${booking.guestCount} personas
                  </td>
                </tr>
              </table>
            </div>

            <!-- Services -->
            <div style="background: #1a1a1a; border-left: 4px solid #EC4899; padding: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">🎵 Servicios Contratados</h2>
              <ul style="margin: 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
                <li><strong>${escapeHtml(packName)}</strong> - ${booking.pack.price}€</li>
                ${extrasHtml}
                ${booking.extraHours > 0 && booking.pack.extraHourPrice
                  ? `<li>Horas extra (${booking.extraHours}h) - ${booking.pack.extraHourPrice * booking.extraHours}€</li>`
                  : ''}
              </ul>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; color: #999;">Total:</span>
                  <span style="font-size: 24px; font-weight: bold; color: #7C3AED;">
                    ${booking.total}€
                  </span>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background: #1a1a1a; padding: 20px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">📋 Próximos Pasos</h2>
              <ol style="margin: 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
                <li>Nos pondremos en contacto contigo en las próximas 24h para confirmar todos los detalles</li>
                <li>Recibirás un contrato con las condiciones del servicio</li>
                <li>Te informaremos sobre las modalidades de pago disponibles</li>
              </ol>
            </div>

            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #999;">
              Si tienes cualquier pregunta, no dudes en contactarnos:
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #ccc;">
              📧 ${SITE_CONFIG.business.email}<br>
              📱 ${SITE_CONFIG.business.phone}
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background: #0a0a0a; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${new Date().getFullYear()} Òrbita Events - Barcelona y Girona
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Send booking notification to admin
 */
export async function sendBookingNotificationToAdmin(booking: any): Promise<void> {
  const eventDate = new Date(booking.eventDate);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const adminEmail = process.env.EMAIL_TO || SITE_CONFIG.business.email;

  await sendEmail({
    to: adminEmail,
    subject: `🎉 Nueva Reserva #${booking.reference} - ${booking.clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7C3AED;">Nueva Reserva Recibida</h1>

          <p><strong>Referencia:</strong> ${escapeHtml(booking.reference)}</p>

          <h2>Cliente</h2>
          <ul>
            <li><strong>Nombre:</strong> ${escapeHtml(booking.clientName)}</li>
            <li><strong>Email:</strong> ${escapeHtml(booking.clientEmail)}</li>
            <li><strong>Teléfono:</strong> ${escapeHtml(booking.clientPhone)}</li>
          </ul>

          <h2>Evento</h2>
          <ul>
            <li><strong>Tipo:</strong> ${escapeHtml(booking.eventType)}</li>
            <li><strong>Fecha:</strong> ${formattedDate}</li>
            ${booking.eventStartTime ? `<li><strong>Hora inicio:</strong> ${escapeHtml(booking.eventStartTime)}</li>` : ''}
            <li><strong>Ubicación:</strong> ${escapeHtml(booking.eventLocation)}</li>
            ${booking.eventVenue ? `<li><strong>Local:</strong> ${escapeHtml(booking.eventVenue)}</li>` : ''}
            <li><strong>Invitados:</strong> ${booking.guestCount}</li>
          </ul>

          <h2>Servicios</h2>
          <p><strong>Pack:</strong> ${booking.pack.slug} - ${booking.pack.price}€</p>
          ${booking.extras.length > 0 ? `<p><strong>Extras:</strong> ${booking.extras.length}</p>` : ''}
          ${booking.extraHours > 0 ? `<p><strong>Horas extra:</strong> ${booking.extraHours}h</p>` : ''}

          <p style="font-size: 20px; color: #7C3AED;"><strong>Total: ${booking.total}€</strong></p>

          ${booking.notes ? `
          <h2>Notas</h2>
          <p>${escapeHtml(booking.notes)}</p>
          ` : ''}

          <hr>
          <p style="color: #666; font-size: 12px;">
            Ver en admin: ${SITE_CONFIG.web.url}/admin/bookings/${booking.id}
          </p>
        </div>
      </body>
      </html>
    `,
  });
}
