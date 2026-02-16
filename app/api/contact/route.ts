// app/api/contact/route.ts
// API de contacto - Crea leads en el modelo nuevo
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { SITE_CONFIG } from '@/config/site-config';
import { z } from 'zod';
import { sendEmailWithTimeout } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/utils/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import type { EventType, LeadSource } from '@prisma/client';

type Locale = 'ca' | 'es' | 'en';

const CONTACT_COPY: Record<Locale, Record<string, string>> = {
  ca: {
    nameTooShort: 'Nom massa curt',
    enterEmailOrPhone: 'Introdueix correu o telèfon',
    selectEventType: "Selecciona tipus d'esdeveniment",
    invalidData: 'Dades no vàlides',
    captchaFailed: 'Verificació de seguretat fallida. Torna-ho a intentar.',
    noteNewWebContact: 'Nou contacte via web',
    notePack: 'Pack',
    noteMessage: 'Missatge',
    noteLeadCreatedVia: 'Lead creat via',
    viaConfigurator: 'configurador',
    viaWebForm: 'formulari web',
    noteInterestedPack: 'Pack interessat',
    notePhoneContact: 'Contacte per telèfon',
    adminLeadTitle: 'NOU LEAD',
    adminCustomer: 'Client',
    adminEmail: 'Correu',
    adminPhone: 'Telèfon',
    adminEventType: "Tipus d'esdeveniment",
    adminEventDate: "Data de l'esdeveniment",
    adminGuests: 'Nombre de convidats',
    adminPeople: 'persones',
    adminMessage: 'Missatge',
    adminSelectedPack: 'Pack seleccionat',
    adminRequestedExtras: 'Extres sol·licitats',
    adminCallNow: 'Trucar a',
    adminReplyByEmail: 'Respondre per correu',
    adminReplySubjectPrefix: 'Re: La teva sol·licitud a Orbita Events',
    adminSystemFooter: 'Òrbita Events | Sistema de leads automatitzat',
    adminMailSubjectPrefix: 'NOU LEAD',
    adminMailFrom: 'Òrbita Events Web',
    clientHeader: 'Missatge rebut',
    clientGreeting: 'Hola',
    clientThanks: 'Gràcies per contactar amb',
    clientReceivedFor: 'Hem rebut la teva sol·licitud per',
    clientReference: 'La teva referència',
    clientSaveCode: 'Guarda aquest codi per a qualsevol consulta',
    clientStep1Title: 'Revisem la teva sol·licitud',
    clientStep1Text: 'En les pròximes hores analitzem les teves necessitats.',
    clientStep2Title: 'Et contactem en menys de 2 hores',
    clientStep2Text: 'Fins i tot caps de setmana.',
    clientStep3Title: 'Pressupost personalitzat',
    clientStep3Text: 'T’enviem una proposta detallada adaptada al teu esdeveniment.',
    clientEstimatedBudget: 'Pressupost estimat',
    clientEstimatedNote: '*Preu orientatiu. Confirmarem el preu final al correu.',
    clientCallNow: 'Trucar ara al',
    clientReasonEmail: 'Has rebut aquest correu perquè has demanat informació a orbitaevents.com.',
    clientMailSubjectPrefix: 'Rebut! La teva sol·licitud per',
    successMessage: 'Missatge enviat correctament',
    estimatedResponse: '2-4 hores',
    sendError: 'Error en enviar el missatge. Si ho prefereixes, truca’ns al',
    retrySuffix: 'o torna-ho a provar.',
  },
  es: {
    nameTooShort: 'Nombre demasiado corto',
    enterEmailOrPhone: 'Introduce correo o teléfono',
    selectEventType: 'Selecciona tipo de evento',
    invalidData: 'Datos inválidos',
    captchaFailed: 'La verificación de seguridad ha fallado. Vuelve a intentarlo.',
    noteNewWebContact: 'Nuevo contacto vía web',
    notePack: 'Pack',
    noteMessage: 'Mensaje',
    noteLeadCreatedVia: 'Lead creado vía',
    viaConfigurator: 'configurador',
    viaWebForm: 'formulario web',
    noteInterestedPack: 'Pack interesado',
    notePhoneContact: 'Contacto por teléfono',
    adminLeadTitle: 'NUEVO LEAD',
    adminCustomer: 'Cliente',
    adminEmail: 'Email',
    adminPhone: 'Teléfono',
    adminEventType: 'Tipo de evento',
    adminEventDate: 'Fecha del evento',
    adminGuests: 'Número de invitados',
    adminPeople: 'personas',
    adminMessage: 'Mensaje',
    adminSelectedPack: 'Pack seleccionado',
    adminRequestedExtras: 'Extras solicitados',
    adminCallNow: 'Llamar a',
    adminReplyByEmail: 'Responder por email',
    adminReplySubjectPrefix: 'Re: Tu solicitud en Orbita Events',
    adminSystemFooter: 'Orbita Events | Sistema de leads automatizado',
    adminMailSubjectPrefix: 'NUEVO LEAD',
    adminMailFrom: 'Orbita Events Web',
    clientHeader: 'Mensaje recibido',
    clientGreeting: 'Hola',
    clientThanks: 'Gracias por contactar con',
    clientReceivedFor: 'Hemos recibido tu solicitud para',
    clientReference: 'Tu referencia',
    clientSaveCode: 'Guarda este código para cualquier consulta',
    clientStep1Title: 'Revisamos tu solicitud',
    clientStep1Text: 'En las próximas horas analizaremos tus necesidades.',
    clientStep2Title: 'Te contactamos en menos de 2 horas',
    clientStep2Text: 'Incluso fines de semana.',
    clientStep3Title: 'Presupuesto personalizado',
    clientStep3Text: 'Te enviamos una propuesta detallada adaptada a tu evento.',
    clientEstimatedBudget: 'Presupuesto estimado',
    clientEstimatedNote: '*Precio orientativo. Confirmaremos el precio final por correo.',
    clientCallNow: 'Llamar ahora al',
    clientReasonEmail: 'Has recibido este correo porque solicitaste información en orbitaevents.com.',
    clientMailSubjectPrefix: '¡Recibido! Tu solicitud para',
    successMessage: 'Mensaje enviado con éxito',
    estimatedResponse: '2-4 horas',
    sendError: 'Error al enviar el mensaje. Si lo prefieres, llámanos al',
    retrySuffix: 'o vuelve a intentarlo.',
  },
  en: {
    nameTooShort: 'Name is too short',
    enterEmailOrPhone: 'Enter email or phone',
    selectEventType: 'Select event type',
    invalidData: 'Invalid data',
    captchaFailed: 'Security verification failed. Please try again.',
    noteNewWebContact: 'New web contact',
    notePack: 'Pack',
    noteMessage: 'Message',
    noteLeadCreatedVia: 'Lead created via',
    viaConfigurator: 'configurator',
    viaWebForm: 'web form',
    noteInterestedPack: 'Interested pack',
    notePhoneContact: 'Phone contact',
    adminLeadTitle: 'NEW LEAD',
    adminCustomer: 'Customer',
    adminEmail: 'Email',
    adminPhone: 'Phone',
    adminEventType: 'Event type',
    adminEventDate: 'Event date',
    adminGuests: 'Guests',
    adminPeople: 'people',
    adminMessage: 'Message',
    adminSelectedPack: 'Selected pack',
    adminRequestedExtras: 'Requested extras',
    adminCallNow: 'Call',
    adminReplyByEmail: 'Reply by email',
    adminReplySubjectPrefix: 'Re: Your request at Orbita Events',
    adminSystemFooter: 'Orbita Events | Automated lead system',
    adminMailSubjectPrefix: 'NEW LEAD',
    adminMailFrom: 'Orbita Events Web',
    clientHeader: 'Message received',
    clientGreeting: 'Hi',
    clientThanks: 'Thanks for contacting',
    clientReceivedFor: 'We have received your request for',
    clientReference: 'Your reference',
    clientSaveCode: 'Keep this code for any follow-up',
    clientStep1Title: 'We review your request',
    clientStep1Text: 'In the next few hours, we will review your needs.',
    clientStep2Title: 'We will contact you in less than 2 hours',
    clientStep2Text: 'Even on weekends.',
    clientStep3Title: 'Personalized quote',
    clientStep3Text: 'We will send you a detailed proposal tailored to your event.',
    clientEstimatedBudget: 'Estimated quote',
    clientEstimatedNote: '*Indicative price. We will confirm final price by email.',
    clientCallNow: 'Call now at',
    clientReasonEmail: 'You received this email because you requested information on orbitaevents.com.',
    clientMailSubjectPrefix: 'Received! Your request for',
    successMessage: 'Message sent successfully',
    estimatedResponse: '2-4 hours',
    sendError: 'Error sending message. If you prefer, call us at',
    retrySuffix: 'or try again.',
  },
};

