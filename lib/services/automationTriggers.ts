/**
 * automationTriggers.ts — Auto-triggers entre passos del workflow
 *
 * Centralitza les accions automàtiques que es disparen quan canvia l'estat
 * d'un lead, reserva o proposta.
 */

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { TASK_SOURCE, TASK_DEDUPE_KEY } from '@/lib/constants';
import { isSmtpConfigured } from '@/lib/env';
import { sendLeadWelcomeEmail } from '@/lib/services/leadWelcomeEmailService';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TriggerContext {
  userId?: string;
  source?: string;
}

type TriggerResult = { triggered: boolean; action: string; detail?: string };

// ─── Proposal accepted → auto-generate contract ─────────────────────────────

export async function onProposalAccepted(
  proposalId: string,
  _ctx?: TriggerContext,
): Promise<TriggerResult> {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { booking: true },
    });

    if (!proposal || !proposal.bookingId) {
      return { triggered: false, action: 'generate-contract', detail: 'No booking linked' };
    }

    // Only auto-generate if contract doesn't exist yet
    if (proposal.contractStatus && proposal.contractStatus !== 'DRAFT') {
      return { triggered: false, action: 'generate-contract', detail: 'Contract already exists' };
    }

    // Mark contract as pending generation
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        contractStatus: 'DRAFT',
        contractSentAt: null,
      },
    });

    log.info(`[AutoTrigger] Contracte auto-generat per proposta ${proposalId}`);
    return { triggered: true, action: 'generate-contract', detail: `Contract DRAFT for proposal ${proposalId}` };
  } catch (error) {
    log.error('[AutoTrigger] Error generant contracte:', error);
    return { triggered: false, action: 'generate-contract', detail: String(error) };
  }
}

// ─── Lead created → immediate welcome email ──────────────────────────────────

export async function onLeadCreated(
  leadId: string,
  _ctx?: TriggerContext,
): Promise<TriggerResult> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, email: true, name: true, preferredLocale: true },
    });

    if (!lead?.email || lead.email.includes('@leads.orbitaevents.local')) {
      return { triggered: false, action: 'welcome-email', detail: 'No valid email' };
    }

    // Lock idempotent + audit: la tasca (dedupeKey ÚNIC) evita duplicats en retry o
    // double-click i queda com a registre. Un cop enviat l'email, es marca DONE.
    const dedupeKey = TASK_DEDUPE_KEY.welcomeEmail(lead.id);
    const result = await prisma.task.createMany({
      data: [
        {
          title: `Enviar welcome email a ${lead.name}`,
          description: `Auto-trigger: enviar email de benvinguda immediat a ${lead.email}`,
          status: 'OPEN',
          priority: 'HIGH',
          dueDate: new Date(),
          leadId: lead.id,
          source: TASK_SOURCE.AUTOMATION,
          dedupeKey,
        },
      ],
      skipDuplicates: true,
    });

    if (result.count === 0) {
      return { triggered: false, action: 'welcome-email', detail: 'Welcome email already handled' };
    }

    // Enviament AUTOMÀTIC (decisió del propietari 2026-07-05): si hi ha SMTP, s'envia
    // sol amb la plantilla `welcome` en el preferredLocale del lead i es marca la tasca
    // com a feta. Si NO hi ha SMTP o l'enviament falla, la tasca queda OBERTA com a
    // fallback manual — mai es perd, i el dedupeKey garanteix que no es dupliqui.
    if (!isSmtpConfigured()) {
      log.info(`[AutoTrigger] Welcome email encuat (SMTP off) per lead ${leadId}`);
      return { triggered: true, action: 'welcome-email', detail: 'Queued for manual send (SMTP off)' };
    }

    const sent = await sendLeadWelcomeEmail({ to: lead.email, clientName: lead.name, locale: lead.preferredLocale });
    if (sent.ok) {
      await prisma.task
        .update({ where: { dedupeKey }, data: { status: 'DONE', description: `Email de benvinguda enviat automàticament a ${lead.email}.` } })
        .catch((e) => log.error('[AutoTrigger] No s\'ha pogut marcar la tasca de welcome com a feta', e));
      log.info(`[AutoTrigger] Welcome email ENVIAT automàticament a lead ${leadId}`);
      return { triggered: true, action: 'welcome-email', detail: `Welcome email sent to ${lead.email}` };
    }

    log.error(`[AutoTrigger] Welcome email auto-send fallit per ${leadId}: ${sent.error}`);
    return { triggered: true, action: 'welcome-email', detail: `Queued for manual send (send failed)` };
  } catch (error) {
    log.error('[AutoTrigger] Error creant welcome email task:', error);
    return { triggered: false, action: 'welcome-email', detail: String(error) };
  }
}

