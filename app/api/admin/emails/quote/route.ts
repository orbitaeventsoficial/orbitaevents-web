// app/api/admin/emails/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { requireAuth } from '@/lib/auth';
import {
  createQuoteFromLead,
  generateQuoteHTML,
  generateQuoteNumber,
  type QuoteExtra,
} from '@/lib/services/documentService';
import { getDbPackByCode, getDbPacks } from '@/lib/packs-db';
import type { PackDefinition } from '@/config/packs-config';
import { getQuoteTemplateSettings } from '@/lib/services/quoteTemplateService';
import { SITE_CONFIG } from '@/app/config/site-config';
import { translateHtmlForLocale, translateTextForLocale } from '@/lib/services/translationService';
import type { EventType } from '@prisma/client';
import { normalizeEmail, normalizePhone } from '@/lib/utils/normalize';

type QuotePack = {
  name: string;
  price: number;
  djHours: number;
  extraHourPrice: number;
  description: string;
};

function mapLeadEventType(raw: unknown): EventType {
  const value = String(raw || '').toLowerCase();
  if (value === 'bodas' || value === 'wedding') return 'WEDDING';
  if (value === 'empresas' || value === 'corporate') return 'CORPORATE';
  if (value === 'fiestas' || value === 'private_party') return 'PRIVATE_PARTY';
  return 'OTHER';
}

function normalizeLocale(raw: unknown): string {
  const value = String(raw || 'ca').toLowerCase();
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('en')) return 'en';
  return 'ca';
}

function parseDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function packToQuotePack(pack: PackDefinition | undefined): QuotePack {
  if (!pack) {
    return {
      name: 'Servei DJ Professional',
      price: 500,
      djHours: 4,
      extraHourPrice: 80,
      description: 'Servei DJ complet amb so i il·luminació',
    };
  }

  return {
    name: pack.name,
    price: pack.priceValue ?? 500,
    djHours: pack.durationHours ?? 4,
    extraHourPrice: 80,
    description: pack.emotion || pack.tagline || pack.name,
  };
}

async function resolvePack(packKey: string, locale?: string): Promise<QuotePack> {
  const pack = await getDbPackByCode(packKey, locale || 'ca');
  if (pack) return packToQuotePack(pack);

  const fallback = await getDbPacks({ service: 'fiestas', locale: locale || 'ca' });
  return packToQuotePack(fallback[0]);
}

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

interface ExtraInput {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
}

