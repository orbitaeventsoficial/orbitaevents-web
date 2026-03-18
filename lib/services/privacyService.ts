/**
 * PRIVACY SERVICE
 * Òrbita Events - Sistema RGPD/LOPDGDD
 *
 * Gestió completa de privacitat:
 * - Registre de consentiments
 * - Drets ARCO (Accés, Rectificació, Cancel·lació, Oposició)
 * - Auditoria de dades
 * - Exportació de dades
 * - Política de retenció
 */

import { prisma } from '@/lib/prisma';
import { createHash, randomBytes } from 'crypto';
import type {
  ConsentType,
  DataRequestType,
  DataResponseType,
  LegalDocumentType,
  PrivacyAction,
  Prisma,
} from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

interface ConsentInput {
  customerId?: string;
  email?: string;
  consentType: ConsentType;
  consentVersion: string;
  granted: boolean;
  source: string;
  sourceUrl?: string;
  formId?: string;
  ipAddress?: string;
  userAgent?: string;
  rawConsent?: Record<string, unknown>;
}

interface DataRequestInput {
  requesterEmail: string;
  requesterName: string;
  requesterPhone?: string;
  requestType: DataRequestType;
  description?: string;
  specificData?: string[];
  reason?: string;
}

interface AuditLogInput {
  entityType: string;
  entityId: string;
  action: PrivacyAction;
  performedBy?: string;
  performerIp?: string;
  performerUserAgent?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  affectedFields?: string[];
  requestId?: string;
  reason?: string;
  legalBasis?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GESTIÓ DE CONSENTIMENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registra un consentiment
 */
export async function recordConsent(input: ConsentInput) {
  // Generar hash de verificació
  const checksumHash = createHash('sha256')
    .update(
      JSON.stringify({
        email: input.email,
        consentType: input.consentType,
        granted: input.granted,
        timestamp: new Date().toISOString(),
      })
    )
    .digest('hex');

  const consent = await prisma.consentRecord.create({
    data: {
      customerId: input.customerId,
      email: input.email,
      consentType: input.consentType,
      consentVersion: input.consentVersion,
      granted: input.granted,
      grantedAt: input.granted ? new Date() : null,
      source: input.source,
      sourceUrl: input.sourceUrl,
      formId: input.formId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      rawConsent: input.rawConsent as Prisma.InputJsonValue,
      checksumHash,
    },
  });

  // Log d'auditoria
  await logPrivacyAction({
    entityType: 'ConsentRecord',
    entityId: consent.id,
    action: input.granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
    performerIp: input.ipAddress,
    performerUserAgent: input.userAgent,
    newData: input as unknown as Record<string, unknown>,
    legalBasis: 'Consentiment explícit',
  });

  return consent;
}

/**
 * Revoca un consentiment
 */
export async function revokeConsent(
  customerId: string,
  consentType: ConsentType,
  reason?: string
) {
  const consent = await prisma.consentRecord.findFirst({
    where: {
      customerId,
      consentType,
      granted: true,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!consent) {
    throw new Error('Consentiment no trobat');
  }

  const updated = await prisma.consentRecord.update({
    where: { id: consent.id },
    data: {
      granted: false,
      revokedAt: new Date(),
    },
  });

  // Log d'auditoria
  await logPrivacyAction({
    entityType: 'ConsentRecord',
    entityId: consent.id,
    action: 'CONSENT_REVOKED',
    previousData: { granted: true },
    newData: { granted: false, revokedAt: new Date() },
    reason,
    legalBasis: 'Dret de revocació',
  });

  return updated;
}

/**
 * Llistar tots els consentiments amb paginació i filtre
 */
export async function listConsents(opts: {
  status?: 'active' | 'revoked' | 'all';
  consentType?: ConsentType;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { status = 'all', consentType, search, limit = 50, offset = 0 } = opts;

  const where: Prisma.ConsentRecordWhereInput = {};

  if (status === 'active') {
    where.granted = true;
    where.revokedAt = null;
  } else if (status === 'revoked') {
    where.revokedAt = { not: null };
  }

  if (consentType) where.consentType = consentType;

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.consentRecord.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.consentRecord.count({ where }),
  ]);

  return { items, total };
}

/**
 * Obtenir consentiments actius d'un client
 */
export async function getActiveConsents(customerId: string) {
  return prisma.consentRecord.findMany({
    where: {
      customerId,
      granted: true,
      revokedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Verificar si un client té un consentiment actiu
 */
export async function hasActiveConsent(
  customerIdOrEmail: string,
  consentType: ConsentType
): Promise<boolean> {
  const consent = await prisma.consentRecord.findFirst({
    where: {
      OR: [{ customerId: customerIdOrEmail }, { email: customerIdOrEmail }],
      consentType,
      granted: true,
      revokedAt: null,
    },
  });

  return !!consent;
}

// ═══════════════════════════════════════════════════════════════════════════
// GESTIÓ DE SOL·LICITUDS DE DRETS (ARCO)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crear una sol·licitud de drets
 */
export async function createDataRequest(input: DataRequestInput) {
  // Buscar si hi ha un client amb aquest email
  const customer = await prisma.customer.findFirst({
    where: { email: input.requesterEmail },
  });

  // Calcular deadline legal (30 dies)
  const legalDeadline = new Date();
  legalDeadline.setDate(legalDeadline.getDate() + 30);

  // Generar token de verificació
  const verificationToken = randomBytes(32).toString('hex');

  const request = await prisma.dataRequest.create({
    data: {
      customerId: customer?.id,
      requesterEmail: input.requesterEmail,
      requesterName: input.requesterName,
      requesterPhone: input.requesterPhone,
      requestType: input.requestType,
      description: input.description,
      specificData: input.specificData || [],
      reason: input.reason,
      status: 'PENDING',
      legalDeadline,
      verificationToken,
    },
  });

  // Log d'auditoria
  await logPrivacyAction({
    entityType: 'DataRequest',
    entityId: request.id,
    action: 'DATA_ACCESSED',
    newData: input as unknown as Record<string, unknown>,
    legalBasis: `Dret ${input.requestType}`,
  });

  return request;
}

/**
 * Verificar identitat d'una sol·licitud
 */
export async function verifyDataRequest(token: string) {
  const request = await prisma.dataRequest.findUnique({
    where: { verificationToken: token },
  });

  if (!request) {
    throw new Error('Sol·licitud no trobada');
  }

  if (request.verifiedAt) {
    throw new Error('Sol·licitud ja verificada');
  }

  const updated = await prisma.dataRequest.update({
    where: { id: request.id },
    data: {
      verifiedAt: new Date(),
      status: 'VERIFIED',
    },
  });

  return updated;
}

/**
 * Processar una sol·licitud de drets
 */
export async function processDataRequest(
  requestId: string,
  processedBy: string,
  responseType: DataResponseType,
  responseNotes?: string
) {
  const request = await prisma.dataRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Sol·licitud no trobada');
  }

  let responseData: Record<string, unknown> | null = null;

  // Segons el tipus de sol·licitud, executar l'acció corresponent
  switch (request.requestType) {
    case 'ACCESS':
      if (request.customerId) {
        responseData = await exportCustomerData(request.customerId);
      }
      break;

    case 'ERASURE':
      if (request.customerId) {
        await anonymizeCustomerData(request.customerId, requestId);
      }
      break;

    case 'PORTABILITY':
      if (request.customerId) {
        responseData = await exportCustomerData(request.customerId, true);
      }
      break;
  }

  const updated = await prisma.dataRequest.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
      processedBy,
      responseType,
      responseNotes,
      responseData: responseData as Prisma.InputJsonValue,
      responseSentAt: new Date(),
    },
  });

  return updated;
}

/**
 * Obtenir sol·licituds pendents
 */
export async function getPendingDataRequests() {
  return prisma.dataRequest.findMany({
    where: {
      status: {
        in: ['PENDING', 'VERIFIED', 'IN_PROGRESS'],
      },
    },
    orderBy: { legalDeadline: 'asc' },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Obtenir sol·licituds pròximes al deadline
 */
export async function getUrgentDataRequests(daysThreshold = 5) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return prisma.dataRequest.findMany({
    where: {
      status: {
        in: ['PENDING', 'VERIFIED', 'IN_PROGRESS'],
      },
      legalDeadline: {
        lte: thresholdDate,
      },
    },
    orderBy: { legalDeadline: 'asc' },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTACIÓ I ANONIMITZACIÓ DE DADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Exportar totes les dades d'un client (dret d'accés/portabilitat)
 */
export async function exportCustomerData(
  customerId: string,
  portableFormat = false
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      leads: {
        select: {
          id: true,
          eventType: true,
          eventDate: true,
          eventLocation: true,
          status: true,
          createdAt: true,
        },
      },
      testimonials: {
        select: {
          id: true,
          text: true,
          rating: true,
          eventType: true,
          isApproved: true,
          createdAt: true,
        },
      },
      discountCodes: {
        select: {
          id: true,
          code: true,
          discountPercent: true,
          currentUses: true,
          validUntil: true,
          createdAt: true,
        },
      },
      consentRecords: {
        select: {
          consentType: true,
          granted: true,
          grantedAt: true,
          revokedAt: true,
          source: true,
        },
      },
      activityLog: portableFormat
        ? undefined
        : {
            select: {
              action: true,
              details: true,
              createdAt: true,
            },
            take: 100,
            orderBy: { createdAt: 'desc' },
          },
    },
  });

  if (!customer) {
    throw new Error('Client no trobat');
  }

  // Log d'auditoria
  await logPrivacyAction({
    entityType: 'Customer',
    entityId: customerId,
    action: 'DATA_EXPORTED',
    performedBy: 'USER',
    legalBasis: portableFormat ? 'Dret de portabilitat' : 'Dret d\'accés',
  });

  // Format portable (JSON estructurat per a exportació)
  if (portableFormat) {
    return {
      exportDate: new Date().toISOString(),
      format: 'GDPR-Portable',
      data: {
        personalData: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          instagram: customer.instagram,
          preferredLocale: customer.preferredLocale,
          registeredAt: customer.createdAt,
        },
        activitySummary: {
          totalEvents: customer.totalEvents,
          totalSpent: customer.totalSpent,
          lastEventDate: customer.lastEventDate,
        },
        leads: customer.leads,
        testimonials: customer.testimonials,
        discountCodes: customer.discountCodes,
        consents: customer.consentRecords,
      },
    };
  }

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      instagram: customer.instagram,
      preferredLocale: customer.preferredLocale,
      source: customer.source,
      gdprConsent: customer.gdprConsent,
      gdprConsentDate: customer.gdprConsentDate,
      marketingConsent: customer.marketingConsent,
      marketingConsentDate: customer.marketingConsentDate,
      totalEvents: customer.totalEvents,
      totalSpent: customer.totalSpent,
      lastEventDate: customer.lastEventDate,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
    leads: customer.leads,
    testimonials: customer.testimonials,
    discountCodes: customer.discountCodes,
    consentRecords: customer.consentRecords,
    activityLog: customer.activityLog,
  };
}

/**
 * Anonimitzar dades d'un client (dret de supressió)
 */
export async function anonymizeCustomerData(
  customerId: string,
  requestId?: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error('Client no trobat');
  }

