import { Prisma } from '@prisma/client';
import { DOCUMENT_ADMIN_LOG_ACTIONS } from '@/lib/constants/documentAuditTrail';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export { DOCUMENT_ADMIN_LOG_ACTIONS };

export type DocumentAdminLogAction =
  (typeof DOCUMENT_ADMIN_LOG_ACTIONS)[keyof typeof DOCUMENT_ADMIN_LOG_ACTIONS];

type RecordDocumentAdminLogInput = {
  action: DocumentAdminLogAction;
  entity?: string;
  entityId?: string | null;
  userId?: string | null;
  details?: Record<string, unknown>;
};

function normalizeDetails(details: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue;
}

export async function recordDocumentAdminLog(input: RecordDocumentAdminLogInput): Promise<void> {
  const entity = input.entity ?? 'proposal';

  try {
    await prisma.adminLog.create({
      data: {
        action: input.action,
        entity,
        entityId: input.entityId ?? null,
        details: normalizeDetails(input.details ?? {}),
        ...(input.userId ? { userId: input.userId } : {}),
      },
    });
  } catch (error) {
    log.warn('No s ha pogut registrar traca documental adminLog', {
      action: input.action,
      entity,
      entityId: input.entityId ?? null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