async function normalizeExtras(extras: unknown, locale: string): Promise<QuoteExtra[] | undefined> {
  if (!Array.isArray(extras) || extras.length === 0) return undefined;

  const hasObjectExtras = extras.some(
    (extra) => typeof extra === 'object' && extra !== null
  );

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

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      leadId,
      customerId,
      to, // Manual email when no lead
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

    // Need either leadId or customerId or manual email
    if ((!leadId && !customerId && !to) || !packId || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Falten camps obligatoris: (leadId o customerId o email), packId, price' },
        { status: 400 }
      );
    }

    const template = await getQuoteTemplateSettings();

    // Get lead if provided; if sending from customer without lead, create or reuse one.
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
      return NextResponse.json({ error: 'Lead no trobat' }, { status: 404 });
    }

    if (lead) {
      recipientEmail = lead.email;
      recipientName = lead.name;
    } else if (customer) {
      recipientEmail = customer.email || recipientEmail;
      recipientName = customer.name || recipientName;
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No hi ha correu de desti del client' }, { status: 400 });
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
      if (customer && !recipientName.trim()) {
        recipientName = customer.name || recipientName;
      }
    }

    if (lead && customer && lead.customerId !== customer.id) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { customerId: customer.id },
      });
    }

    const resolvedLocale = normalizeLocale(
      lead?.preferredLocale || customer?.preferredLocale || locale || 'ca'
    );

    if (!lead && customer?.id) {
      const reusableLead = await prisma.lead.findFirst({
        where: {
          OR: [
            { customerId: customer.id },
            { email: recipientEmail },
          ],
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
      ? await prisma.leadActivity.count({
          where: { leadId: activeLeadId, type: 'EMAIL' },
        })
      : 0;
    const packDataBase = await resolvePack(String(packId).toLowerCase(), resolvedLocale);
    const packData = {
      ...packDataBase,
      price,
    };

    const quoteExtras = await normalizeExtras(extras, resolvedLocale);

    // Create quote data - use lead if available, otherwise minimal data
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

    // Persist lead-side trail for every quote linked to a lead.
    if (lead) {
      const targetLeadId = lead.id;

      await prisma.lead.update({
        where: { id: targetLeadId },
        data: { status: 'QUOTE_SENT', updatedAt: new Date() },
      });

      await prisma.leadNote.create({
        data: {
          leadId: targetLeadId,
          content: `📄 Pressupost enviat: ${quoteData.quoteNumber}\n💰 Total: ${quoteData.total.toFixed(2)}€\n📦 Pack: ${packData.name}`,
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

      await prisma.leadActivity.create({
        data: {
          leadId: targetLeadId,
          type: 'EMAIL',
          title: 'Pressupost enviat',
          description: documentTitle,
          metadata: {
            quoteNumber: quoteData.quoteNumber,
            to: recipientEmail,
            total: quoteData.total,
            source: 'email_quote_route',
          },
          createdBy: 'Admin',
        },
      });

      if (lead.customerId) {
        await prisma.customerActivity.create({
          data: {
            customerId: lead.customerId,
            action: 'QUOTE_SENT',
            details: {
              leadId: targetLeadId,
              quoteNumber: quoteData.quoteNumber,
              total: quoteData.total,
            },
          },
        });
      }

      // Seguiment automàtic 48h després d'enviar pressupost.
      const followUpTitle = `Seguiment pressupost ${quoteData.quoteNumber}`;
      const followUpDueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      if (lead.customerId) {
        try {
          const existingTask = await prisma.task.findFirst({
            where: {
              customerId: lead.customerId,
              leadId: targetLeadId,
              title: followUpTitle,
              status: { in: ['OPEN', 'IN_PROGRESS'] },
            },
            select: { id: true },
          });
          if (!existingTask) {
            await prisma.task.create({
              data: {
                customerId: lead.customerId,
                leadId: targetLeadId,
                title: followUpTitle,
                description: 'Fer seguiment comercial del pressupost enviat.',
                dueDate: followUpDueDate,
                status: 'OPEN',
                priority: 'MEDIUM',
                createdBy: 'Sistema',
              },
            });
          }
        } catch {
          const legacyTask = await prisma.leadTask.findFirst({
            where: {
              leadId: targetLeadId,
              title: followUpTitle,
              status: { in: ['OPEN', 'IN_PROGRESS'] },
            },
            select: { id: true },
          });
          if (!legacyTask) {
            await prisma.leadTask.create({
              data: {
                leadId: targetLeadId,
                title: followUpTitle,
                description: 'Fer seguiment comercial del pressupost enviat.',
                dueDate: followUpDueDate,
                status: 'OPEN',
                priority: 'MEDIUM',
                createdBy: 'Sistema',
              },
            });
          }
        }
      } else {
        const legacyTask = await prisma.leadTask.findFirst({
          where: {
            leadId: targetLeadId,
            title: followUpTitle,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
          select: { id: true },
        });
        if (!legacyTask) {
          await prisma.leadTask.create({
            data: {
              leadId: targetLeadId,
              title: followUpTitle,
              description: 'Fer seguiment comercial del pressupost enviat.',
              dueDate: followUpDueDate,
              status: 'OPEN',
              priority: 'MEDIUM',
              createdBy: 'Sistema',
            },
          });
        }
      }
    }

    if (!lead && customer?.id) {
      await prisma.customerActivity.create({
        data: {
          customerId: customer.id,
          action: 'QUOTE_SENT',
          details: {
            quoteNumber: quoteData.quoteNumber,
            total: quoteData.total,
            to: recipientEmail,
            source: 'email_quote_route',
          },
        },
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
    const translatedSubject = await translateTextForLocale(
      `Pressupost ${quoteData.quoteNumber} - Òrbita Events`,
      resolvedLocale
    );

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

    return NextResponse.json({
      ok: true,
      quoteNumber: quoteData.quoteNumber,
      total: quoteData.total,
      adminCopySent,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Missing extras:')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    if (error instanceof Error && /timeout/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Timeout SMTP enviant pressupost. Revisa configuració SMTP (host/port/firewall).' },
        { status: 504 }
      );
    }

    log.error('Error enviant pressupost:', error);
    return NextResponse.json(
      { error: error instanceof Error ? `Error enviant pressupost: ${error.message}` : 'Error enviant pressupost' },
      { status: 500 }
    );
  }
}