  // Generar dades anonimitzades
  const anonymousId = randomBytes(8).toString('hex');
  const anonymousData = {
    email: `deleted_${anonymousId}@deleted.local`,
    emailNormalized: `deleted_${anonymousId}@deleted.local`,
    name: 'DELETED',
    nameNormalized: 'deleted',
    phone: null,
    phoneNormalized: null,
    instagram: null,
    instagramNormalized: null,
    gdprConsent: false,
    gdprConsentDate: null,
    marketingConsent: false,
    marketingConsentDate: null,
  };

  // Guardar dades originals per l'audit log
  const previousData = {
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    instagram: customer.instagram,
  };

  await prisma.$transaction([
    // Anonimitzar client
    prisma.customer.update({
      where: { id: customerId },
      data: anonymousData,
    }),

    // Eliminar testimonis
    prisma.customerTestimonial.deleteMany({
      where: { customerId },
    }),

    // Revocar tots els consentiments
    prisma.consentRecord.updateMany({
      where: { customerId, granted: true },
      data: { granted: false, revokedAt: new Date() },
    }),
  ]);

  // Log d'auditoria
  await logPrivacyAction({
    entityType: 'Customer',
    entityId: customerId,
    action: 'DATA_ANONYMIZED',
    previousData,
    newData: anonymousData as Record<string, unknown>,
    affectedFields: Object.keys(anonymousData),
    requestId,
    reason: 'Dret de supressió',
    legalBasis: 'Art. 17 RGPD',
  });

