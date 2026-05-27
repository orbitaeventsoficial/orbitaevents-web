import { prisma } from '@/lib/prisma';
import type { LeadLostReason } from '@/lib/constants/leadLoss';
import { formatCurrencyExact } from '@/lib/constants';
import { mapLeadActivityToCanonicalEvent } from '@/lib/services/timelineQueryService';

type LeadActivityInput = {
  type?: 'NOTE' | 'STATUS_CHANGE' | 'EMAIL' | 'CALL' | 'WHATSAPP' | 'DOCUMENT' | 'TASK' | 'SYSTEM';
  title: string;
  description?: string;
  createdBy?: string;
};

export async function recordLeadInboundChannelCaptured(input: {
  leadId: string;
  channel: 'instagram' | 'form';
  title: string;
  preview?: string | null;
  createdBy?: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'EMAIL',
      title: input.title,
      description: input.preview || undefined,
      createdBy: input.createdBy || 'Sistema',
      metadata: {
        channel: input.channel,
        direction: 'INBOUND',
      },
    },
  });
}

export async function recordLeadEmailSent(input: {
  leadId: string;
  subject: string;
  hasAttachments?: boolean;
  emailSendId?: string | null;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'EMAIL',
      title: 'Email enviat',
      description: `${input.subject}${input.hasAttachments ? ' (amb pressupost)' : ''}`,
      metadata: input.emailSendId ? { emailSendId: input.emailSendId } : undefined,
      createdBy: 'Admin',
    },
  });
}

export async function recordLeadQuoteSent(input: {
  leadId: string;
  quoteNumber: string;
  to: string;
  total: number;
}) {
  const documentTitle = `Pressupost ${input.quoteNumber}`;

  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'EMAIL',
      title: 'Pressupost enviat',
      description: documentTitle,
      metadata: {
        quoteNumber: input.quoteNumber,
        to: input.to,
        total: input.total,
        source: 'email_quote_route',
      },
      createdBy: 'Admin',
    },
  });
}

export async function recordLeadQuoteGenerated(input: {
  leadId: string;
  quoteNumber: string;
  total: number;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'DOCUMENT',
      title: 'Pressupost generat',
      description: `Pressupost ${input.quoteNumber}`,
      metadata: {
        quoteNumber: input.quoteNumber,
        total: input.total,
        source: 'lead_quote_route',
      },
      createdBy: 'Sistema',
    },
  });
}

export async function recordLeadScoreSnapshot(input: {
  leadId: string;
  score: number;
  band: string;
  probability: number;
  weightedAmount: number;
  reasons: string[];
  riskFlags: string[];
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'SYSTEM',
      title: 'Scoring snapshot',
      description: `Score ${input.score} (${input.band}) · Prob ${(input.probability * 100).toFixed(1)}% · Weighted ${formatCurrencyExact(input.weightedAmount)}`,
      createdBy: 'Scoring Bot',
      metadata: {
        score: input.score,
        band: input.band,
        probability: input.probability,
        weightedAmount: input.weightedAmount,
        reasons: input.reasons,
        riskFlags: input.riskFlags,
      },
    },
  });
}

export async function recordLeadSlaTaskCreated(input: {
  leadId: string;
  slaHours: number;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'TASK',
      title: 'SLA incomplert: tasca automàtica creada',
      description: `Es crea tasca automàtica en superar ${input.slaHours}h en estat NEW.`,
      createdBy: 'SLA Bot',
      metadata: { slaHours: input.slaHours },
    },
  });
}

export async function recordLeadStatusChanged(input: {
  leadId: string;
  fromStatus: string;
  toStatus: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'STATUS_CHANGE',
      title: "Canvi d'estat",
      description: `${input.fromStatus} → ${input.toStatus}`,
    },
  });
}

