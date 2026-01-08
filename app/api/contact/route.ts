// app/api/contact/route.ts
// API de contacto - Crea leads en el modelo nuevo
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { SITE_CONFIG } from '@/config/site-config';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCsrf } from '@/lib/csrf';
import { escapeHtml } from '@/lib/utils/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import type { EventType, LeadSource } from '@prisma/client';

// Validacion de datos con Zod
const contactSchema = z.object({
  name: z.string().min(2, 'Nombre demasiado corto').max(50),
  contact: z.string().min(3, 'Introduce email o telefono'),
  event: z.string().min(1, 'Selecciona tipo de evento'),
  message: z.string().optional(),
  packId: z.string().optional(),
  packName: z.string().optional(),
  estimatedPrice: z.number().optional(),
  eventDate: z.string().optional(),
  guests: z.number().optional(),
  extras: z.array(z.string()).optional(),
  locale: z.string().optional(),
  turnstileToken: z.string().optional(),
});

// Mapeo de tipos de evento para emails
const EVENT_TYPE_LABELS: Record<string, string> = {
  boda: 'Boda',
  bodas: 'Boda',
  wedding: 'Boda',
  discomovil: 'Discomovil',
  empresa: 'Evento corporativo',
  empresas: 'Evento corporativo',
  corporate: 'Evento corporativo',
  fiesta: 'Fiesta privada',
  fiestas: 'Fiesta privada',
  cumpleanos: 'Cumpleanos',
  cumpleanyos: 'Cumpleanos',
  birthday: 'Cumpleanos',
  communion: 'Comunion',
  baptism: 'Bautizo',
  graduation: 'Graduacion',
  anniversary: 'Aniversario',
  tematizacion: 'Tematizacion',
  produccion: 'Produccion tecnica',
  alquiler: 'Alquiler de equipo',
  otro: 'Otro',
  other: 'Otro',
};

function mapEventType(eventStr: string): EventType {
  const normalized = eventStr.toLowerCase();
  if (normalized.includes('boda') || normalized.includes('wedding')) return 'WEDDING';
  if (normalized.includes('empresa') || normalized.includes('corporativ') || normalized.includes('corporate')) return 'CORPORATE';
  if (normalized.includes('cumpleanos') || normalized.includes('cumpleanyos') || normalized.includes('birthday')) return 'BIRTHDAY';
  if (normalized.includes('comunion') || normalized.includes('communion')) return 'COMMUNION';
  if (normalized.includes('bautizo') || normalized.includes('baptism')) return 'BAPTISM';
  if (normalized.includes('graduacion') || normalized.includes('graduation')) return 'GRADUATION';
  if (normalized.includes('aniversari') || normalized.includes('anniversary')) return 'ANNIVERSARY';
  if (normalized.includes('fiesta') || normalized.includes('discomovil') || normalized.includes('party')) return 'PRIVATE_PARTY';
  return 'OTHER';
}

function determineSource(packId?: string, packName?: string): LeadSource {
  if (packId || packName) return 'CONFIGURATOR';
  return 'WEBSITE';
}

