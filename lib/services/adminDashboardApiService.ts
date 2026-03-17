import { prisma } from '@/lib/prisma';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { listAdminSettings } from '@/lib/services/adminSettingsService';

export async function getAdminDashboardApiData(localeParam?: string | null) {
  const localeValue = String(localeParam || 'ca').toLowerCase();
  const locale = localeValue.startsWith('es') ? 'es' : localeValue.startsWith('en') ? 'en' : 'ca';
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalLeads,
    newLeadsThisMonth,
    leadsThisYear,
    totalBookings,
    bookingsThisMonth,
    completedBookings,
    pendingBookings,
    upcomingBookings,
    revenueThisMonth,
    revenueThisYear,
    inventoryStats,
    recentLeads,
    recentBookings,
  ] = await Promise.all([
    cachedQuery('dashboard:leads:total', () => prisma.lead.count(), CacheTTL.MEDIUM),
    cachedQuery(
      `dashboard:leads:month:${startOfMonth.toISOString()}`,
      () => prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      CacheTTL.VERY_SHORT
    ),
    cachedQuery(
      `dashboard:leads:year:${startOfYear.getFullYear()}`,
      () => prisma.lead.count({ where: { createdAt: { gte: startOfYear } } }),
      CacheTTL.MEDIUM
    ),
    cachedQuery('dashboard:bookings:total', () => prisma.booking.count(), CacheTTL.MEDIUM),
    cachedQuery(
      `dashboard:bookings:month:${startOfMonth.toISOString()}`,
      () => prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      CacheTTL.VERY_SHORT
    ),
    cachedQuery('dashboard:bookings:completed', () => prisma.booking.count({ where: { status: 'COMPLETED' } }), CacheTTL.MEDIUM),
    cachedQuery('dashboard:bookings:pending', () => prisma.booking.count({ where: { status: 'PENDING' } }), CacheTTL.VERY_SHORT),
    cachedQuery(
      'dashboard:bookings:upcoming',
      () =>
        prisma.booking.findMany({
          where: {
            eventDate: { gte: now },
            status: { in: ['CONFIRMED', 'PREPARING'] },
          },
          include: {
            pack: { include: { translations: { where: { locale } } } },
          },
          orderBy: { eventDate: 'asc' },
          take: 5,
        }),
      CacheTTL.SHORT
    ),
    cachedQuery(
      `dashboard:revenue:month:${startOfMonth.toISOString()}`,
      () =>
        prisma.booking.aggregate({
          where: {
            status: 'COMPLETED',
            eventDate: { gte: startOfMonth },
          },
          _sum: { total: true },
        }),
      CacheTTL.SHORT
    ),
    cachedQuery(
      `dashboard:revenue:year:${startOfYear.getFullYear()}`,
      () =>
        prisma.booking.aggregate({
          where: {
            status: 'COMPLETED',
            eventDate: { gte: startOfYear },
          },
          _sum: { total: true },
        }),
      CacheTTL.MEDIUM
    ),
    cachedQuery(
      'dashboard:inventory:stats',
      () => prisma.inventoryItem.groupBy({ by: ['status'], _count: true }),
      CacheTTL.MEDIUM
    ),
    cachedQuery('dashboard:leads:recent', () => prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }), CacheTTL.VERY_SHORT),
    cachedQuery(
      'dashboard:bookings:recent',
      () =>
        prisma.booking.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            pack: { include: { translations: { where: { locale } } } },
          },
        }),
      CacheTTL.VERY_SHORT
    ),
  ]);

  const publicStatsSettings = await cachedQuery('dashboard:settings:stats', () => listAdminSettings('stats'), CacheTTL.LONG);
  const statsSettings = publicStatsSettings.settings as Record<string, string | number | boolean | object>;
  const leadsWon = await prisma.lead.count({ where: { status: 'WON' } });
  const conversionRate = totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0;

  return {
    ok: true,
    dashboard: {
      publicStats: {
        totalEvents: statsSettings.total_events || 0,
        totalPeople: statsSettings.total_people || 0,
        satisfaction: statsSettings.satisfaction_rate || '100%',
        since: statsSettings.year_started || 2023,
      },
      leads: {
        total: totalLeads,
        thisMonth: newLeadsThisMonth,
        thisYear: leadsThisYear,
        conversionRate,
        recent: recentLeads,
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
        completed: completedBookings,
        pending: pendingBookings,
        upcoming: upcomingBookings,
        recent: recentBookings,
      },
      revenue: {
        thisMonth: revenueThisMonth._sum.total || 0,
        thisYear: revenueThisYear._sum.total || 0,
      },
      inventory: inventoryStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    },
  };
}
