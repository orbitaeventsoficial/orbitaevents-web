import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from '@/lib/utils/normalize';

export type BookingCustomerMatchKind = 'email' | 'phone' | 'name';

export type BookingCustomerMatchSummary = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  matchedBy: BookingCustomerMatchKind[];
  confidence: 'strong' | 'medium';
};

export type BookingCustomerPreview =
  | { kind: 'booking-not-found' }
  | { kind: 'already-linked'; customer: BookingCustomerMatchSummary }
  | { kind: 'matches-found'; matches: BookingCustomerMatchSummary[] }
  | { kind: 'no-match' };

export async function previewBookingCustomerLink(
  bookingId: string,
): Promise<BookingCustomerPreview> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });
  if (!booking) return { kind: 'booking-not-found' };

  if (booking.customerId && booking.customer) {
    return {
      kind: 'already-linked',
      customer: {
        customerId: booking.customer.id,
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone,
        matchedBy: [],
        confidence: 'strong',
      },
    };
  }

  const emailNorm = booking.clientEmail ? normalizeEmail(booking.clientEmail) : null;
  const phoneNorm = booking.clientPhone ? normalizePhone(booking.clientPhone) : null;
  const nameNorm = booking.clientName ? normalizeName(booking.clientName) : null;
  const nameSearchable = nameNorm && nameNorm.length >= 3 ? nameNorm : null;

  const orClauses: Prisma.CustomerWhereInput[] = [];
  if (emailNorm) orClauses.push({ emailNormalized: emailNorm });
  if (phoneNorm) orClauses.push({ phoneNormalized: phoneNorm });
  if (nameSearchable) orClauses.push({ nameNormalized: nameSearchable });

  if (orClauses.length === 0) return { kind: 'no-match' };

  const candidates = await prisma.customer.findMany({
    where: { OR: orClauses },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailNormalized: true,
      phoneNormalized: true,
      nameNormalized: true,
    },
    take: 10,
  });

  if (candidates.length === 0) return { kind: 'no-match' };

  const matches: BookingCustomerMatchSummary[] = candidates.map((c) => {
    const matchedBy: BookingCustomerMatchKind[] = [];
    if (emailNorm && c.emailNormalized === emailNorm) matchedBy.push('email');
    if (phoneNorm && c.phoneNormalized === phoneNorm) matchedBy.push('phone');
    if (nameSearchable && c.nameNormalized === nameSearchable) matchedBy.push('name');
    const confidence: 'strong' | 'medium' = matchedBy.includes('email') ? 'strong' : 'medium';
    return {
      customerId: c.id,
      customerName: c.name,
      customerEmail: c.email,
      customerPhone: c.phone,
      matchedBy,
      confidence,
    };
  });

  matches.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === 'strong' ? -1 : 1;
    return b.matchedBy.length - a.matchedBy.length;
  });

  return { kind: 'matches-found', matches };
}

export type LinkBookingResult =
  | { ok: true; customerId: string; created: boolean; alreadyLinked: boolean }
  | { ok: false; error: string; status: number };

export async function linkBookingToCustomer(input: {
  bookingId: string;
  action: 'link' | 'create';
  customerId?: string;
  actor?: string;
}): Promise<LinkBookingResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      customerId: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      preferredLocale: true,
    },
  });
  if (!booking) return { ok: false, error: 'Reserva no trobada', status: 404 };

  if (booking.customerId) {
    return { ok: true, customerId: booking.customerId, created: false, alreadyLinked: true };
  }

  let resolvedCustomerId: string;
  let created = false;

  if (input.action === 'link') {
    if (!input.customerId) {
      return { ok: false, error: 'Cal customerId per vincular', status: 400 };
    }
    const exists = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: 'Client no trobat', status: 404 };
    resolvedCustomerId = exists.id;
  } else {
    if (!booking.clientEmail) {
      return {
        ok: false,
        error: 'La reserva no té email per crear un client nou',
        status: 400,
      };
    }
    const emailNormalized = normalizeEmail(booking.clientEmail);
    const phoneNormalized = booking.clientPhone ? normalizePhone(booking.clientPhone) : null;
    const nameNormalized = normalizeName(booking.clientName);

    const conflict = await prisma.customer.findFirst({
      where: { emailNormalized },
      select: { id: true },
    });
    if (conflict) {
      return {
        ok: false,
        error: 'Ja existeix un client amb aquest email. Cal vincular en lloc de crear.',
        status: 409,
      };
    }

    const customer = await prisma.customer.create({
      data: {
        email: booking.clientEmail.toLowerCase().trim(),
        emailNormalized,
        name: booking.clientName,
        nameNormalized,
        phone: booking.clientPhone || null,
        phoneNormalized,
        source: 'OTHER',
        preferredLocale: booking.preferredLocale || 'ca',
      },
      select: { id: true },
    });
    resolvedCustomerId = customer.id;
    created = true;
  }

  await prisma.booking.update({
    where: { id: input.bookingId },
    data: { customerId: resolvedCustomerId },
  });

  return { ok: true, customerId: resolvedCustomerId, created, alreadyLinked: false };
}
