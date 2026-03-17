import { prisma } from '@/lib/prisma';

type CustomerPatchInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  instagram?: string | null;
  preferredLocale?: 'ca' | 'es' | 'en';
  gdprConsent?: boolean;
  marketingConsent?: boolean;
};

type CustomerRouteResult = {
  status: number;
  body: Record<string, unknown>;
};

export async function getCustomerDetail(id: string): Promise<CustomerRouteResult> {
  const customer = await prisma.customer.findUnique({
    where: { id },
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
    return { status: 404, body: { ok: false, error: 'Client no trobat' } };
  }

  return { status: 200, body: { ok: true, customer } };
}

export async function updateCustomerFromInput(id: string, data: CustomerPatchInput): Promise<CustomerRouteResult> {
  const updateData: Record<string, unknown> = {};

  if (data.name) {
    updateData.name = data.name.trim();
    updateData.nameNormalized = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  if (data.email) {
    const emailNormalized = data.email.toLowerCase().trim();
    const existing = await prisma.customer.findFirst({
      where: {
        emailNormalized,
        id: { not: id },
      },
    });

    if (existing) {
      return { status: 409, body: { ok: false, error: 'Ja existeix un client amb aquest email' } };
    }

    updateData.email = emailNormalized;
    updateData.emailNormalized = emailNormalized;
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone?.trim() || null;
    updateData.phoneNormalized = data.phone ? data.phone.replace(/\D/g, '') : null;
  }

  if (data.instagram !== undefined) {
    updateData.instagram = data.instagram?.trim() || null;
    updateData.instagramNormalized = data.instagram
      ? data.instagram.replace('@', '').toLowerCase().trim()
      : null;
  }

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

  const customer = await prisma.customer.update({
    where: { id },
    data: updateData,
  });

  await prisma.customerActivity.create({
    data: {
      customerId: id,
      action: 'PROFILE_UPDATED',
      details: { fields: Object.keys(updateData) },
    },
  });

  return { status: 200, body: { ok: true, customer } };
}

export async function deleteCustomerOrAnonymize(id: string): Promise<CustomerRouteResult> {
  const customer = await prisma.customer.findUnique({
    where: { id },
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
    return { status: 404, body: { ok: false, error: 'Client no trobat' } };
  }

  if (customer._count.bookings > 0 || customer._count.proposals > 0) {
    await prisma.customer.update({
      where: { id },
      data: {
        name: 'Client Anonimitzat',
        nameNormalized: 'client anonimitzat',
        email: `deleted-${id}@anonimitzat.local`,
        emailNormalized: `deleted-${id}@anonimitzat.local`,
        phone: null,
        phoneNormalized: null,
        instagram: null,
        instagramNormalized: null,
        gdprConsent: false,
        marketingConsent: false,
      },
    });

    return {
      status: 200,
      body: {
        ok: true,
        message: 'Client anonimitzat (tenia reserves o pressupostos)',
        anonymized: true,
      },
    };
  }

  await prisma.customer.delete({ where: { id } });
  return {
    status: 200,
    body: {
      ok: true,
      message: 'Client eliminat',
      deleted: true,
    },
  };
}
