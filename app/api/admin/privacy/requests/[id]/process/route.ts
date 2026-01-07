/**
 * API ROUTE: Process Privacy Request
 * Processar una sol·licitud ARCO específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  exportCustomerData,
  anonymizeCustomerData,
  logPrivacyAction,
} from '@/lib/services/privacyService';
import { prisma } from '@/lib/prisma';
import { requireAuth, verifyBasicAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import type { DataResponseType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const processSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  // Obtenir usuari autenticat
  const auth = verifyBasicAuth(req);
  const adminUser = auth.authenticated ? auth.user || 'admin' : 'admin';

  try {
    const { id } = await params;
    const body = await req.json();

    const validation = processSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Dades invàlides' },
        { status: 400 }
      );
    }

    const { action, notes } = validation.data;

    // Obtenir sol·licitud
    const request = await prisma.dataRequest.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Sol·licitud no trobada' },
        { status: 404 }
      );
    }

    if (request.status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'La sol·licitud no està verificada' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Rebutjar sol·licitud
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

      return NextResponse.json({
        success: true,
        message: 'Sol·licitud rebutjada',
      });
    }

    // Aprovar i processar
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
        // Per rectificació cal dades addicionals del admin
        responseType = 'DATA_CORRECTED';
        break;

      case 'OBJECTION':
        // Revocar consentiments de màrqueting
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

          // Actualitzar customer
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
        // Marcar limitació (implementació bàsica)
        responseType = 'PARTIAL_RESPONSE';
        break;
    }

    // Actualitzar sol·licitud
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

    // Log d'auditoria
    await logPrivacyAction({
      entityType: 'DataRequest',
      entityId: id,
      action: request.requestType === 'ERASURE' ? 'DATA_DELETED' : 'DATA_EXPORTED',
      performedBy: 'admin',
      reason: `Sol·licitud ${request.requestType} aprovada i processada`,
      legalBasis: `RGPD Art. ${getArticle(request.requestType)}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Sol·licitud processada correctament',
      data: responseData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

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