export async function POST(req: NextRequest) {
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(req, RATE_LIMITS.contact);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const isValidCaptcha = await verifyTurnstileToken(parsed.data.turnstileToken, clientIp);

    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'Verificacion de seguridad fallida. Por favor intenta de nuevo.' },
        { status: 403 }
      );
    }

    const {
      name,
      contact,
      event,
      message,
      packId,
      packName,
      estimatedPrice,
      eventDate,
      guests,
      extras,
      locale,
    } = parsed.data;

    const isEmail = contact.includes('@');
    const clientEmail: string | undefined = isEmail ? contact : undefined;
    const clientPhone: string | undefined = isEmail ? undefined : contact.replace(/[^\d+]/g, '');

    const leadId = `OE-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const eventLabel = EVENT_TYPE_LABELS[event.toLowerCase()] || event;

    let _savedLeadId: string | null = null;

    try {
      const existingLead = clientEmail ? await prisma.lead.findFirst({
        where: { email: clientEmail },
      }) : null;

      if (existingLead) {
        const updatedLead = await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            name,
            phone: clientPhone || existingLead.phone,
            eventType: mapEventType(event),
            eventDate: eventDate ? new Date(eventDate) : existingLead.eventDate,
            guestCount: guests || existingLead.guestCount,
            budget: estimatedPrice ? `${estimatedPrice} EUR` : existingLead.budget,
            message: message || existingLead.message,
            interestedPackId: packId || existingLead.interestedPackId,
            interestedExtras: extras && extras.length > 0 ? extras : existingLead.interestedExtras,
            source: determineSource(packId, packName),
            preferredLocale: locale || existingLead.preferredLocale,
            updatedAt: new Date(),
          }
        });
        _savedLeadId = updatedLead.id;

        await prisma.leadNote.create({
          data: {
            leadId: updatedLead.id,
            content: `Nuevo contacto via web: ${eventLabel}${packName ? ` - Pack: ${packName}` : ''}${message ? `\nMensaje: ${message}` : ''}`,
          }
        });
      } else {
        const emailForDb = clientEmail || `phone-${clientPhone}@leads.orbitaevents.local`;

        const newLead = await prisma.lead.create({
          data: {
            name,
            email: emailForDb,
            phone: clientPhone,
            eventType: mapEventType(event),
            eventDate: eventDate ? new Date(eventDate) : null,
            guestCount: guests,
            budget: estimatedPrice ? `${estimatedPrice} EUR` : null,
            message,
            interestedPackId: packId,
            interestedExtras: extras || [],
            source: determineSource(packId, packName),
            status: 'NEW',
            priority: 'MEDIUM',
            preferredLocale: locale || 'es',
          }
        });
        _savedLeadId = newLead.id;

        await prisma.leadNote.create({
          data: {
            leadId: newLead.id,
            content: `Lead creado via ${packId ? 'configurador' : 'formulario web'}${packName ? ` - Pack interesado: ${packName}` : ''}${!clientEmail ? ` (Contacto por telefono: ${clientPhone})` : ''}`,
          }
        });
      }

    } catch (dbError) {
      log.error('Error guardando lead en la base de datos', dbError, {
        context: {
          eventType: event,
          source: determineSource(packId, packName),
          hasEmail: !!clientEmail,
          hasPhone: !!clientPhone,
        }
      });
    }

    if (_savedLeadId && clientEmail) {
      try {
        const { notifyNewLead } = await import('@/lib/services/notificationService');

        notifyNewLead({
          id: _savedLeadId,
          name,
          email: clientEmail,
          phone: clientPhone,
          eventType: mapEventType(event),
          eventDate: eventDate ? new Date(eventDate) : undefined,
          guestCount: guests,
          budget: estimatedPrice ? `${estimatedPrice} EUR` : undefined,
          message,
          source: determineSource(packId, packName),
          packName,
          createdAt: new Date(),
        }).catch(err => {
          log.error('[Notification] Error enviando notificacion multi-canal:', err);
        });
      } catch {
        // Ignorar errores de import en entornos sin el servicio
      }
    }

    try {
      const adminEmailHtml =
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #DAA520, #B8860B); padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; color: #000; }
    .header .lead-id { font-size: 14px; color: rgba(0,0,0,0.7); margin-top: 8px; }
    .content { padding: 30px; }
    .field { margin-bottom: 20px; }
    .field-label { font-size: 12px; text-transform: uppercase; color: #DAA520; letter-spacing: 1px; margin-bottom: 4px; }
    .field-value { font-size: 18px; color: #fff; }
    .highlight-box { background: rgba(218,165,32,0.1); border: 1px solid #DAA520; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .price { font-size: 28px; font-weight: bold; color: #DAA520; }
    .extras-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .extra-tag { background: #DAA520; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .cta-button { display: block; background: #25D366; color: #fff; text-align: center; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NUEVO LEAD</h1>
      <div class="lead-id">ID: ${leadId} | ${timestamp}</div>
    </div>

    <div class="content">
      <div class="field">
        <div class="field-label">Cliente</div>
        <div class="field-value">${escapeHtml(name)}</div>
      </div>

      <div class="field">
        <div class="field-label">${isEmail ? 'Email' : 'Telefono'}</div>
        <div class="field-value">${escapeHtml(contact)}</div>
      </div>

      <div class="field">
        <div class="field-label">Tipo de evento</div>
        <div class="field-value">${escapeHtml(eventLabel)}</div>
      </div>

      ${eventDate ? `
      <div class="field">
        <div class="field-label">Fecha del evento</div>
        <div class="field-value">${eventDate}</div>
      </div>
      ` : ''}

      ${guests ? `
      <div class="field">
        <div class="field-label">Numero de invitados</div>
        <div class="field-value">${guests} personas</div>
      </div>
      ` : ''}

      ${message ? `
      <div class="field">
        <div class="field-label">Mensaje</div>
        <div class="field-value">${escapeHtml(message)}</div>
      </div>
      ` : ''}

      ${packName ? `
      <div class="highlight-box">
        <div class="field-label">Pack seleccionado</div>
        <div class="field-value">${escapeHtml(packName)}</div>
        ${estimatedPrice ? `<div class="price">${estimatedPrice.toLocaleString('es-ES')} EUR</div>` : ''}
        ${packId ? `<div style="font-size: 12px; color: #666; margin-top: 8px;">ID: ${escapeHtml(packId)}</div>` : ''}
      </div>
      ` : ''}

      ${extras && Array.isArray(extras) && extras.length > 0 ? `
      <div class="field">
        <div class="field-label">Extras solicitados</div>
        <div class="extras-list">
          ${extras.filter(e => e != null).map(e => `<span class="extra-tag">${String(e).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${clientPhone ? `
      <a href="tel:${escapeHtml(clientPhone)}" class="cta-button">Llamar a ${escapeHtml(name)}</a>
      ` : ''}

      ${isEmail ? `
      <a href="mailto:${clientEmail}?subject=${encodeURIComponent('Re: Tu solicitud en Orbita Events - ' + eventLabel)}" class="cta-button" style="background: #4A90D9;">
        Responder por email
      </a>
      ` : ''}
    </div>

    <div class="footer">
      Orbita Events | Sistema de leads automatizado<br>
      ${timestamp}
    </div>
  </div>
</body>
</html>`;

      const adminEmail = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();
      const smtpFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

      await sendEmail({
        to: adminEmail,
        subject: `NUEVO LEAD: ${name} - ${eventLabel} ${estimatedPrice ? `(${estimatedPrice} EUR)` : ''}`,
        html: adminEmailHtml,
        replyTo: clientEmail || undefined,
        from: `"Orbita Events Web" <${smtpFrom}>`,
      });
    } catch (emailError) {
      log.error('Failed to send admin notification email', emailError, {
        context: { leadId, hasEmail: !!clientEmail }
      });
    }

    if (isEmail && clientEmail) {
      try {
        const clientEmailHtml =
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); padding: 36px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #DAA520; }
    .content { padding: 36px 30px; }
    .greeting { font-size: 20px; margin-bottom: 20px; }
    .info-box { background: #f8f8f8; border-left: 4px solid #DAA520; padding: 16px; margin: 20px 0; border-radius: 0 12px 12px 0; }
    .step { margin: 16px 0; padding-left: 12px; border-left: 2px solid #E6D3A1; }
    .cta-section { text-align: center; margin: 24px 0; }
    .cta-button { display: inline-block; background: #DAA520; color: #000; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; }
    .footer { background: #1a1a1a; color: #999; padding: 28px; text-align: center; font-size: 12px; }
    .footer a { color: #DAA520; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mensaje recibido</h1>
    </div>

    <div class="content">
      <p class="greeting">Hola <strong>${escapeHtml(name)}</strong>,</p>

      <p>Gracias por contactar con <strong>Orbita Events</strong>. Hemos recibido tu solicitud para <strong>${escapeHtml(eventLabel)}</strong>.</p>

      <div class="info-box">
        <strong>Tu referencia: ${leadId}</strong><br>
        <span style="font-size: 14px; color: #666;">Guarda este codigo para cualquier consulta</span>
      </div>

      <div class="step"><strong>Revisamos tu solicitud</strong><br>En las proximas horas analizamos tus necesidades.</div>
      <div class="step"><strong>Te contactamos en menos de 2 horas</strong><br>Incluso fines de semana.</div>
      <div class="step"><strong>Presupuesto personalizado</strong><br>Te enviamos una propuesta detallada adaptada a tu evento.</div>

      ${estimatedPrice ? `
      <div class="info-box" style="border-left-color: #25D366; background: #f0fff4;">
        <strong>Presupuesto estimado: ${estimatedPrice.toLocaleString('es-ES')} EUR</strong><br>
        <span style="font-size: 14px; color: #666;">*Precio orientativo. Confirmaremos el precio final en nuestro email.</span>
      </div>
      ` : ''}

      <div class="cta-section">
        <a href="tel:${SITE_CONFIG.business.phone}" class="cta-button">Llamar ahora al ${SITE_CONFIG.business.phoneDisplay}</a>
      </div>
    </div>

    <div class="footer">
      <strong>Orbita Events</strong><br>
      <a href="tel:${SITE_CONFIG.business.phone}">${SITE_CONFIG.business.phoneDisplay}</a> |
      <a href="mailto:${SITE_CONFIG.business.email}">${SITE_CONFIG.business.email}</a><br><br>
      Has recibido este email porque solicitaste informacion en orbitaevents.com.
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
          to: clientEmail,
          subject: `Recibido! Tu solicitud para ${eventLabel} - Orbita Events`,
          html: clientEmailHtml,
        });
      } catch (clientEmailError) {
        log.error('Failed to send client confirmation email', clientEmailError, {
          context: { leadId, clientEmail }
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Mensaje enviado con exito',
      leadId,
      estimatedResponse: '2-4 horas',
    });

  } catch (error) {
    log.error('[Contact API] Error:', error);

    return NextResponse.json(
      {
        error: `Error al enviar el mensaje. Si lo prefieres, llamanos al ${SITE_CONFIG.business.phoneDisplay} o vuelve a intentarlo.`,
        phone: SITE_CONFIG.business.phone,
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}