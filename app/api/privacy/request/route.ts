/**
 * API ROUTE: Privacy Data Request
 * Solicitudes de derechos ARCO (RGPD)
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import {
  createDataRequest,
  logPrivacyAction,
} from '@/lib/services/privacyService';
import { sendPrivacyVerificationEmail } from '@/lib/email';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { verifyCsrf } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

const dataRequestSchema = z.object({
  requesterEmail: z
    .string()
    .email('Email no valido')
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  requesterName: z
    .string()
    .min(2, 'El nombre debe tener minimo 2 caracteres')
    .max(100)
    .transform((val) => val.trim()),
  requesterPhone: z
    .string()
    .max(20)
    .optional()
    .transform((val) => val?.trim() || undefined),
  requestType: z.enum([
    'ACCESS',
    'RECTIFICATION',
    'ERASURE',
    'RESTRICTION',
    'PORTABILITY',
    'OBJECTION',
    'AUTOMATED',
  ]),
  description: z
    .string()
    .max(1000)
    .optional()
    .transform((val) => val?.trim() || undefined),
  specificData: z.array(z.string()).optional(),
  reason: z.string().max(500).optional(),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar la politica de privacidad',
  }),
});

export async function POST(req: NextRequest) {
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(req, RATE_LIMITS.privacy);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();

    const validationResult = dataRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message || 'Datos invalidos',
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const request = await createDataRequest({
      requesterEmail: data.requesterEmail,
      requesterName: data.requesterName,
      requesterPhone: data.requesterPhone,
      requestType: data.requestType,
      description: data.description,
      specificData: data.specificData,
      reason: data.reason,
    });

    try {
      await sendPrivacyVerificationEmail({
        to: data.requesterEmail,
        name: data.requesterName,
        requestType: data.requestType,
        requestId: request.id,
        verificationToken: request.verificationToken,
        legalDeadline: request.legalDeadline,
      });

      await logPrivacyAction({
        entityType: 'DataRequest',
        entityId: request.id,
        action: 'CONSENT_GRANTED',
        reason: 'Email de verificacion enviado',
      });
    } catch (emailError) {
      log.error('Error enviando email de verificacion:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: request.id,
        status: request.status,
        legalDeadline: request.legalDeadline,
      },
      message: 'Solicitud creada. Comprueba tu email para verificarla.',
    });
  } catch (error: unknown) {
    log.error('Error creating data request:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error creando la solicitud';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}