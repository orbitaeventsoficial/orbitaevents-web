// app/api/contact/route.ts
// API de contacto - Crea Leads al model nou
import { NextRequest, NextResponse } from "next/server";
import { SITE_CONFIG } from '@/config/site-config';
import { z } from "zod";
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { EventType, LeadSource } from '@prisma/client';

// Validación de datos con Zod
const contactSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto").max(50),
  contact: z.string().min(3, "Introduce email o teléfono"),
  event: z.string().min(1, "Selecciona tipo de evento"),
  message: z.string().optional(),
  // Campos opcionales del configurador
  packId: z.string().optional(),
  packName: z.string().optional(),
  estimatedPrice: z.number().optional(),
  eventDate: z.string().optional(),
  guests: z.number().optional(),
  extras: z.array(z.string()).optional(),
  // Locale preferit
  locale: z.string().optional(),
});

// Mapeo de tipos de evento para emails bonitos
const EVENT_TYPE_LABELS: Record<string, string> = {
  boda: "💍 Boda",
  bodas: "💍 Boda",
  wedding: "💍 Boda",
  discomovil: "🎵 Discomóvil",
  empresa: "🎯 Evento Corporativo",
  empresas: "🎯 Evento Corporativo",
  corporate: "🎯 Evento Corporativo",
  fiesta: "🎊 Fiesta Privada",
  fiestas: "🎊 Fiesta Privada",
  cumpleaños: "🎂 Cumpleaños",
  cumpleanyos: "🎂 Cumpleaños",
  birthday: "🎂 Cumpleaños",
  communion: "⛪ Comunión",
  baptism: "👶 Bautizo",
  graduation: "🎓 Graduación",
  anniversary: "🎉 Aniversario",
  tematizacion: "🎃 Tematización",
  produccion: "🎬 Producción Técnica",
  alquiler: "🎤 Alquiler de Equipo",
  otro: "📋 Otro",
  other: "📋 Otro",
};

// Helper per mapejar string a enum EventType de Prisma
function mapEventType(eventStr: string): EventType {
  const normalized = eventStr.toLowerCase();
  if (normalized.includes('boda') || normalized.includes('wedding')) return 'WEDDING';
  if (normalized.includes('empresa') || normalized.includes('corporativ') || normalized.includes('corporate')) return 'CORPORATE';
  if (normalized.includes('cumpleaños') || normalized.includes('cumpleanyos') || normalized.includes('birthday')) return 'BIRTHDAY';
  if (normalized.includes('comunion') || normalized.includes('communion')) return 'COMMUNION';
  if (normalized.includes('bautizo') || normalized.includes('baptism')) return 'BAPTISM';
  if (normalized.includes('graduacion') || normalized.includes('graduation')) return 'GRADUATION';
  if (normalized.includes('aniversari') || normalized.includes('anniversary')) return 'ANNIVERSARY';
  if (normalized.includes('fiesta') || normalized.includes('discomovil') || normalized.includes('party')) return 'PRIVATE_PARTY';
  return 'OTHER';
}

// Determinar source basant-se en el context
function determineSource(packId?: string, packName?: string): LeadSource {
  if (packId || packName) return 'CONFIGURATOR';
  return 'WEBSITE';
}

