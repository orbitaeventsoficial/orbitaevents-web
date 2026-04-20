// app/api/contact/route.ts
// API de contacto - Crea leads en el modelo nuevo
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { SITE_CONFIG } from '@/app/config/site-config';
import { sendEmailWithTimeout } from '@/lib/email';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/utils/sanitize';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { persistContactLead } from '@/lib/services/contactLeadCaptureService';
import { toIntlLocale } from '@/lib/constants';
import { CONTACT_COPY, EVENT_TYPE_LABELS, resolveLocale, contactSchema, parseGuestCount, mapEventType, determineSource } from './contact-copy';


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
      email,
      phone,
      event,
      message,
      packId,
      packName,
      estimatedPrice,
      eventDate,
      guests,
      guestCount,
      extras,
      locale: formLocale,
      utmSource,
      utmMedium,
      utmCampaign,
      landingPage,
    } = parsed.data;

    const normalizedContact = contact?.trim() || '';
    const normalizedEmail = email?.trim() || '';
    const normalizedPhone = phone?.trim() || '';
    const resolvedEmail = normalizedEmail || (normalizedContact.includes('@') ? normalizedContact : '');
    const resolvedPhoneRaw = normalizedPhone || (!resolvedEmail ? normalizedContact : '');
    const clientEmail: string | undefined = resolvedEmail || undefined;
    const clientPhone: string | undefined = resolvedPhoneRaw
      ? resolvedPhoneRaw.replace(/[^\d+]/g, '')
      : undefined;
    const isEmail = Boolean(clientEmail);
    const displayContact = clientEmail || clientPhone || normalizedContact;
    const parsedGuests = parseGuestCount(guests ?? guestCount);

    const leadId = `OE-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toLocaleString(toIntlLocale(locale), {
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const eventLabel = EVENT_TYPE_LABELS[locale][event.toLowerCase()] || event;

    const mappedEventType = mapEventType(event);
    const leadSource = determineSource(packId, packName);

    const { leadId: _savedLeadId } = await persistContactLead({
      name,
      clientEmail,
      clientPhone,
      eventType: mappedEventType,
      eventDate,
      guestCount: parsedGuests,
      estimatedPrice,
      message,
      packId,
      extras,
      source: leadSource,
      preferredLocale: formLocale || locale || 'ca',
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      landingPage: landingPage || undefined,
      updateNote: `${t.noteNewWebContact}: ${eventLabel}${packName ? ` - ${t.notePack}: ${packName}` : ''}${message ? `\n${t.noteMessage}: ${message}` : ''}`,
      createNote: `${t.noteLeadCreatedVia} ${packId ? t.viaConfigurator : t.viaWebForm}${packName ? ` - ${t.noteInterestedPack}: ${packName}` : ''}${!clientEmail ? ` (${t.notePhoneContact}: ${clientPhone})` : ''}`,
    });
    if (_savedLeadId && clientEmail) {
      try {
        const { notifyNewLead } = await import('@/lib/services/notificationService');

        Promise.resolve(
          notifyNewLead({
            id: _savedLeadId,
            name,
            email: clientEmail,
            phone: clientPhone,
            eventType: mappedEventType,
            eventDate: eventDate ? new Date(eventDate) : undefined,
            guestCount: parsedGuests,
            budget: estimatedPrice ? `${estimatedPrice} EUR` : undefined,
            message,
            source: leadSource,
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
        <div class="field-value">${escapeHtml(displayContact)}</div>
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

      ${parsedGuests ? `
      <div class="field">
        <div class="field-label">${t.adminGuests}</div>
        <div class="field-value">${parsedGuests} ${t.adminPeople}</div>
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
        ${estimatedPrice ? `<div class="price">${estimatedPrice.toLocaleString(toIntlLocale(locale))} EUR</div>` : ''}
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
        <strong>${t.clientEstimatedBudget}: ${estimatedPrice.toLocaleString(toIntlLocale(locale))} EUR</strong><br>
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


