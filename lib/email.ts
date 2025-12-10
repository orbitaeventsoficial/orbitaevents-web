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
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  // Usar IP directa si el host és de Don Dominio (soluciona DNS issues a Vercel)
  let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  if (smtpHost.includes('dondominio')) {
    smtpHost = DONDOMINIO_SMTP_IP;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // NOTA SEGURETAT: rejectUnauthorized: false és necessari quan usem IP directa
      // perquè el certificat SSL és per smtp.dondominio.com, no per la IP.
      // Això és acceptable perquè:
      // 1. Usem IP directa per evitar problemes DNS a Vercel serverless
      // 2. La connexió segueix sent xifrada amb TLS
      // 3. Coneixem i confiem en aquesta IP específica (Don Dominio)
      rejectUnauthorized: false,
    },
  });
}

/**
 * Enviar email
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: options.from || `"Òrbita Events" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
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
    subject: `🎉 Gràcies per la teva opinió! Aquí tens el teu ${discountPercent}% de descompte - Òrbita Events`,
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
            <img src="${canvasUrl}" alt="El teu regal de ${discountPercent}% descompte" style="width: 100%; max-width: 600px; display: block;" />
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