export async function POST(req: NextRequest) {
  // Rate limiting: 5 requests per 5 minuts
  const rateLimitResult = checkRateLimit(req, RATE_LIMITS.contact);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
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
      locale
    } = parsed.data;

    // Detectar si és un email o un telèfon
    const isEmail = contact.includes("@");
    const clientEmail = isEmail ? contact : `temp-${Date.now()}@orbitaevents.com`;
    const clientPhone = isEmail ? null : contact.replace(/[^\d+]/g, '');

    // Generar ID únic per al lead
    const leadId = `OE-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    // Label bonic del event
    const eventLabel = EVENT_TYPE_LABELS[event.toLowerCase()] || event;

    // ===============================================
    // GUARDAR EN BASE DE DADES
    // ===============================================

    let _savedLeadId: string | null = null;

    try {
      // Buscar si ja existeix un lead amb el mateix email
      const existingLead = isEmail ? await prisma.lead.findFirst({
        where: { email: clientEmail }
      }) : null;

      if (existingLead) {
        // Actualitzar lead existent
        const updatedLead = await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            name,
            phone: clientPhone || existingLead.phone,
            eventType: mapEventType(event),
            eventDate: eventDate ? new Date(eventDate) : existingLead.eventDate,
            guestCount: guests || existingLead.guestCount,
            budget: estimatedPrice ? `${estimatedPrice}€` : existingLead.budget,
            message: message || existingLead.message,
            interestedPackId: packId || existingLead.interestedPackId,
            interestedExtras: extras && extras.length > 0 ? extras : existingLead.interestedExtras,
            source: determineSource(packId, packName),
            preferredLocale: locale || existingLead.preferredLocale,
            updatedAt: new Date(),
          }
        });
        _savedLeadId = updatedLead.id;

        // Afegir nota del nou contacte
        await prisma.leadNote.create({
          data: {
            leadId: updatedLead.id,
            content: `Nou contacte via web: ${eventLabel}${packName ? ` - Pack: ${packName}` : ''}${message ? `\nMissatge: ${message}` : ''}`,
          }
        });
      } else {
        // Crear nou lead
        const newLead = await prisma.lead.create({
          data: {
            name,
            email: clientEmail,
            phone: clientPhone,
            eventType: mapEventType(event),
            eventDate: eventDate ? new Date(eventDate) : null,
            guestCount: guests,
            budget: estimatedPrice ? `${estimatedPrice}€` : null,
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

        // Afegir nota inicial
        await prisma.leadNote.create({
          data: {
            leadId: newLead.id,
            content: `Lead creat via ${packId ? 'configurador' : 'formulari web'}${packName ? ` - Pack interessat: ${packName}` : ''}`,
          }
        });
      }

    } catch (dbError) {
      // Continuar amb l'enviament d'emails encara que falli la BBDD
    }

    // ===============================================
    // EMAIL AL ADMINISTRADOR (TÚ) - FITXA COMPLETA
    // ===============================================

    const adminEmailHtml = `