  return { success: true, anonymizedId: anonymousId };
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDITORIA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registrar acció d'auditoria de privacitat
 */
export async function logPrivacyAction(input: AuditLogInput) {
  return prisma.privacyAuditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedBy: input.performedBy,
      performerIp: input.performerIp,
      performerUserAgent: input.performerUserAgent,
      previousData: input.previousData as Prisma.InputJsonValue,
      newData: input.newData as Prisma.InputJsonValue,
      affectedFields: input.affectedFields || [],
      requestId: input.requestId,
      reason: input.reason,
      legalBasis: input.legalBasis,
    },
  });
}

/**
 * Obtenir historial d'auditoria d'una entitat
 */
export async function getAuditHistory(entityType: string, entityId: string) {
  return prisma.privacyAuditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtenir resum d'auditoria per un període
 */
export async function getAuditSummary(startDate: Date, endDate: Date) {
  const logs = await prisma.privacyAuditLog.groupBy({
    by: ['action'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  return logs.map((log) => ({
    action: log.action,
    count: log._count,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTS LEGALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtenir document legal actiu
 */
export async function getActiveLegalDocument(
  type: LegalDocumentType,
  locale: string
) {
  return prisma.legalDocument.findFirst({
    where: {
      type,
      locale,
      isActive: true,
      effectiveFrom: { lte: new Date() },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: new Date() } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
}

/**
 * Obtenir versió actual d'un document legal
 */
export async function getCurrentLegalVersion(
  type: LegalDocumentType,
  locale: string
): Promise<string | null> {
  const doc = await getActiveLegalDocument(type, locale);
  return doc?.version || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// POLÍTIQUES DE RETENCIÓ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Executar polítiques de retenció
 */
export async function executeRetentionPolicies() {
  const policies = await prisma.dataRetentionPolicy.findMany({
    where: { isActive: true },
  });

  const results: Array<{ policyId: string; processed: number }> = [];

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    let processedCount = 0;

    switch (policy.entityType) {
      case 'Lead':
        // Leads no convertits més antics que la retenció
        const oldLeads = await prisma.lead.findMany({
          where: {
            status: { in: ['LOST', 'NEW'] },
            createdAt: { lt: cutoffDate },
          },
          take: 100,
        });

        for (const lead of oldLeads) {
          if (policy.actionType === 'DELETE') {
            await prisma.lead.delete({ where: { id: lead.id } });
          } else if (policy.actionType === 'ANONYMIZE') {
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                name: 'ARCHIVED',
                email: `archived_${lead.id}@archived.local`,
                phone: null,
                message: null,
              },
            });
          }
          processedCount++;
        }
        break;

      case 'CustomerActivity':
        // Logs d'activitat antics
        if (policy.actionType === 'DELETE') {
          const result = await prisma.customerActivity.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
          });
          processedCount = result.count;
        }
        break;
    }

    // Actualitzar política
    await prisma.dataRetentionPolicy.update({
      where: { id: policy.id },
      data: {
        lastRunAt: new Date(),
        totalProcessed: { increment: processedCount },
        lastProcessedCount: processedCount,
      },
    });

    results.push({ policyId: policy.id, processed: processedCount });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITATS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtenir estadístiques de privacitat
 */
export async function getPrivacyStats() {
  const [
    totalConsents,
    activeConsents,
    pendingRequests,
    completedRequests,
    urgentRequests,
  ] = await Promise.all([
    prisma.consentRecord.count(),
    prisma.consentRecord.count({
      where: { granted: true, revokedAt: null },
    }),
    prisma.dataRequest.count({
      where: { status: { in: ['PENDING', 'VERIFIED', 'IN_PROGRESS'] } },
    }),
    prisma.dataRequest.count({
      where: { status: 'COMPLETED' },
    }),
    getUrgentDataRequests(5).then((r) => r.length),
  ]);

  return {
    consents: {
      total: totalConsents,
      active: activeConsents,
    },
    requests: {
      pending: pendingRequests,
      completed: completedRequests,
      urgent: urgentRequests,
    },
  };
}

/**
 * Verificar compliment RGPD d'un client
 */
export async function checkGdprCompliance(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      consentRecords: {
        where: { granted: true, revokedAt: null },
      },
    },
  });

  if (!customer) {
    throw new Error('Client no trobat');
  }

  const hasGdprConsent = customer.consentRecords.some(
    (c) => c.consentType === 'GDPR_BASIC'
  );

  const hasMarketingConsent = customer.consentRecords.some(
    (c) =>
      c.consentType === 'MARKETING_EMAIL' ||
      c.consentType === 'MARKETING_SMS' ||
      c.consentType === 'MARKETING_WHATSAPP'
  );

  return {
    customerId,
    hasGdprConsent,
    hasMarketingConsent,
    consents: customer.consentRecords.map((c) => c.consentType),
    isCompliant: hasGdprConsent,
  };
}

