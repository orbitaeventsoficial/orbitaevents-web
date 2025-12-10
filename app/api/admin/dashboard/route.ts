// app/api/admin/dashboard/route.ts
// API per obtenir dades del dashboard
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Estadístiques de la BBDD
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
      // Total leads
      prisma.lead.count(),

      // Nous leads aquest mes
      prisma.lead.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Leads aquest any
      prisma.lead.count({
        where: { createdAt: { gte: startOfYear } },
      }),

      // Total reserves
      prisma.booking.count(),

      // Reserves aquest mes
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Reserves completades
      prisma.booking.count({
        where: { status: 'COMPLETED' },
      }),

      // Reserves pendents de confirmar
      prisma.booking.count({
        where: { status: 'PENDING' },
      }),

      // Pròxims events (confirmats)
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

      // Facturació aquest mes
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          eventDate: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),

      // Facturació aquest any
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          eventDate: { gte: startOfYear },
        },
        _sum: { total: true },
      }),

      // Estadístiques inventari
      prisma.inventoryItem.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Settings (stats públiques)
      prisma.setting.findMany({
        where: { category: 'stats' },
      }),

      // Últims leads
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Últimes reserves
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          pack: { include: { translations: { where: { locale: 'ca' } } } },
        },
      }),
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
    console.error('Error obtenint dashboard:', error);
    return NextResponse.json(
      { error: 'Error obtenint dades del dashboard' },
      { status: 500 }
    );
  }
}
