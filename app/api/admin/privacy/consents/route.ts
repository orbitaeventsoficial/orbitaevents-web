/**
 * API ROUTE: Admin Privacy Consents
 * Llistar i gestionar consentiments RGPD
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { PRIVACY_CONSENT_STATUS_VALUES, type PrivacyConsentStatus } from '@/lib/constants/privacy';
import { listConsents, revokeConsent, logPrivacyAction, findConsentById } from '@/lib/services/privacyService';
import type { ConsentType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get('status');
    const status: PrivacyConsentStatus = rawStatus && PRIVACY_CONSENT_STATUS_VALUES.includes(rawStatus as PrivacyConsentStatus)
      ? (rawStatus as PrivacyConsentStatus)
      : 'all';
    const consentType = searchParams.get('type') as ConsentType | null;
    const search = searchParams.get('q') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
    const offset = Number(searchParams.get('offset')) || 0;

    const result = await listConsents({
      status,
      consentType: consentType || undefined,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ ok: true, body: result });
  } catch (error) {
    console.error('Error llistant consentiments:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { consentId, customerId, consentType, reason } = body;

    if (!consentId && (!customerId || !consentType)) {
      return NextResponse.json(
        { ok: false, error: 'Cal consentId o customerId + consentType' },
        { status: 400 }
      );
    }

    if (consentId) {
      const consent = await findConsentById(consentId);
      if (!consent) {
        return NextResponse.json({ ok: false, error: 'Consentiment no trobat' }, { status: 404 });
      }
      await revokeConsent(
        consent.customerId || consent.email || '',
        consent.consentType
      );
      await logPrivacyAction({
        entityType: 'ConsentRecord',
        entityId: consentId,
        action: 'CONSENT_REVOKED',
        performedBy: 'ADMIN',
        reason: reason || 'Revocat manualment per admin',
        legalBasis: 'Revocació de consentiment',
      });
    } else {
      await revokeConsent(customerId, consentType);
      await logPrivacyAction({
        entityType: 'Customer',
        entityId: customerId,
        action: 'CONSENT_REVOKED',
        performedBy: 'ADMIN',
        reason: reason || 'Revocat manualment per admin',
        legalBasis: 'Revocació de consentiment',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error revocant consentiment:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}
