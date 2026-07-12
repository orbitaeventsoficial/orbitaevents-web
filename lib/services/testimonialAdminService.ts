import { Prisma } from '@prisma/client';
import { CUSTOMER_ACTIVITY_ACTIONS } from '@/lib/constants/customer-crm';
import { prisma } from '@/lib/prisma';

type TestimonialListInput = {
  status?: string | null;
  limit: number;
  offset: number;
};

export type PendingTestimonialReminderItem = {
  id: string;
  name: string;
  email: string;
  rating: number;
  textPreview: string;
  createdAt: Date;
};

export async function listAdminTestimonials(input: TestimonialListInput) {
  const where =
    input.status === 'pending'
      ? { isApproved: false }
      : input.status === 'approved'
      ? { isApproved: true }
      : {};

  const rawTestimonials = await prisma.customerTestimonial.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: input.limit,
    skip: input.offset,
  });

  const discountCodeIds = rawTestimonials
    .map((testimonial) => testimonial.discountCodeId)
    .filter((id): id is string => id !== null);

  const discountCodesMap = discountCodeIds.length > 0
    ? new Map(
        (await prisma.customerDiscountCode.findMany({
          where: { id: { in: discountCodeIds } },
          select: { id: true, code: true, discountPercent: true },
        })).map((discountCode) => [
          discountCode.id,
          { code: discountCode.code, discountPercent: discountCode.discountPercent },
        ])
      )
    : new Map<string, { code: string; discountPercent: number }>();

  const testimonials = rawTestimonials.map((testimonial) => ({
    ...testimonial,
    discountCode: testimonial.discountCodeId
      ? discountCodesMap.get(testimonial.discountCodeId) || null
      : null,
  }));

  return { ok: true, testimonials };
}

export async function moderateTestimonial(id?: string, action?: string) {
  if (!id || !action) {
    return { status: 400, body: { ok: false, error: 'Missing id or action' } };
  }

  if (action !== 'approve' && action !== 'hide' && action !== 'delete') {
    return { status: 400, body: { ok: false, error: 'Unknown action' } };
  }

  return prisma.$transaction(async (tx) => {
    const testimonial = await tx.customerTestimonial.findUnique({
      where: { id },
      select: {
        id: true,
        customerId: true,
        rating: true,
        eventType: true,
        text: true,
      },
    });

    if (!testimonial) {
      return { status: 404, body: { ok: false, error: 'Testimonial not found' } };
    }

    const activityDetails = {
      testimonialId: testimonial.id,
      rating: testimonial.rating,
      eventType: testimonial.eventType ? String(testimonial.eventType) : null,
      textPreview: testimonial.text.trim().replace(/\s+/g, ' ').slice(0, 180),
      moderationAction: action,
    } satisfies Prisma.InputJsonObject;

    if (action === 'approve') {
      const updated = await tx.customerTestimonial.update({
        where: { id },
        data: { isApproved: true },
      });
      await tx.customerActivity.create({
        data: {
          customerId: testimonial.customerId,
          action: CUSTOMER_ACTIVITY_ACTIONS.TESTIMONIAL_APPROVED,
          details: activityDetails,
        },
      });
      return { status: 200, body: { ok: true, testimonial: updated } };
    }

    if (action === 'hide') {
      const updated = await tx.customerTestimonial.update({
        where: { id },
        data: { isApproved: false },
      });
      await tx.customerActivity.create({
        data: {
          customerId: testimonial.customerId,
          action: CUSTOMER_ACTIVITY_ACTIONS.TESTIMONIAL_HIDDEN,
          details: activityDetails,
        },
      });
      return { status: 200, body: { ok: true, testimonial: updated } };
    }

    await tx.customerTestimonial.delete({ where: { id } });
    await tx.customerActivity.create({
      data: {
        customerId: testimonial.customerId,
        action: CUSTOMER_ACTIVITY_ACTIONS.TESTIMONIAL_DELETED,
        details: activityDetails,
      },
    });
    return { status: 200, body: { ok: true } };
  });
}

export async function countPendingTestimonials(): Promise<number> {
  return prisma.customerTestimonial.count({ where: { isApproved: false } });
}

export async function listPendingTestimonialsForReminder(limit = 10): Promise<PendingTestimonialReminderItem[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 10, 1), 25);
  const testimonials = await prisma.customerTestimonial.findMany({
    where: { isApproved: false },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });

  return testimonials.map((testimonial) => ({
    id: testimonial.id,
    name: testimonial.customer.name,
    email: testimonial.customer.email,
    rating: testimonial.rating,
    textPreview: testimonial.text.trim().replace(/\s+/g, ' ').slice(0, 180),
    createdAt: testimonial.createdAt,
  }));
}