const EVENT_TYPE_LABELS: Record<Locale, Record<string, string>> = {
  ca: {
    boda: 'Casament', bodas: 'Casament', wedding: 'Casament', discomovil: 'Discomòbil',
    empresa: 'Esdeveniment corporatiu', empresas: 'Esdeveniment corporatiu', corporate: 'Esdeveniment corporatiu',
    fiesta: 'Festa privada', fiestas: 'Festa privada',
    cumpleanos: 'Aniversari', cumpleanyos: 'Aniversari', birthday: 'Aniversari',
    communion: 'Comunió', baptism: 'Bateig', graduation: 'Graduació', anniversary: 'Aniversari',
    tematizacion: 'Tematització', produccion: 'Producció tècnica', alquiler: "Lloguer d'equip",
    otro: 'Altre', other: 'Altre',
  },
  es: {
    boda: 'Boda', bodas: 'Boda', wedding: 'Boda', discomovil: 'Discomovil',
    empresa: 'Evento corporativo', empresas: 'Evento corporativo', corporate: 'Evento corporativo',
    fiesta: 'Fiesta privada', fiestas: 'Fiesta privada',
    cumpleanos: 'Cumpleanos', cumpleanyos: 'Cumpleanos', birthday: 'Cumpleanos',
    communion: 'Comunion', baptism: 'Bautizo', graduation: 'Graduacion', anniversary: 'Aniversario',
    tematizacion: 'Tematizacion', produccion: 'Produccion tecnica', alquiler: 'Alquiler de equipo',
    otro: 'Otro', other: 'Otro',
  },
  en: {
    boda: 'Wedding', bodas: 'Wedding', wedding: 'Wedding', discomovil: 'Mobile disco',
    empresa: 'Corporate event', empresas: 'Corporate event', corporate: 'Corporate event',
    fiesta: 'Private party', fiestas: 'Private party',
    cumpleanos: 'Birthday', cumpleanyos: 'Birthday', birthday: 'Birthday',
    communion: 'Communion', baptism: 'Baptism', graduation: 'Graduation', anniversary: 'Anniversary',
    tematizacion: 'Theming', produccion: 'Technical production', alquiler: 'Equipment rental',
    otro: 'Other', other: 'Other',
  },
};

