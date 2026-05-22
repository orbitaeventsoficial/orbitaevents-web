import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { formatCurrencyExact } from '@/lib/constants';
import {
  createQuoteFromLead,
  generateQuoteHTML,
  generateQuoteNumber,
  type QuoteExtra,
} from '@/lib/services/documentService';
import { resolveQuotePack } from '@/lib/services/quotes/quotePack';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { SITE_CONFIG } from '@/app/config/site-config';
import { translateHtmlForLocale, translateTextForLocale } from '@/lib/services/translationService';
import { normalizeEmail, normalizePhone } from '@/lib/utils/normalize';
import { mapLeadEventType, normalizeQuoteLocale, parseDateOrNull } from '@/lib/services/quotes/quoteParsing';
import { ensureQuoteFollowUpTask } from '@/lib/services/tasks/quoteFollowUp';
import { recordCustomerQuoteSent } from '@/lib/services/customerActivityService';
import { recordLeadQuoteSent } from '@/lib/services/leadActivityService';

type ExtraInput = {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
};

type AdminQuoteEmailPayload = {
  leadId?: string;
  customerId?: string;
  to?: string;
  customerName?: string;
  customerPhone?: string;
  eventType?: string;
  eventDate?: string | Date | null;
  eventSchedule?: string | null;
  eventLocation?: string | null;
  guestCount?: number | string | null;
  packId?: string;
  price?: number;
  extras?: unknown;
  notes?: string | null;
  customMessage?: string | null;
  locale?: string | null;
};

function mergeNotes(parts: Array<string | undefined | null>): string | undefined {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean) as string[];
  return filtered.length ? filtered.join('\n\n') : undefined;
}

function resolveLocalizedExtra(
  translations: Array<{ locale: string; name: string; description: string | null }>,
  locale: string
) {
  const normalized = locale.toLowerCase();
  return (
    translations.find((t) => t.locale.toLowerCase() === normalized) ||
    translations.find((t) => t.locale.toLowerCase().startsWith(normalized.slice(0, 2))) ||
    translations.find((t) => t.locale === 'ca') ||
    translations.find((t) => t.locale === 'es') ||
    translations.find((t) => t.locale === 'en') ||
    translations[0]
  );
}

async function normalizeExtras(extras: unknown, locale: string): Promise<QuoteExtra[] | undefined> {
  if (!Array.isArray(extras) || extras.length === 0) return undefined;

  const hasObjectExtras = extras.some((extra) => typeof extra === 'object' && extra !== null);
  if (hasObjectExtras) {
    return extras
      .map((extra: ExtraInput) => ({
        name: String(extra.name || ''),
        description: extra.description ? String(extra.description) : undefined,
        price: Number(extra.price || 0),
        quantity: Number(extra.quantity || 1),
      }))
      .filter((extra) => extra.name.trim().length > 0);
  }

  const slugs = extras.map((extra) => String(extra)).filter(Boolean);
  const dbExtras = await prisma.extra.findMany({
    where: { slug: { in: slugs } },
    include: { translations: true },
  });

  if (dbExtras.length !== slugs.length) {
    const found = new Set(dbExtras.map((extra) => extra.slug));
    const missing = slugs.filter((slug) => !found.has(slug));
    throw new Error(`Missing extras: ${missing.join(', ')}`);
  }

  return dbExtras.map((extra) => {
    const localized = resolveLocalizedExtra(extra.translations, locale);
    return {
      name: localized?.name || extra.slug,
      description: localized?.description || undefined,
      price: extra.price,
      quantity: 1,
    };
  });
}