<!DOCTYPE html>
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
    .price { font-size: 32px; font-weight: bold; color: #DAA520; }
    .extras-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .extra-tag { background: #DAA520; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .cta-button { display: block; background: #25D366; color: #fff; text-align: center; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 NOU LEAD</h1>
      <div class="lead-id">ID: ${leadId} | ${timestamp}</div>
    </div>

    <div class="content">
      <div class="field">
        <div class="field-label">Client</div>
        <div class="field-value">${name}</div>
      </div>

      <div class="field">
        <div class="field-label">${isEmail ? 'Email' : 'Telèfon'}</div>
        <div class="field-value">${contact}</div>
      </div>

      <div class="field">
        <div class="field-label">Tipus d'Esdeveniment</div>
        <div class="field-value">${eventLabel}</div>
      </div>

      ${eventDate ? `
      <div class="field">
        <div class="field-label">Data de l'Esdeveniment</div>
        <div class="field-value">📅 ${eventDate}</div>
      </div>
      ` : ''}

      ${guests ? `
      <div class="field">
        <div class="field-label">Nombre de Convidats</div>
        <div class="field-value">👥 ${guests} persones</div>
      </div>
      ` : ''}

      ${message ? `
      <div class="field">
        <div class="field-label">Missatge</div>
        <div class="field-value">${message}</div>
      </div>
      ` : ''}

      ${packName ? `
      <div class="highlight-box">
        <div class="field-label">Pack Seleccionat</div>
        <div class="field-value">${packName}</div>
        ${estimatedPrice ? `<div class="price">${estimatedPrice.toLocaleString('es-ES')}€</div>` : ''}
        ${packId ? `<div style="font-size: 12px; color: #666; margin-top: 8px;">ID: ${packId}</div>` : ''}
      </div>
      ` : ''}

      ${extras && extras.length > 0 ? `
      <div class="field">
        <div class="field-label">Extras Sol·licitats</div>
        <div class="extras-list">
          ${extras.map(e => `<span class="extra-tag">${e}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${clientPhone ? `
      <a href="tel:${clientPhone}" class="cta-button">
        📱 Trucar a ${name}
      </a>
      ` : ''}

      ${isEmail ? `
      <a href="mailto:${clientEmail}?subject=${encodeURIComponent(`Re: La teva sol·licitud a Òrbita Events - ${eventLabel}`)}" class="cta-button" style="background: #4A90D9;">
        ✉️ Respondre per Email
      </a>
      ` : ''}
    </div>

    <div class="footer">
      Òrbita Events | Sistema de Leads Automatitzat<br>
      ${timestamp}
    </div>
  </div>
</body>
</html>
    `;

    // Enviar email al admin
    await sendEmail({
      to: process.env.CONTACT_TO || SITE_CONFIG.business.email,
      subject: `🎉 NOU LEAD: ${name} - ${eventLabel} ${estimatedPrice ? `(${estimatedPrice}€)` : ''}`,
      html: adminEmailHtml,
      replyTo: isEmail ? clientEmail : undefined,
      from: `"Òrbita Events Web" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    });

    // ===============================================
    // EMAIL DE CONFIRMACIÓ AL CLIENT (si és email)
    // ===============================================

    if (isEmail) {
      const clientEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a1a, #2a2a2a); padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #DAA520; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; margin-bottom: 20px; }
    .info-box { background: #f8f8f8; border-left: 4px solid #DAA520; padding: 20px; margin: 20px 0; border-radius: 0 12px 12px 0; }
    .timeline { margin: 30px 0; }
    .timeline-item { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .timeline-icon { width: 32px; height: 32px; background: #DAA520; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; color: #000; font-weight: bold; }
    .timeline-text { font-size: 14px; color: #666; }
    .timeline-text strong { color: #333; display: block; margin-bottom: 4px; }
    .cta-section { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: #DAA520; color: #000; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .footer { background: #1a1a1a; color: #999; padding: 30px; text-align: center; font-size: 12px; }
    .footer a { color: #DAA520; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Missatge Rebut! ✨</h1>
    </div>

    <div class="content">
      <p class="greeting">Hola <strong>${name}</strong>,</p>

      <p>Gràcies per contactar amb <strong>Òrbita Events</strong>! Hem rebut la teva sol·licitud per a <strong>${eventLabel}</strong> i estem il·lusionats de poder ajudar-te a crear un esdeveniment inoblidable.</p>

      <div class="info-box">
        <strong>📋 La teva referència: ${leadId}</strong><br>
        <span style="font-size: 14px; color: #666;">Guarda aquest codi per a qualsevol consulta</span>
      </div>

      <div class="timeline">
        <h3 style="color: #DAA520; margin-bottom: 20px;">⏱️ Què passa ara?</h3>

        <div class="timeline-item">
          <div class="timeline-icon">1</div>
          <div class="timeline-text">
            <strong>Revisem la teva sol·licitud</strong>
            En les pròximes hores analitzem les teves necessitats
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-icon">2</div>
          <div class="timeline-text">
            <strong>Et contactem en menys de 2 hores</strong>
            Fins i tot caps de setmana. Resposta ultra-ràpida garantida
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-icon">3</div>
          <div class="timeline-text">
            <strong>Pressupost personalitzat</strong>
            T'enviem proposta detallada adaptada al teu event
          </div>
        </div>
      </div>

      ${estimatedPrice ? `
      <div class="info-box" style="border-left-color: #25D366; background: #f0fff4;">
        <strong>💰 Pressupost estimat: ${estimatedPrice.toLocaleString('es-ES')}€</strong><br>
        <span style="font-size: 14px; color: #666;">*Preu orientatiu. Et confirmarem el preu final al nostre email.</span>
      </div>
      ` : ''}

      <div class="cta-section">
        <p style="margin-bottom: 16px; color: #666;">Tens pressa? Truca'ns directament:</p>
        <a href="tel:${SITE_CONFIG.business.phone}" class="cta-button" style="background: #D7B86E; color: #000;">
          📱 Trucar ara al ${SITE_CONFIG.business.phoneDisplay}
        </a>
      </div>
    </div>

    <div class="footer">
      <strong>Òrbita Events</strong><br>
      L'Esdeveniment Que La Teva Gent NO Oblidarà<br><br>

      📞 <a href="tel:${SITE_CONFIG.business.phone}">${SITE_CONFIG.business.phoneDisplay}</a> |
      ✉️ <a href="mailto:${SITE_CONFIG.business.email}">${SITE_CONFIG.business.email}</a><br><br>

      <p style="margin-top: 20px; font-size: 10px; color: #666;">
        Has rebut aquest email perquè vas sol·licitar informació a orbitaevents.com.<br>
        Si no vas ser tu, ignora aquest missatge.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      await sendEmail({
        to: clientEmail,
        subject: `✅ Rebut! La teva sol·licitud per ${eventLabel} - Òrbita Events`,
        html: clientEmailHtml,
      });
    }

    // ===============================================
    // RESPOSTA EXITOSA
    // ===============================================

    return NextResponse.json({
      ok: true,
      message: "Missatge enviat amb èxit",
      leadId: leadId,
      estimatedResponse: "2-4 hores"
    });

  } catch {
    return NextResponse.json(
      {
        error: `Error al enviar el missatge. Si us plau, truca'ns al ${SITE_CONFIG.business.phoneDisplay} o torna a intentar-ho.`,
        phone: SITE_CONFIG.business.phone
      },
      { status: 500 }
    );
  }
}