function resolveLocale(req: NextRequest, candidate?: string): Locale {
  const c = (candidate || '').toLowerCase();
  if (c === 'ca' || c === 'es' || c === 'en') return c as Locale;
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

// Validacio de dades amb Zod
const contactSchema = (t: Record<string, string>) => z.object({
  name: z.string().min(2, t.nameTooShort).max(50),
  contact: z.string().min(3, t.enterEmailOrPhone),
  event: z.string().min(1, t.selectEventType),
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
  // Note: /api/contact is a public route (no CSRF required)
  // CSRF verification is handled by middleware for admin routes only

  const rateLimitResult = await checkRateLimit(req, RATE_LIMITS.contact);
  if (rateLimitResult) return rateLimitResult;
  let locale = resolveLocale(req);
  let t = CONTACT_COPY[locale];

  try {
    const body = await req.json();
    locale = resolveLocale(req, typeof body?.locale === 'string' ? body.locale : undefined);
    t = CONTACT_COPY[locale];
    const parsed = contactSchema(t).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: t.invalidData, details: parsed.error.format() },
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
        { error: t.captchaFailed },
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
      locale: formLocale,
    } = parsed.data;

    const isEmail = contact.includes('@');
    const clientEmail: string | undefined = isEmail ? contact : undefined;
    const clientPhone: string | undefined = isEmail ? undefined : contact.replace(/[^\d+]/g, '');

    const leadId = `OE-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toLocaleString(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-GB' : 'es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const eventLabel = EVENT_TYPE_LABELS[locale][event.toLowerCase()] || event;

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
            preferredLocale: formLocale || locale || existingLead.preferredLocale,
            updatedAt: new Date(),
          }
        });
        _savedLeadId = updatedLead.id;

        await prisma.leadNote.create({
          data: {
            leadId: updatedLead.id,
            content: `${t.noteNewWebContact}: ${eventLabel}${packName ? ` - ${t.notePack}: ${packName}` : ''}${message ? `\n${t.noteMessage}: ${message}` : ''}`,
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
            preferredLocale: formLocale || locale || 'ca',
          }
        });
        _savedLeadId = newLead.id;

        await prisma.leadNote.create({
          data: {
            leadId: newLead.id,
            content: `${t.noteLeadCreatedVia} ${packId ? t.viaConfigurator : t.viaWebForm}${packName ? ` - ${t.noteInterestedPack}: ${packName}` : ''}${!clientEmail ? ` (${t.notePhoneContact}: ${clientPhone})` : ''}`,
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

        Promise.resolve(
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
          })
        ).catch((err) => {
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
      <h1>${t.adminLeadTitle}</h1>
      <div class="lead-id">ID: ${leadId} | ${timestamp}</div>
    </div>

    <div class="content">
      <div class="field">
        <div class="field-label">${t.adminCustomer}</div>
        <div class="field-value">${escapeHtml(name)}</div>
      </div>

      <div class="field">
        <div class="field-label">${isEmail ? t.adminEmail : t.adminPhone}</div>
        <div class="field-value">${escapeHtml(contact)}</div>
      </div>

      <div class="field">
        <div class="field-label">${t.adminEventType}</div>
        <div class="field-value">${escapeHtml(eventLabel)}</div>
      </div>

      ${eventDate ? `
      <div class="field">
        <div class="field-label">${t.adminEventDate}</div>
        <div class="field-value">${eventDate}</div>
      </div>
      ` : ''}

      ${guests ? `
      <div class="field">
        <div class="field-label">${t.adminGuests}</div>
        <div class="field-value">${guests} ${t.adminPeople}</div>
      </div>
      ` : ''}

      ${message ? `
      <div class="field">
        <div class="field-label">${t.adminMessage}</div>
        <div class="field-value">${escapeHtml(message)}</div>
      </div>
      ` : ''}

      ${packName ? `
      <div class="highlight-box">
        <div class="field-label">${t.adminSelectedPack}</div>
        <div class="field-value">${escapeHtml(packName)}</div>
        ${estimatedPrice ? `<div class="price">${estimatedPrice.toLocaleString(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-GB' : 'es-ES')} EUR</div>` : ''}
        ${packId ? `<div style="font-size: 12px; color: #666; margin-top: 8px;">ID: ${escapeHtml(packId)}</div>` : ''}
      </div>
      ` : ''}

      ${extras && Array.isArray(extras) && extras.length > 0 ? `
      <div class="field">
        <div class="field-label">${t.adminRequestedExtras}</div>
        <div class="extras-list">
          ${extras.filter(e => e != null).map(e => `<span class="extra-tag">${String(e).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${clientPhone ? `
      <a href="tel:${escapeHtml(clientPhone)}" class="cta-button">${t.adminCallNow} ${escapeHtml(name)}</a>
      ` : ''}

      ${isEmail ? `
      <a href="mailto:${clientEmail}?subject=${encodeURIComponent(`${t.adminReplySubjectPrefix} - ${eventLabel}`)}" class="cta-button" style="background: #4A90D9;">
        ${t.adminReplyByEmail}
      </a>
      ` : ''}
    </div>

    <div class="footer">
      ${t.adminSystemFooter}<br>
      ${timestamp}
    </div>
  </div>
</body>
</html>`;

      const adminEmail = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();
      const smtpFrom = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

      sendEmailWithTimeout(
        {
          to: adminEmail,
          subject: `${t.adminMailSubjectPrefix}: ${name} - ${eventLabel} ${estimatedPrice ? `(${estimatedPrice} EUR)` : ''}`,
          html: adminEmailHtml,
          replyTo: clientEmail || undefined,
          from: `"${t.adminMailFrom}" <${smtpFrom}>`,
        },
        8000
      ).catch((emailError) => {
        log.error('Failed to send admin notification email', emailError, {
          context: { leadId, hasEmail: !!clientEmail }
        });
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
      <h1>${t.clientHeader}</h1>
    </div>

    <div class="content">
      <p class="greeting">${t.clientGreeting} <strong>${escapeHtml(name)}</strong>,</p>

      <p>${t.clientThanks} <strong>Orbita Events</strong>. ${t.clientReceivedFor} <strong>${escapeHtml(eventLabel)}</strong>.</p>

      <div class="info-box">
        <strong>${t.clientReference}: ${leadId}</strong><br>
        <span style="font-size: 14px; color: #666;">${t.clientSaveCode}</span>
      </div>

      <div class="step"><strong>${t.clientStep1Title}</strong><br>${t.clientStep1Text}</div>
      <div class="step"><strong>${t.clientStep2Title}</strong><br>${t.clientStep2Text}</div>
      <div class="step"><strong>${t.clientStep3Title}</strong><br>${t.clientStep3Text}</div>

      ${estimatedPrice ? `
      <div class="info-box" style="border-left-color: #25D366; background: #f0fff4;">
        <strong>${t.clientEstimatedBudget}: ${estimatedPrice.toLocaleString(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-GB' : 'es-ES')} EUR</strong><br>
        <span style="font-size: 14px; color: #666;">${t.clientEstimatedNote}</span>
      </div>
      ` : ''}

      <div class="cta-section">
        <a href="tel:${SITE_CONFIG.business.phone}" class="cta-button">${t.clientCallNow} ${SITE_CONFIG.business.phoneDisplay}</a>
      </div>
    </div>

    <div class="footer">
      <strong>Orbita Events</strong><br>
      <a href="tel:${SITE_CONFIG.business.phone}">${SITE_CONFIG.business.phoneDisplay}</a> |
      <a href="mailto:${SITE_CONFIG.business.email}">${SITE_CONFIG.business.email}</a><br><br>
      ${t.clientReasonEmail}
    </div>
  </div>
</body>
</html>`;

        sendEmailWithTimeout(
          {
            to: clientEmail,
            subject: `${t.clientMailSubjectPrefix} ${eventLabel} - Orbita Events`,
            html: clientEmailHtml,
          },
          8000
        ).catch((clientEmailError) => {
          log.error('Failed to send client confirmation email', clientEmailError, {
            context: { leadId, clientEmail }
          });
        });
      } catch (clientEmailError) {
        log.error('Failed to send client confirmation email', clientEmailError, {
          context: { leadId, clientEmail }
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: t.successMessage,
      leadId,
      estimatedResponse: t.estimatedResponse,
    });

  } catch (error) {
    log.error('[Contact API] Error:', error);

    return NextResponse.json(
      {
        error: `${t.sendError} ${SITE_CONFIG.business.phoneDisplay} ${t.retrySuffix}`,
        phone: SITE_CONFIG.business.phone,
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
