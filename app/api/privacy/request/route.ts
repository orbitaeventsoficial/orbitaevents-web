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
import type { Locale } from '@/i18n';
const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
    invalidEmail: 'Correu electrònic no vàlid',
    invalidName: 'El nom ha de tenir almenys 2 caràcters',
    privacyRequired: 'Has d’acceptar la política de privacitat',
    invalidData: 'Dades no vàlides',
    verificationSent: "Sol·licitud creada. Revisa el teu correu per verificar-la.",
    creatingError: 'Error creant la sol·licitud',
    verificationEmailLog: 'Correu de verificació enviat',
  },
  es: {
    invalidEmail: 'Email no valido',
    invalidName: 'El nombre debe tener minimo 2 caracteres',
    privacyRequired: 'Debes aceptar la politica de privacidad',
    invalidData: 'Datos invalidos',
    verificationSent: 'Solicitud creada. Comprueba tu email para verificarla.',
    creatingError: 'Error creando la solicitud',
    verificationEmailLog: 'Email de verificacion enviado',
  },
  en: {
    invalidEmail: 'Invalid email',
    invalidName: 'Name must be at least 2 characters',
    privacyRequired: 'You must accept the privacy policy',
    invalidData: 'Invalid data',
    verificationSent: 'Request created. Check your email to verify it.',
    creatingError: 'Error creating request',
    verificationEmailLog: 'Verification email sent',
  },
};

function resolveLocale(req: NextRequest): Locale {
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

const dataRequestSchema = (t: Record<string, string>) => z.object({
  requesterEmail: z
    .string()
    .email(t.invalidEmail)
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  requesterName: z
    .string()
    .min(2, t.invalidName)
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
    message: t.privacyRequired,
  }),
});

export async function POST(req: NextRequest) {
  const t = MESSAGES[resolveLocale(req)];
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const rateLimitResult = await checkRateLimit(req, RATE_LIMITS.privacy);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();

    const validationResult = dataRequestSchema(t).safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError.message || t.invalidData,
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
        locale: resolveLocale(req),
      });

      await logPrivacyAction({
        entityType: 'DataRequest',
        entityId: request.id,
        action: 'CONSENT_GRANTED',
        reason: t.verificationEmailLog,
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
      message: t.verificationSent,
    });
  } catch (error: unknown) {
    log.error('Error creating data request:', error);

    const errorMessage =
      error instanceof Error ? error.message : t.creatingError;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