// ─── Booking confirmed → auto-generate pre-event checklist ───────────────────

export async function onBookingConfirmed(
  bookingId: string,
  _ctx?: TriggerContext,
): Promise<TriggerResult> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, eventType: true, clientName: true, eventDate: true },
    });

    if (!booking) {
      return { triggered: false, action: 'pre-event-checklist', detail: 'Booking not found' };
    }

    // Generate checklist items based on event type
    const baseItems = [
      'Confirmar hora d\'arribada amb el client',
      'Verificar equip assignat a l\'inventari',
      'Preparar playlist/setlist',
      'Confirmar ruta i adreça',
      'Revisar contracte signat',
    ];

    const typeSpecificItems: Record<string, string[]> = {
      BODA: ['Coordinar amb fotògraf/vídeo', 'Preparar primer ball', 'Confirmar timeline cerimònia'],
      FIESTA: ['Preparar decoració temàtica', 'Confirmar efectes especials'],
      EMPRESA: ['Coordinar amb organitzador', 'Preparar presentació/marca', 'Verificar requisits tècnics sala'],
    };

    const eventItems = typeSpecificItems[booking.eventType || ''] || [];
    const allItems = [...baseItems, ...eventItems];

    const dueDate = booking.eventDate ? new Date(booking.eventDate.getTime() - 2 * 24 * 60 * 60 * 1000) : null;

    // Canonical dedup via dedupeKey + createMany({skipDuplicates:true}) — same pattern as taskAutomationService
    const result = await prisma.task.createMany({
      data: [
        {
          title: `Checklist pre-event: ${booking.clientName}`,
          description: allItems.map((item, i) => `${i + 1}. ${item}`).join('\n'),
          status: 'OPEN',
          priority: 'HIGH',
          dueDate,
          bookingId: booking.id,
          source: TASK_SOURCE.AUTOMATION,
          dedupeKey: TASK_DEDUPE_KEY.preEventChecklist(booking.id),
        },
      ],
      skipDuplicates: true,
    });

    if (result.count === 0) {
      return { triggered: false, action: 'pre-event-checklist', detail: 'Checklist already exists' };
    }

    log.info(`[AutoTrigger] Checklist pre-event creat per booking ${bookingId} (${allItems.length} ítems)`);
    return { triggered: true, action: 'pre-event-checklist', detail: `${allItems.length} items created` };
  } catch (error) {
    log.error('[AutoTrigger] Error creant checklist:', error);
    return { triggered: false, action: 'pre-event-checklist', detail: String(error) };
  }
}

// ─── Dispatcher — call from API routes / services ────────────────────────────

export type AutoTriggerEvent =
  | { type: 'proposal.accepted'; proposalId: string }
  | { type: 'lead.created'; leadId: string }
  | { type: 'booking.confirmed'; bookingId: string };

export async function dispatchAutoTrigger(
  event: AutoTriggerEvent,
  ctx?: TriggerContext,
): Promise<TriggerResult> {
  switch (event.type) {
    case 'proposal.accepted':
      return onProposalAccepted(event.proposalId, ctx);
    case 'lead.created':
      return onLeadCreated(event.leadId, ctx);
    case 'booking.confirmed':
      return onBookingConfirmed(event.bookingId, ctx);
    default:
      return { triggered: false, action: 'unknown' };
  }
}