export async function recordLeadLost(input: {
  leadId: string;
  fromStatus: string;
  reason: LeadLostReason;
  description: string;
  note: string | null;
  actor: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'STATUS_CHANGE',
      title: 'Lead perdut',
      description: input.description,
      metadata: {
        fromStatus: input.fromStatus,
        toStatus: 'LOST',
        reason: input.reason,
        note: input.note,
      },
      createdBy: input.actor,
    },
  });
}

export async function recordLeadTechnicalSnapshotSaved(input: {
  leadId: string;
  title: string;
  documentId: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'DOCUMENT',
      title: 'Instantània tècnica desada',
      description: input.title,
      metadata: { documentId: input.documentId },
      createdBy: 'Sistema',
    },
  });
}

export async function recordLeadTechnicalSnapshotSent(input: {
  leadId: string;
  recipient: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'EMAIL',
      title: 'Instantània tècnica enviada',
      description: `Enviat a ${input.recipient}`,
      metadata: { recipient: input.recipient, kind: 'technical_snapshot' },
      createdBy: 'Sistema',
    },
  });
}

export async function recordLeadContractSent(input: {
  leadId: string;
  contractReference: string;
  to: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'DOCUMENT',
      title: 'Contracte enviat',
      description: `Contracte ${input.contractReference} enviat per email a ${input.to}`,
    },
  });
}

export async function recordLeadContractCancelled(input: {
  leadId: string;
  contractReference: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'SYSTEM',
      title: 'Contracte cancel·lat',
      description: `Contracte ${input.contractReference} cancel·lat`,
    },
  });
}

export async function recordLeadContractSigned(input: {
  leadId: string;
  contractReference: string;
  signedBy: string;
  source: 'admin' | 'portal';
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'DOCUMENT',
      title: 'Contracte signat',
      description: `Contracte ${input.contractReference} signat per ${input.signedBy}`,
      metadata: {
        contractReference: input.contractReference,
        signedBy: input.signedBy,
        source: input.source,
      },
      createdBy: input.source === 'portal' ? 'Portal client' : 'Admin',
    },
  });
}

export async function recordLeadDocumentAdded(input: {
  leadId: string;
  documentId: string;
  documentType: string;
  title: string;
  createdBy: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'DOCUMENT',
      title: 'Document afegit',
      description: input.title,
      metadata: { documentId: input.documentId, type: input.documentType },
      createdBy: input.createdBy,
    },
  });
}

export async function recordLeadDocumentDeleted(input: {
  leadId: string;
  documentId: string;
  title: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'DOCUMENT',
      title: 'Document eliminat',
      description: input.title,
      metadata: { documentId: input.documentId },
      createdBy: 'Admin',
    },
  });
}

export async function recordLeadTaskCreated(input: {
  leadId: string;
  taskId: string;
  title: string;
  status: string;
  priority: string;
  createdBy: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'TASK',
      title: 'Tasca creada',
      description: input.title,
      metadata: { taskId: input.taskId, status: input.status, priority: input.priority },
      createdBy: input.createdBy,
    },
  });
}

export async function recordLeadTaskUpdated(input: {
  leadId: string;
  taskId: string;
  title: string;
  status: string;
  priority: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'TASK',
      title: 'Tasca actualitzada',
      description: input.title,
      metadata: { taskId: input.taskId, status: input.status, priority: input.priority },
    },
  });
}

export async function recordLeadTaskDeleted(input: {
  leadId: string;
  taskId: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'TASK',
      title: 'Tasca eliminada',
      metadata: { taskId: input.taskId },
    },
  });
}

export async function recordLeadNoteAdded(input: {
  leadId: string;
  content: string;
  createdBy: string;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'NOTE',
      title: 'Nota afegida',
      description: input.content.slice(0, 200),
      createdBy: input.createdBy,
    },
  });
}

export async function recordLeadUpdatedFromInbox(input: {
  leadId: string;
  senderAddress: string;
  uid: number;
  subject: string;
  usedFallback: boolean;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'SYSTEM',
      title: 'Lead actualitzat des d’Inbox',
      description: `Importació automàtica des d’email ${input.senderAddress}`,
      createdBy: 'Admin Inbox',
      metadata: {
        uid: input.uid,
        subject: input.subject,
        usedFallback: input.usedFallback,
      },
    },
  });
}

