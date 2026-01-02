/**
 * API ROUTE: Admin Customers
 * ==========================
 * GET - Obtenir tots els clients
 * POST - Crear nou client
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir clients
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            testimonials: true,
            discountCodes: true,
          },
        },
      },
    });

    const response: Record<string, unknown> = {
      success: true,
      data: customers,
    };

    if (includeStats) {
      const total = customers.length;
      const withEvents = customers.filter(c => c.totalEvents > 0).length;

      // Contactes del últim mes
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const recentMonth = customers.filter(c =>
        c.createdAt > oneMonthAgo
      ).length;

      // Amb consentiment GDPR
      const withGdpr = customers.filter(c => c.gdprConsent).length;

      response.stats = {
        total,
        withEvents,
        recentMonth,
        withGdpr,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    log.error('Error obtenint clients:', error);
    return NextResponse.json({ error: 'Error obtenint clients' }, { status: 500 });
  }
}

/**
 * POST - Crear client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, instagram, preferredLocale } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom i email són obligatoris' },
        { status: 400 }
      );
    }

    const emailNormalized = email.toLowerCase().trim();

    // Comprovar si ja existeix
    const existing = await prisma.customer.findUnique({
      where: { emailNormalized },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ja existeix un client amb aquest email' },
        { status: 409 }
      );
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

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    log.error('Error creant client:', error);
    return NextResponse.json({ error: 'Error creant client' }, { status: 500 });
  }
}
