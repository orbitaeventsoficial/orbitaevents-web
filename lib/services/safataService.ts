import { prisma } from '@/lib/prisma';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';

function excludePlaceholder() {
  return { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } };
}

export async function getSafataLeads() {
  return prisma.lead.findMany({
    where: { email: excludePlaceholder() },
    select: {
      id: true,
      customerId: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      eventType: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      preferredLocale: true,
      interestedPackId: true,
      interestedExtras: true,
      budget: true,
      guestCount: true,
      eventDate: true,
      eventLocation: true,
      source: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getSafataStats() {
  const startToday = new Date(new Date().setHours(0, 0, 0, 0));
  const [totalLeads, unreadLeads, todayLeads] = await Promise.all([
    prisma.lead.count({ where: { email: excludePlaceholder() } }),
    prisma.lead.count({ where: { email: excludePlaceholder(), status: 'NEW' } }),
    prisma.lead.count({
      where: { email: excludePlaceholder(), createdAt: { gte: startToday } },
    }),
  ]);
  return { totalLeads, unreadLeads, todayLeads };
}

export async function getEmailSignatureSetting(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: 'email.signature' } });
  return row?.value ?? '';
}

export async function saveEmailSignatureSetting(value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key: 'email.signature' },
    update: { value },
    create: {
      key: 'email.signature',
      value,
      type: 'STRING',
      category: 'email',
      label: 'Firma de mail',
      description: "Text que apareix al peu de tots els emails enviats des de l'admin",
    },
  });
}