export async function recordLeadCreatedFromInbox(input: {
  leadId: string;
  senderAddress: string;
  uid: number;
  subject: string;
  usedFallback: boolean;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: 'SYSTEM',
      title: 'Lead creat des d’Inbox',
      description: `Importació automàtica des d’email ${input.senderAddress}`,
      createdBy: 'Admin Inbox',
      metadata: {
        uid: input.uid,
        subject: input.subject,
        usedFallback: input.usedFallback,
      },
    },
  });
}

export async function recordLeadCommercialSequenceStepSent(input: {
  leadId: string;
  channel: 'email' | 'whatsapp';
  activityTitle: string;
  step: number;
  totalSteps: number;
  templateSlug: string;
  locale: 'ca' | 'es' | 'en';
  delayHours: number;
}) {
  return prisma.leadActivity.create({
    data: {
      leadId: input.leadId,
      type: input.channel === 'email' ? 'EMAIL' : 'WHATSAPP',
      title: input.activityTitle,
      description: `Pas ${input.step}/${input.totalSteps} (${input.templateSlug}) · canal ${input.channel}`,
      createdBy: 'Sequence Bot',
      metadata: {
        step: input.step,
        totalSteps: input.totalSteps,
        templateSlug: input.templateSlug,
        channel: input.channel,
        locale: input.locale,
        delayHours: input.delayHours,
      },
    },
  });
}

function uidFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const uid = (metadata as { uid?: unknown }).uid;
  if (typeof uid === 'number' || typeof uid === 'string') return String(uid);
  return null;
}

export async function listLeadActivities(leadId: string) {
  const activities = await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    ok: true,
    activities: activities.map((activity) => ({
      ...activity,
      timeline: mapLeadActivityToCanonicalEvent({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
        leadId: activity.leadId,
      }),
    })),
  };
}

export async function createLeadActivity(leadId: string, input: LeadActivityInput) {
  const activity = await prisma.leadActivity.create({
    data: {
      leadId,
      type: input.type ?? 'SYSTEM',
      title: input.title,
      description: input.description,
      createdBy: input.createdBy,
    },
  });

  return {
    ok: true,
    activity: {
      ...activity,
      timeline: mapLeadActivityToCanonicalEvent({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        createdBy: activity.createdBy,
        leadId: activity.leadId,
      }),
    },
  };
}

export async function cleanupDuplicateLeadActivities(leadId: string) {
  const activities = await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      createdBy: true,
      metadata: true,
    },
  });

  const keepByKey = new Map<string, string>();
  const idsToDelete: string[] = [];

  for (const activity of activities) {
    const uid = uidFromMetadata(activity.metadata);
    const key = [
      uid ? `uid:${uid}` : '',
      `title:${(activity.title || '').trim()}`,
      `desc:${(activity.description || '').trim()}`,
      `by:${(activity.createdBy || '').trim()}`,
    ].join('|');

    if (keepByKey.has(key)) {
      idsToDelete.push(activity.id);
    } else {
      keepByKey.set(key, activity.id);
    }
  }

  if (idsToDelete.length > 0) {
    await prisma.leadActivity.deleteMany({
      where: {
        id: { in: idsToDelete },
        leadId,
      },
    });
  }

  return { ok: true, deleted: idsToDelete.length };
}

export async function deleteLeadActivity(leadId: string, activityId: string) {
  const existing = await prisma.leadActivity.findFirst({
    where: {
      id: activityId,
      leadId,
    },
    select: { id: true },
  });

  if (!existing) {
    return { status: 404, body: { error: 'Activitat no trobada' } };
  }

  await prisma.leadActivity.delete({ where: { id: activityId } });
  return { status: 200, body: { ok: true } };
}
