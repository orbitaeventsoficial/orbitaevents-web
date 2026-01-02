/**
 * API ROUTE: Privacy Data Request
 * Sol·licituds de drets ARCO (RGPD)
 *
 * POST - Crear nova sol·licitud de drets
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

export const dynamic = 'force-dynamic';

// Esquema de validació
const dataRequestSchema = z.object({
  requesterEmail: z
    .string()
    .email('Email no vàlid')
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  requesterName: z
    .string()
    .min(2, 'El nom ha de tenir mínim 2 caràcters')
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
    message: "Has d'acceptar la política de privacitat",
  }),
});

export async function POST(req: NextRequest) {
  // Rate limiting: 3 requests per 30 minuts
  const rateLimitResult = checkRateLimit(req, RATE_LIMITS.privacy);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();

    // Validar dades
    const validationResult = dataRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message || 'Dades invàlides',
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Crear sol·licitud a la base de dades
    const request = await createDataRequest({
      requesterEmail: data.requesterEmail,
      requesterName: data.requesterName,
      requesterPhone: data.requesterPhone,
      requestType: data.requestType,
      description: data.description,
      specificData: data.specificData,
      reason: data.reason,
    });

    // Enviar email de verificació
    try {
      await sendPrivacyVerificationEmail({
        to: data.requesterEmail,
        name: data.requesterName,
        requestType: data.requestType,
        requestId: request.id,
        verificationToken: request.verificationToken,
        legalDeadline: request.legalDeadline,
      });

      // Log de l'enviament
      await logPrivacyAction({
        entityType: 'DataRequest',
        entityId: request.id,
        action: 'CONSENT_GRANTED',
        reason: 'Email de verificació enviat',
      });
    } catch (emailError) {
      log.error('Error enviant email de verificació:', emailError);
      // Continuem - l'admin pot verificar manualment si cal
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: request.id,
        status: request.status,
        legalDeadline: request.legalDeadline,
      },
      message: 'Sol·licitud creada. Comprova el teu email per verificar-la.',
    });
  } catch (error: unknown) {
    log.error('Error creating data request:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error creant la sol·licitud';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
