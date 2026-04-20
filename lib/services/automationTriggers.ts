/**
 * automationTriggers.ts — Auto-triggers entre passos del workflow
 *
 * Centralitza les accions automàtiques que es disparen quan canvia l'estat
 * d'un lead, reserva o proposta.
 */

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { TASK_SOURCE, TASK_DEDUPE_KEY } from '@/lib/constants';

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

    // Canonical dedup via dedupeKey — evita duplicats en retry del dispatcher o double-click de l'API
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
          dedupeKey: TASK_DEDUPE_KEY.welcomeEmail(lead.id),
        },
      ],
      skipDuplicates: true,
    });

    if (result.count === 0) {
      return { triggered: false, action: 'welcome-email', detail: 'Welcome email already queued' };
    }

    log.info(`[AutoTrigger] Welcome email task creada per lead ${leadId}`);
    return { triggered: true, action: 'welcome-email', detail: `Task created for ${lead.email}` };
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