export async function sendAdminQuoteEmail(body: AdminQuoteEmailPayload | undefined) {
  const {
    leadId,
    customerId,
    to,
    customerName,
    customerPhone,
    eventType,
    eventDate,
    eventSchedule,
    eventLocation,
    guestCount,
    packId,
    price,
    extras,
    notes,
    customMessage,
    locale,
  } = body || {};

  if ((!leadId && !customerId && !to) || !packId || typeof price !== 'number') {
    return {
      ok: false as const,
      status: 400,
      body: { error: 'Falten camps obligatoris: (leadId o customerId o email), packId, price' },
    };
  }

  const template = await getQuoteTemplateSettings();
  let lead = leadId ? await prisma.lead.findUnique({ where: { id: String(leadId) } }) : null;
  let customer = customerId
    ? await prisma.customer.findUnique({
        where: { id: String(customerId) },
        select: { id: true, name: true, email: true, preferredLocale: true },
      })
    : null;
  let recipientEmail = to;
  let recipientName = String(customerName || 'Client').trim() || 'Client';

  if (leadId && !lead) {
    return { ok: false as const, status: 404, body: { error: 'Lead no trobat' } };
  }

  if (lead) {
    recipientEmail = lead.email;
    recipientName = lead.name;
  } else if (customer) {
    recipientEmail = customer.email || recipientEmail;
    recipientName = customer.name || recipientName;
  }

  if (!recipientEmail) {
    return { ok: false as const, status: 400, body: { error: 'No hi ha correu de desti del client' } };
  }

  if (!customer && !lead) {
    const normalizedEmail = normalizeEmail(recipientEmail);
    const normalizedPhone = customerPhone ? normalizePhone(String(customerPhone)) : null;
    customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { emailNormalized: normalizedEmail },
          ...(normalizedPhone ? [{ phoneNormalized: normalizedPhone }] : []),
        ],
      },
      select: { id: true, name: true, email: true, preferredLocale: true },
    });
    if (customer && !recipientName.trim()) recipientName = customer.name || recipientName;
  }

  if (lead && customer && lead.customerId !== customer.id) {
    lead = await prisma.lead.update({ where: { id: lead.id }, data: { customerId: customer.id } });
  }

  const resolvedLocale = normalizeQuoteLocale(lead?.preferredLocale || customer?.preferredLocale || locale || 'ca');

  if (!lead && customer?.id) {
    const reusableLead = await prisma.lead.findFirst({
      where: {
        OR: [{ customerId: customer.id }, { email: recipientEmail }],
        status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (reusableLead) {
      lead = reusableLead;
    } else {
      lead = await prisma.lead.create({
        data: {
          customerId: customer.id,
          name: recipientName,
          email: recipientEmail,
          phone: customerPhone ? String(customerPhone) : null,
          eventType: mapLeadEventType(eventType || packId),
          eventDate: parseDateOrNull(eventDate),
          eventSchedule: eventSchedule ? String(eventSchedule) : null,
          eventLocation: eventLocation ? String(eventLocation) : null,
          guestCount: Number.isFinite(Number(guestCount)) ? Math.max(0, Math.round(Number(guestCount))) : null,
          budget: Number.isFinite(Number(price)) ? String(Number(price).toFixed(2)) : null,
          message: customMessage ? String(customMessage) : null,
          interestedPackId: packId ? String(packId) : null,
          interestedExtras: [],
          source: 'OTHER',
          status: 'QUOTE_SENT',
          preferredLocale: resolvedLocale,
        },
      });
    }
  }

  const activeLeadId = lead?.id || null;
  const emailCountBefore = activeLeadId
    ? await prisma.leadActivity.count({ where: { leadId: activeLeadId, type: 'EMAIL' } })
    : 0;
  const packDataBase = await resolveQuotePack(String(packId).toLowerCase(), resolvedLocale);
  const packData = { ...packDataBase, price };
  const quoteExtras = await normalizeExtras(extras, resolvedLocale);

  const quoteData = lead
    ? createQuoteFromLead(lead, packData, quoteExtras)
    : {
        clientName: recipientName,
        clientEmail: recipientEmail,
        eventType: resolvedLocale.startsWith('en') ? 'Event' : resolvedLocale.startsWith('es') ? 'Evento' : 'Esdeveniment',
        eventDate: new Date(),
        eventLocation: '',
        guestCount: 0,
        packName: packData.name,
        packDescription: packData.description,
        packPrice: packData.price,
        djHours: packData.djHours,
        extraHourPrice: packData.extraHourPrice,
        extras: quoteExtras || [],
        subtotal: price,
        iva: price * 0.21,
        total: price * 1.21,
        quoteNumber: '',
        notes: undefined as string | undefined,
        validUntil: new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000),
      };

  quoteData.quoteNumber = generateQuoteNumber();
  quoteData.validUntil = new Date(Date.now() + template.validityDays * 24 * 60 * 60 * 1000);
  quoteData.notes = mergeNotes([customMessage, notes, lead?.message || undefined]);

  if (lead) {
    const targetLeadId = lead.id;
    await prisma.lead.update({ where: { id: targetLeadId }, data: { status: 'QUOTE_SENT', updatedAt: new Date() } });
    await prisma.leadNote.create({
      data: {
        leadId: targetLeadId,
        content: `📄 Pressupost enviat: ${quoteData.quoteNumber}\n💰 Total: ${formatCurrencyExact(quoteData.total)}\n📦 Pack: ${packData.name}`,
      },
    });
    const documentTitle = `Pressupost ${quoteData.quoteNumber}`;
    await prisma.leadDocument.create({
      data: {
        leadId: targetLeadId,
        type: 'QUOTE',
        source: 'MANUAL',
        title: documentTitle,
        fileUrl: `quote-email:${quoteData.quoteNumber}`,
        filePath: `lead/${targetLeadId}/quote/${quoteData.quoteNumber}`,
        mimeType: 'text/html',
        createdBy: 'Admin',
      },
    });
    await recordLeadQuoteSent({
      leadId: targetLeadId,
      quoteNumber: quoteData.quoteNumber,
      to: recipientEmail,
      total: quoteData.total,
    });
    if (lead.customerId) {
      await recordCustomerQuoteSent({
        customerId: lead.customerId,
        leadId: targetLeadId,
        quoteNumber: quoteData.quoteNumber,
        total: quoteData.total,
      });
    }
    await ensureQuoteFollowUpTask({
      title: `Seguiment pressupost ${quoteData.quoteNumber}`,
      description: 'Fer seguiment comercial del pressupost enviat.',
      leadId: targetLeadId,
      customerId: lead.customerId,
    });
  }

  if (!lead && customer?.id) {
    await recordCustomerQuoteSent({
      customerId: customer.id,
      quoteNumber: quoteData.quoteNumber,
      total: quoteData.total,
      to: recipientEmail,
      source: 'email_quote_route',
    });
  }

  const html = generateQuoteHTML(quoteData, {
    introTitle: template.introTitle,
    introSubtitle: template.introSubtitle,
    ctaTitle: template.ctaTitle,
    ctaSubtitle: template.ctaSubtitle,
    conditions: template.conditions,
  });
  const translatedHtml = await translateHtmlForLocale(html, resolvedLocale);
  const translatedSubject = await translateTextForLocale(`Pressupost ${quoteData.quoteNumber} - Òrbita Events`, resolvedLocale);

  await sendEmail({
    to: recipientEmail,
    subject: translatedSubject,
    html: translatedHtml,
    replyTo: (process.env.CONTACT_TO || '').trim() || undefined,
    brandingStyle: emailCountBefore === 0 ? 'hero' : 'soft',
  });

  let adminCopySent = false;
  if (template.sendAdminCopy) {
    const copyRecipient = template.adminCopyEmail || process.env.CONTACT_TO || SITE_CONFIG.business.email;
    if (copyRecipient && copyRecipient !== recipientEmail) {
      await sendEmail({
        to: copyRecipient,
        subject: `[Còpia] Pressupost ${quoteData.quoteNumber} · ${recipientName}`,
        html: translatedHtml,
        replyTo: recipientEmail,
        brandingStyle: 'soft',
      });
      adminCopySent = true;
    }
  }

  return {
    ok: true as const,
    status: 200,
    body: {
      ok: true,
      quoteNumber: quoteData.quoteNumber,
      total: quoteData.total,
      adminCopySent,
    },
  };
}
