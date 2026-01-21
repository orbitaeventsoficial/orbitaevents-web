import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Number(searchParams.get('limit') || 50);
  const offset = Number(searchParams.get('offset') || 0);

  const where =
    status === 'pending'
      ? { isApproved: false }
      : status === 'approved'
      ? { isApproved: true }
      : {};

  const testimonials = await prisma.customerTestimonial.findMany({
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
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ ok: true, testimonials });
}

export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, action } = body as { id?: string; action?: string };

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: 'Missing id or action' }, { status: 400 });
    }

    if (action === 'approve') {
      const updated = await prisma.customerTestimonial.update({
        where: { id },
        data: { isApproved: true },
      });
      return NextResponse.json({ ok: true, testimonial: updated });
    }

    if (action === 'hide') {
      const updated = await prisma.customerTestimonial.update({
        where: { id },
        data: { isApproved: false },
      });
      return NextResponse.json({ ok: true, testimonial: updated });
    }

    if (action === 'delete') {
      await prisma.customerTestimonial.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Failed to update testimonial' }, { status: 500 });
  }
}
