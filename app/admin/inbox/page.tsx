import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';
import { isImapConfigured } from '@/lib/env';
import SafataClient from './SafataClient';
import './inbox.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Safata | Òrbita Admin',
};

async function getLeads() {
  try {
    return await cachedQuery(
      'admin:inbox:leads:50',
      () =>
        prisma.lead.findMany({
          where: { email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } } },
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
            eventStartTime: true,
            eventEndTime: true,
            eventLocation: true,
            source: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      CacheTTL.VERY_SHORT,
    );
  } catch (error) {
    log.error('[Safata] Error carregant leads:', error);
    return [];
  }
}

async function getStats() {
  try {
    const startToday = new Date(new Date().setHours(0, 0, 0, 0));
    const [totalLeads, unreadLeads, todayLeads] = await Promise.all([
      prisma.lead.count({ where: { email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } } } }),
      prisma.lead.count({
        where: { email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } }, status: 'NEW' },
      }),
      prisma.lead.count({
        where: {
          email: { not: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
          createdAt: { gte: startToday },
        },
      }),
    ]);
    return { totalLeads, unreadLeads, todayLeads };
  } catch (error) {
    log.error('[Safata] Error carregant stats:', error);
    return { totalLeads: 0, unreadLeads: 0, todayLeads: 0 };
  }
}

async function getEmailSends() {
  try {
    return await prisma.emailSend.findMany({
      select: {
        id: true,
        to: true,
        subject: true,
        templateKey: true,
        leadId: true,
        customerId: true,
        locale: true,
        sentAt: true,
        openedAt: true,
        openCount: true,
        clickedAt: true,
        clickCount: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  } catch (error) {
    log.error('[Safata] Error carregant enviats:', error);
    return [];
  }
}

export default async function SafataPage() {
  const [leads, stats, emailSends] = await Promise.all([getLeads(), getStats(), getEmailSends()]);
  const imapConfigured = isImapConfigured();

  return (
    <SafataClient
      leads={leads}
      stats={stats}
      emailSends={emailSends}
      imapConfigured={imapConfigured}
    />
  );
}
