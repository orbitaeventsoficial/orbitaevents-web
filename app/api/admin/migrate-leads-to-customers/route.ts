import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { normalizeEmail, normalizeName, normalizePhone } from '@/lib/utils/normalize';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Buscar leads sense customerId i amb email vàlid
    const leadsWithoutCustomer = await prisma.lead.findMany({
      where: {
        customerId: null,
        email: {
          not: { contains: '@leads.orbitaevents.local' },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        preferredLocale: true,
      },
    });

    let created = 0;
    let linked = 0;
    let errors = 0;

    for (const lead of leadsWithoutCustomer) {
      try {
        const emailNorm = normalizeEmail(lead.email);
        const nameNorm = normalizeName(lead.name);
        const phoneNorm = lead.phone ? normalizePhone(lead.phone) : null;

        const customer = await prisma.customer.upsert({
          where: { emailNormalized: emailNorm },
          update: {},
          create: {
            email: lead.email.toLowerCase().trim(),
            emailNormalized: emailNorm,
            name: lead.name,
            nameNormalized: nameNorm,
            phone: lead.phone || null,
            phoneNormalized: phoneNorm,
            source: lead.source,
            preferredLocale: lead.preferredLocale || 'ca',
          },
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { customerId: customer.id },
        });

        linked++;
        if (customer.createdAt.getTime() > Date.now() - 5000) {
          created++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      totalLeadsProcessed: leadsWithoutCustomer.length,
      customersCreated: created,
      leadsLinked: linked,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en la migració', details: String(error) },
      { status: 500 }
    );
  }
}
