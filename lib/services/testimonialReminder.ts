import { prisma } from '@/lib/prisma';
import { sendTestimonialsReminderEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';

type ReminderTestimonial = {
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export async function sendPendingTestimonialsReminder() {
  const pendingCount = await prisma.customerTestimonial.count({
    where: { isApproved: false },
  });

  if (pendingCount === 0) {
    return { sent: false, pendingCount, sampleCount: 0 };
  }

  const testimonials = await prisma.customerTestimonial.findMany({
    where: { isApproved: false },
    include: {
      customer: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  const to =
    (process.env.CONTACT_TO || SITE_CONFIG.business.email || '').trim();
  if (!to) {
    throw new Error('Missing CONTACT_TO or SITE_CONFIG.business.email');
  }

  const dashboardUrl = `${
    process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com'
  }/admin/ressenyes`;

  const sample: ReminderTestimonial[] = testimonials.map((t) => ({
    name: t.customer.name,
    rating: t.rating,
    comment: t.text,
    createdAt: t.createdAt,
  }));

  await sendTestimonialsReminderEmail({
    to,
    pendingCount,
    testimonials: sample,
    dashboardUrl,
  });

  return { sent: true, pendingCount, sampleCount: sample.length };
}
