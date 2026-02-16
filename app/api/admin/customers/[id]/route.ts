/**
 * API ROUTE: Admin Customer [id]
 * ==============================
 * GET - Obtenir un client
 * PATCH - Actualitzar client
 * DELETE - Eliminar client (amb consideracions GDPR)
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/request-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  preferredLocale: z.enum(['ca', 'es', 'en']).optional(),
  gdprConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

/**
 * GET - Obtenir client per ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const requestId = getRequestId(request);

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        leads: { take: 10, orderBy: { createdAt: 'desc' } },
        bookings: { take: 10, orderBy: { createdAt: 'desc' } },
        proposals: { take: 10, orderBy: { createdAt: 'desc' } },
        tasks: { where: { status: { not: 'DONE' } }, take: 10 },
        _count: {
          select: {
            leads: true,
            bookings: true,
            proposals: true,
            tasks: true,
            testimonials: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Client no trobat' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    log.error('Error obtenint client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error obtenint client' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Actualitzar client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;
  const requestId = getRequestId(request);

  try {
    const body = await request.json();
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    // Normalitzar nom si es proporciona
    if (data.name) {
      updateData.name = data.name.trim();
      updateData.nameNormalized = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    }

    // Normalitzar email si es proporciona
    if (data.email) {
      const emailNormalized = data.email.toLowerCase().trim();
      
      // Verificar que no existeix un altre client amb aquest email
      const existing = await prisma.customer.findFirst({
        where: {
          emailNormalized,
          id: { not: params.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { ok: false, error: 'Ja existeix un client amb aquest email' },
          { status: 409 }
        );
      }

      updateData.email = emailNormalized;
      updateData.emailNormalized = emailNormalized;
    }

    // Normalitzar telèfon si es proporciona
    if (data.phone !== undefined) {
      updateData.phone = data.phone?.trim() || null;
      updateData.phoneNormalized = data.phone
        ? data.phone.replace(/\D/g, '')
        : null;
    }

    // Normalitzar Instagram si es proporciona
    if (data.instagram !== undefined) {
      updateData.instagram = data.instagram?.trim() || null;
      updateData.instagramNormalized = data.instagram
        ? data.instagram.replace('@', '').toLowerCase().trim()
        : null;
    }

    // Altres camps
    if (data.preferredLocale) {
      updateData.preferredLocale = data.preferredLocale;
    }

    if (data.gdprConsent !== undefined) {
      updateData.gdprConsent = data.gdprConsent;
      if (data.gdprConsent) {
        updateData.gdprConsentDate = new Date();
      }
    }

    if (data.marketingConsent !== undefined) {
      updateData.marketingConsent = data.marketingConsent;
      if (data.marketingConsent) {
        updateData.marketingConsentDate = new Date();
      }
    }

    // Actualitzar
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    // Registrar activitat
    await prisma.customerActivity.create({
      data: {
        customerId: params.id,
        action: 'PROFILE_UPDATED',
        details: { fields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    log.error('Error actualitzant client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error actualitzant client' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar client (amb GDPR)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;
  const requestId = getRequestId(request);

  try {
    // Verificar que existeix
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            bookings: true,
            proposals: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Client no trobat' },
        { status: 404 }
      );
    }

    // Si té bookings o proposals, no eliminar sinó anonimitzar
    if (customer._count.bookings > 0 || customer._count.proposals > 0) {
      await prisma.customer.update({
        where: { id: params.id },
        data: {
          name: 'Client Anonimitzat',
          nameNormalized: 'client anonimitzat',
          email: `deleted-${params.id}@anonimitzat.local`,
          emailNormalized: `deleted-${params.id}@anonimitzat.local`,
          phone: null,
          phoneNormalized: null,
          instagram: null,
          instagramNormalized: null,
          gdprConsent: false,
          marketingConsent: false,
        },
      });

      return NextResponse.json({
        ok: true,
        message: 'Client anonimitzat (tenia reserves o pressupostos)',
        anonymized: true,
      });
    }

    // Si no té res, eliminar completament
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      ok: true,
      message: 'Client eliminat',
      deleted: true,
    });
  } catch (error) {
    log.error('Error eliminant client', error, {
      context: { requestId, customerId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error eliminant client' },
      { status: 500 }
    );
  }
}
