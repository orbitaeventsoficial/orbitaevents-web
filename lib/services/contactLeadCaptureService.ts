import type { EventType, LeadSource, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { normalizeEmail, normalizeName, normalizePhone } from '@/lib/utils/normalize';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { recordCustomerLeadCreated } from '@/lib/services/customerActivityService';

type PersistContactLeadInput = {
  name: string;
  clientEmail?: string;
  clientPhone?: string;
  eventType: EventType;
  eventDate?: string;
  guestCount?: number;
  estimatedPrice?: number;
  message?: string;
  packId?: string;
  extras?: string[];
  source: LeadSource;
  preferredLocale: string;
  updateNote: string;
  createNote: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
};

type PersistContactLeadResult = {
  leadId: string | null;
};

export async function persistContactLead(input: PersistContactLeadInput): Promise<PersistContactLeadResult> {
  let savedLeadId: string | null = null;

  try {
    const existingLead = input.clientEmail
      ? await prisma.lead.findFirst({
          where: { email: input.clientEmail },
        })
      : null;

    if (existingLead) {
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: input.name,
          phone: input.clientPhone || existingLead.phone,
          eventType: input.eventType,
          eventDate: input.eventDate ? new Date(input.eventDate) : existingLead.eventDate,
          guestCount: input.guestCount || existingLead.guestCount,
          budget: input.estimatedPrice ? `${input.estimatedPrice} EUR` : existingLead.budget,
          message: input.message || existingLead.message,
          interestedPackId: input.packId || existingLead.interestedPackId,
          interestedExtras: input.extras && input.extras.length > 0 ? input.extras : existingLead.interestedExtras,
          source: input.source,
          preferredLocale: input.preferredLocale || existingLead.preferredLocale,
          utmSource: input.utmSource || existingLead.utmSource,
          utmMedium: input.utmMedium || existingLead.utmMedium,
          utmCampaign: input.utmCampaign || existingLead.utmCampaign,
          landingPage: input.landingPage || existingLead.landingPage,
          updatedAt: new Date(),
        },
      });
      savedLeadId = updatedLead.id;

      await prisma.leadNote.create({
        data: {
          leadId: updatedLead.id,
          content: input.updateNote,
        },
      });
    } else {
      const emailForDb = input.clientEmail || `phone-${input.clientPhone}${PLACEHOLDER_EMAIL_DOMAIN}`;

      const newLead = await prisma.lead.create({
        data: {
          name: input.name,
          email: emailForDb,
          phone: input.clientPhone,
          eventType: input.eventType,
          eventDate: input.eventDate ? new Date(input.eventDate) : null,
          guestCount: input.guestCount,
          budget: input.estimatedPrice ? `${input.estimatedPrice} EUR` : null,
          message: input.message,
          interestedPackId: input.packId,
          interestedExtras: input.extras || [],
          source: input.source,
          status: 'NEW',
          priority: 'MEDIUM',
          preferredLocale: input.preferredLocale || 'ca',
          utmSource: input.utmSource || null,
          utmMedium: input.utmMedium || null,
          utmCampaign: input.utmCampaign || null,
          landingPage: input.landingPage || null,
        },
      });
      savedLeadId = newLead.id;

      await prisma.leadNote.create({
        data: {
          leadId: newLead.id,
          content: input.createNote,
        },
      });
    }

    if (savedLeadId && input.clientEmail && !input.clientEmail.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
      try {
        const emailNorm = normalizeEmail(input.clientEmail);
        const nameNorm = normalizeName(input.name);
        const phoneNorm = input.clientPhone ? normalizePhone(input.clientPhone) : null;

        const customer = await prisma.customer.upsert({
          where: { emailNormalized: emailNorm },
          update: {
            name: input.name,
            nameNormalized: nameNorm,
            phone: input.clientPhone || undefined,
            phoneNormalized: phoneNorm || undefined,
            preferredLocale: input.preferredLocale || 'ca',
          },
          create: {
            email: input.clientEmail.toLowerCase().trim(),
            emailNormalized: emailNorm,
            name: input.name,
            nameNormalized: nameNorm,
            phone: input.clientPhone || null,
            phoneNormalized: phoneNorm,
            source: input.source,
            preferredLocale: input.preferredLocale || 'ca',
          },
        });

        await prisma.lead.update({
          where: { id: savedLeadId },
          data: { customerId: customer.id },
        });

        await recordCustomerLeadCreated({
          customerId: customer.id,
          leadId: savedLeadId,
          eventType: input.eventType,
          source: input.source,
          packId: input.packId || null,
        });
      } catch (customerError) {
        log.error('Error creant/actualitzant customer des del formulari de contacte', customerError);
      }
    }
  } catch (dbError) {
    log.error('Error desant lead a la base de dades', dbError, {
      context: {
        eventType: input.eventType,
        source: input.source,
        hasEmail: !!input.clientEmail,
        hasPhone: !!input.clientPhone,
      },
    });
  }

  return { leadId: savedLeadId };
}
