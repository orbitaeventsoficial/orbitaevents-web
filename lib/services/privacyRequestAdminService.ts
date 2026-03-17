import { Prisma, type DataResponseType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { anonymizeCustomerData, exportCustomerData, logPrivacyAction } from '@/lib/services/privacyService';

function getArticle(requestType: string): string {
  const articles: Record<string, string> = {
    ACCESS: '15',
    RECTIFICATION: '16',
    ERASURE: '17',
    RESTRICTION: '18',
    PORTABILITY: '20',
    OBJECTION: '21',
    AUTOMATED: '22',
  };
  return articles[requestType] || '15';
}

export async function processPrivacyRequestById(id: string, action: 'approve' | 'reject', notes: string | undefined, adminUser: string) {
  const request = await prisma.dataRequest.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!request) {
    return { status: 404, body: { success: false, error: 'Sol·licitud no trobada' } };
  }

  if (request.status !== 'VERIFIED') {
    return { status: 400, body: { success: false, error: 'La sol·licitud no està verificada' } };
  }

  if (action === 'reject') {
    await prisma.dataRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedBy: adminUser,
        responseNotes: notes,
        responseType: 'REQUEST_DENIED',
      },
    });

    await logPrivacyAction({
      entityType: 'DataRequest',
      entityId: id,
      action: 'DATA_ACCESSED',
      performedBy: 'admin',
      reason: `Sol·licitud rebutjada: ${notes}`,
    });

    return { status: 200, body: { success: true, message: 'Sol·licitud rebutjada' } };
  }

  let responseData: Prisma.InputJsonValue | undefined = undefined;
  let responseType: DataResponseType = 'DATA_PROVIDED';

  switch (request.requestType) {
    case 'ACCESS':
    case 'PORTABILITY':
      if (request.customerId) {
        responseData = await exportCustomerData(
          request.customerId,
          request.requestType === 'PORTABILITY'
        );
        responseType = 'DATA_PROVIDED';
      }
      break;

    case 'ERASURE':
      if (request.customerId) {
        await anonymizeCustomerData(request.customerId, id);
        responseType = 'DATA_DELETED';
      }
      break;

    case 'RECTIFICATION':
      responseType = 'DATA_CORRECTED';
      break;

    case 'OBJECTION':
      if (request.customerId) {
        await prisma.consentRecord.updateMany({
          where: {
            customerId: request.customerId,
            consentType: {
              in: ['MARKETING_EMAIL', 'MARKETING_SMS', 'MARKETING_WHATSAPP'],
            },
            granted: true,
          },
          data: {
            granted: false,
            revokedAt: new Date(),
          },
        });

        await prisma.customer.update({
          where: { id: request.customerId },
          data: {
            marketingConsent: false,
            marketingConsentDate: null,
          },
        });

        responseType = 'DATA_CORRECTED';
      }
      break;

    case 'RESTRICTION':
      responseType = 'PARTIAL_RESPONSE';
      break;
  }

  await prisma.dataRequest.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
      processedBy: adminUser,
      responseType,
      ...(responseData !== undefined && { responseData }),
      responseNotes: notes || `Sol·licitud ${request.requestType} processada correctament`,
      responseSentAt: new Date(),
    },
  });

  await logPrivacyAction({
    entityType: 'DataRequest',
    entityId: id,
    action: request.requestType === 'ERASURE' ? 'DATA_DELETED' : 'DATA_EXPORTED',
    performedBy: 'admin',
    reason: `Sol·licitud ${request.requestType} aprovada i processada`,
    legalBasis: `RGPD Art. ${getArticle(request.requestType)}`,
  });

  return {
    status: 200,
    body: {
      success: true,
      message: 'Sol·licitud processada correctament',
      data: responseData,
    },
  };
}
