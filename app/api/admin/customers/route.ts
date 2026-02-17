/**
 * API ROUTE: Admin Customers
 * ==========================
 * GET - Obtenir tots els clients
 * POST - Crear nou client
 */

import { NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { verifyCsrf } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir clients
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const q = (searchParams.get('q') || '').trim();
    const skip = (page - 1) * limit;
    const where = q
      ? {
          OR: [
            { id: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { nameNormalized: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { emailNormalized: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
            { phoneNormalized: { contains: q } },
            { instagram: { contains: q, mode: 'insensitive' as const } },
            { instagramNormalized: { contains: q, mode: 'insensitive' as const } },
            {
              discountCodes: {
                some: {
                  code: { contains: q, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : undefined;

    // Query paginada
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              testimonials: true,
              discountCodes: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    let responseData: Record<string, unknown> = {
      customers,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      q,
    };

    if (includeStats) {
      // Stats amb queries a la BD en comptes de filtrar en memòria
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const [total, withEvents, recentMonth, withGdpr] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { totalEvents: { gt: 0 } } }),
        prisma.customer.count({ where: { createdAt: { gt: oneMonthAgo } } }),
        prisma.customer.count({ where: { gdprConsent: true } }),
      ]);

      responseData.stats = {
        total,
        withEvents,
        recentMonth,
        withGdpr,
      };
    }

    return successResponse(responseData);
  } catch (error) {
    log.error('Error obtenint clients:', error);
    return ApiErrors.internal('Error obtenint clients');
  }
}

/**
 * POST - Crear client
 */
export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  // CSRF Protection for state-changing operations
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { name, email, phone, instagram, preferredLocale } = body;

    if (!name || !email) {
      return ApiErrors.badRequest('Nom i email són obligatoris');
    }

    const emailNormalized = email.toLowerCase().trim();

    // Comprovar si ja existeix
    const existing = await prisma.customer.findUnique({
      where: { emailNormalized },
    });

    if (existing) {
      return ApiErrors.conflict('Ja existeix un client amb aquest email');
    }

    // Normalitzar nom (sense accents, lowercase)
    const nameNormalized = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Normalitzar telèfon
    const phoneNormalized = phone
      ? phone.replace(/\D/g, '')
      : null;

    // Normalitzar Instagram
    const instagramNormalized = instagram
      ? instagram.replace('@', '').toLowerCase().trim()
      : null;

    // Crear client
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        nameNormalized,
        email: emailNormalized,
        emailNormalized,
        phone: phone?.trim() || null,
        phoneNormalized,
        instagram: instagram?.trim() || null,
        instagramNormalized,
        preferredLocale: preferredLocale || 'es',
        source: 'OTHER',
        gdprConsent: true,
        gdprConsentDate: new Date(),
      },
    });

    return successResponse(customer, 'Client creat correctament', 201);
  } catch (error) {
    log.error('Error creant client:', error);
    return ApiErrors.internal('Error creant client');
  }
}
