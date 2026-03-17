import { prisma } from '@/lib/prisma';

type LeadActivityInput = {
  type?: 'NOTE' | 'STATUS_CHANGE' | 'EMAIL' | 'CALL' | 'WHATSAPP' | 'DOCUMENT' | 'TASK' | 'SYSTEM';
  title: string;
  description?: string;
  createdBy?: string;
};

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
  return { ok: true, activities };
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

  return { ok: true, activity };
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
