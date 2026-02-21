// app/api/admin/pricing/route.ts
// API unificada per gestionar preus i veure dades vinculades
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function normalizeLocale(raw?: string | null): 'ca' | 'es' | 'en' {
  const value = String(raw || 'ca').toLowerCase();
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('en')) return 'en';
  return 'ca';
}

function pickTranslation<T extends { locale: string }>(translations: T[], locale: 'ca' | 'es' | 'en'): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ||
    translations.find((t) => t.locale === 'ca') ||
    translations.find((t) => t.locale === 'es') ||
    translations.find((t) => t.locale === 'en') ||
    translations[0]
  );
}

// GET - Obtenir tots els preus i dades vinculades
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const locale = normalizeLocale(searchParams.get('locale'));

    // 1. Extras (EDITABLES - preus que pots canviar)
    const extras = await prisma.extra.findMany({
      include: {
        translations: true,
        inventory: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                value: true,
              },
            },
          },
        },
        bookingExtras: {
          take: 8,
          orderBy: {
            booking: {
              eventDate: 'desc',
            },
          },
          include: {
            booking: {
              select: {
                id: true,
                reference: true,
                eventDate: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // 2. Packs (NOMÉS LECTURA - calculats automàticament)
    const packs = await prisma.pack.findMany({
      include: {
        translations: true,
        inventory: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                value: true,
              },
            },
          },
        },
        bookings: {
          select: {
            id: true,
            reference: true,
            eventDate: true,
            status: true,
            total: true,
          },
          orderBy: { eventDate: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // 3. Inventari amb historial d'ús
    const inventory = await prisma.inventoryItem.findMany({
      include: {
        usageHistory: {
          orderBy: { usedAt: 'desc' },
          take: 3,
        },
        bookingItems: {
          include: {
            booking: {
              select: {
                id: true,
                reference: true,
                eventDate: true,
                status: true,
              },
            },
          },
          orderBy: {
            booking: {
              eventDate: 'desc',
            },
          },
          take: 3,
        },
        _count: {
          select: {
            usageHistory: true,
            bookingItems: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // 4. Estadístiques globals
    const stats = {
      totalExtras: extras.length,
      totalPacks: packs.length,
      totalInventory: inventory.length,
      totalBookings: await prisma.booking.count(),
      completedBookings: await prisma.booking.count({
        where: { status: 'COMPLETED' },
      }),
      totalRevenue: await prisma.booking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { total: true },
      }),
      // Extras més venuts
      topExtras: extras
        .map(e => ({
          slug: e.slug,
          name: pickTranslation(e.translations, locale)?.name || e.slug,
          totalSales: e.bookingExtras.length,
          revenue: e.bookingExtras.reduce((sum, be) => sum + be.price * be.quantity, 0),
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5),
      // Packs més venuts
      topPacks: packs
        .map(p => ({
          slug: p.slug,
          name: pickTranslation(p.translations, locale)?.name || p.slug,
          totalBookings: p._count.bookings,
          revenue: p.bookings.reduce((sum, b) => sum + b.total, 0),
        }))
        .sort((a, b) => b.totalBookings - a.totalBookings)
        .slice(0, 5),
    };

    // 5. Calcular hores d'ús total per equip
    const inventoryWithStats = inventory.map(item => {
      const totalHours = item.usageHistory.reduce((sum, u) => sum + (u.hoursUsed || 0), 0);
      const totalEvents = item._count.bookingItems;
      return {
        ...item,
        stats: {
          totalHours,
          totalEvents,
          avgHoursPerEvent: totalEvents > 0 ? totalHours / totalEvents : 0,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        extras: extras.map(e => ({
          id: e.id,
          slug: e.slug,
          name: pickTranslation(e.translations, locale)?.name || e.slug,
          description: pickTranslation(e.translations, locale)?.description,
          price: e.price,
          priceType: e.priceType,
          isActive: e.isActive,
          order: e.order,
          // Equipament vinculat
          linkedInventory: e.inventory.map(i => ({
            itemCode: i.item.code,
            itemName: i.item.name,
            itemValue: i.item.value,
            quantity: i.quantity,
          })),
          // Historial de vendes
          salesCount: e.bookingExtras.length,
          totalRevenue: e.bookingExtras.reduce((sum, be) => sum + be.price * be.quantity, 0),
          recentSales: e.bookingExtras.slice(0, 5).map(be => ({
            bookingRef: be.booking.reference,
            date: be.booking.eventDate,
            price: be.price,
            quantity: be.quantity,
          })),
          // Editable
          editable: true,
        })),
        packs: packs.map(p => ({
          id: p.id,
          slug: p.slug,
          name: pickTranslation(p.translations, locale)?.name || p.slug,
          tagline: pickTranslation(p.translations, locale)?.tagline,
          price: p.price,
          originalPrice: p.originalPrice,
          extraHourPrice: p.extraHourPrice,
          djHours: p.djHours,
          soundWatts: p.soundWatts,
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          // Equipament inclòs
          includedInventory: p.inventory.map(i => ({
            itemCode: i.item.code,
            itemName: i.item.name,
            itemValue: i.item.value,
            quantity: i.quantity,
            isRequired: i.isRequired,
          })),
          // Valor total equipament
          totalInventoryValue: p.inventory.reduce(
            (sum, i) => sum + i.item.value * i.quantity,
            0
          ),
          // Estadístiques
          bookingsCount: p._count.bookings,
          totalRevenue: p.bookings.reduce((sum, b) => sum + b.total, 0),
          recentBookings: p.bookings.slice(0, 5).map(b => ({
            reference: b.reference,
            date: b.eventDate,
            total: b.total,
            status: b.status,
          })),
          // NO editable des d'aquí
          editable: false,
          editableNote: 'Edita els packs a /admin/packs',
        })),
        inventory: inventoryWithStats.map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          category: item.category,
          value: item.value,
          status: item.status,
          condition: item.condition,
          // Estadístiques d'ús
          stats: item.stats,
          // Últims events
          recentUsage: item.bookingItems.slice(0, 5).map(bi => ({
            bookingRef: bi.booking.reference,
            date: bi.booking.eventDate,
            status: bi.booking.status,
          })),
          // NO editable des d'aquí
          editable: false,
          editableNote: 'Edita l\'inventari a /admin/inventory',
        })),
        stats,
      },
    });
  } catch (error) {
    log.error('Error obtenint preus:', error);
    return NextResponse.json(
      { error: 'Error obtenint dades de preus' },
      { status: 500 }
    );
  }
}

// PUT - Actualitzar preus dels extras (NOMÉS els extras són editables aquí)
export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const { extraId, price } = body as {
      extraId: string;
      price: number;
    };

    if (!extraId || price === undefined) {
      return NextResponse.json(
        { error: 'extraId i price són obligatoris' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'El preu no pot ser negatiu' },
        { status: 400 }
      );
    }

    // Verificar que l'extra existeix
    const extra = await prisma.extra.findUnique({
      where: { id: extraId },
      include: { translations: true },
    });

    if (!extra) {
      return NextResponse.json(
        { error: 'Extra no trobat' },
        { status: 404 }
      );
    }

    // Actualitzar preu
    const updated = await prisma.extra.update({
      where: { id: extraId },
      data: { price },
    });

    // Log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'extra',
        entityId: extraId,
        details: {
          field: 'price',
          oldValue: extra.price,
          newValue: price,
          extraName: pickTranslation(extra.translations, 'ca')?.name || extra.slug,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Preu de "${pickTranslation(extra.translations, 'ca')?.name || extra.slug}" actualitzat a ${price}€`,
      extra: updated,
    });
  } catch (error) {
    log.error('Error actualitzant preu:', error);
    return NextResponse.json(
      { error: 'Error actualitzant preu' },
      { status: 500 }
    );
  }
}
