// app/api/admin/dashboard/route.ts
// API per obtenir dades del dashboard
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { cachedQuery, CacheTTL } from '@/lib/query-cache';
import { handleApiError } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Estadístiques de la BBDD amb caching
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
      settings,
      recentLeads,
      recentBookings,
    ] = await Promise.all([
      // Total leads - Cache 5 min
      cachedQuery(
        'dashboard:leads:total',
        () => prisma.lead.count(),
        CacheTTL.MEDIUM
      ),

      // Nous leads aquest mes - Cache 30s (més dinàmic)
      cachedQuery(
        `dashboard:leads:month:${startOfMonth.toISOString()}`,
        () => prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
        CacheTTL.VERY_SHORT
      ),

      // Leads aquest any - Cache 5 min
      cachedQuery(
        `dashboard:leads:year:${startOfYear.getFullYear()}`,
        () => prisma.lead.count({ where: { createdAt: { gte: startOfYear } } }),
        CacheTTL.MEDIUM
      ),

      // Total reserves - Cache 5 min
      cachedQuery(
        'dashboard:bookings:total',
        () => prisma.booking.count(),
        CacheTTL.MEDIUM
      ),

      // Reserves aquest mes - Cache 30s
      cachedQuery(
        `dashboard:bookings:month:${startOfMonth.toISOString()}`,
        () => prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
        CacheTTL.VERY_SHORT
      ),

      // Reserves completades - Cache 5 min
      cachedQuery(
        'dashboard:bookings:completed',
        () => prisma.booking.count({ where: { status: 'COMPLETED' } }),
        CacheTTL.MEDIUM
      ),

      // Reserves pendents - Cache 30s
      cachedQuery(
        'dashboard:bookings:pending',
        () => prisma.booking.count({ where: { status: 'PENDING' } }),
        CacheTTL.VERY_SHORT
      ),

      // Pròxims events - Cache 1 min
      cachedQuery(
        'dashboard:bookings:upcoming',
        () =>
          prisma.booking.findMany({
            where: {
              eventDate: { gte: now },
              status: { in: ['CONFIRMED', 'PREPARING'] },
            },
            include: {
              pack: { include: { translations: { where: { locale: 'ca' } } } },
            },
            orderBy: { eventDate: 'asc' },
            take: 5,
          }),
        CacheTTL.SHORT
      ),

      // Facturació aquest mes - Cache 1 min
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

      // Facturació aquest any - Cache 5 min
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

      // Estadístiques inventari - Cache 5 min
      cachedQuery(
        'dashboard:inventory:stats',
        () =>
          prisma.inventoryItem.groupBy({
            by: ['status'],
            _count: true,
          }),
        CacheTTL.MEDIUM
      ),

      // Settings - Cache 15 min (rarament canvia)
      cachedQuery(
        'dashboard:settings:stats',
        () => prisma.setting.findMany({ where: { category: 'stats' } }),
        CacheTTL.LONG
      ),

      // Últims leads - Cache 30s
      cachedQuery(
        'dashboard:leads:recent',
        () =>
          prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
        CacheTTL.VERY_SHORT
      ),

      // Últimes reserves - Cache 30s
      cachedQuery(
        'dashboard:bookings:recent',
        () =>
          prisma.booking.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              pack: { include: { translations: { where: { locale: 'ca' } } } },
            },
          }),
        CacheTTL.VERY_SHORT
      ),
    ]);

    // Transformar settings a objecte
    const statsSettings = settings.reduce((acc, s) => {
      acc[s.key] = s.type === 'NUMBER' ? parseInt(s.value) : s.value;
      return acc;
    }, {} as Record<string, string | number>);

    // Calcular conversió
    const leadsWon = await prisma.lead.count({ where: { status: 'WON' } });
    const conversionRate = totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0;

    return NextResponse.json({
      ok: true,
      dashboard: {
        // Stats públiques (de la web)
        publicStats: {
          totalEvents: statsSettings.total_events || 0,
          totalPeople: statsSettings.total_people || 0,
          satisfaction: statsSettings.satisfaction_rate || '100%',
          since: statsSettings.year_started || 2023,
        },

        // Leads
        leads: {
          total: totalLeads,
          thisMonth: newLeadsThisMonth,
          thisYear: leadsThisYear,
          conversionRate,
          recent: recentLeads,
        },

        // Reserves
        bookings: {
          total: totalBookings,
          thisMonth: bookingsThisMonth,
          completed: completedBookings,
          pending: pendingBookings,
          upcoming: upcomingBookings,
          recent: recentBookings,
        },

        // Facturació
        revenue: {
          thisMonth: revenueThisMonth._sum.total || 0,
          thisYear: revenueThisYear._sum.total || 0,
        },

        // Inventari
        inventory: inventoryStats.reduce((acc, s) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    return handleApiError(error, {
      context: 'Fetching dashboard stats',
      userMessage: 'Error al cargar las estadísticas del panel',
    });
  }
}
