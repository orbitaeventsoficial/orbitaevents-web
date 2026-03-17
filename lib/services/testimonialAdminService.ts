import { prisma } from '@/lib/prisma';

type TestimonialListInput = {
  status?: string | null;
  limit: number;
  offset: number;
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

  if (action === 'approve') {
    const updated = await prisma.customerTestimonial.update({
      where: { id },
      data: { isApproved: true },
    });
    return { status: 200, body: { ok: true, testimonial: updated } };
  }

  if (action === 'hide') {
    const updated = await prisma.customerTestimonial.update({
      where: { id },
      data: { isApproved: false },
    });
    return { status: 200, body: { ok: true, testimonial: updated } };
  }

  if (action === 'delete') {
    await prisma.customerTestimonial.delete({ where: { id } });
    return { status: 200, body: { ok: true } };
  }

  return { status: 400, body: { ok: false, error: 'Unknown action' } };
}
