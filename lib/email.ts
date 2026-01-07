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
              <a href="${baseUrl}/admin/opiniones"
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