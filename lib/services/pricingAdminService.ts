import { prisma } from '@/lib/prisma';

import type { Locale } from '@/i18n';

type ExtraBooking = {
  price: number;
  quantity: number;
  booking: {
    reference: string;
    eventDate: Date;
    status: string;
  };
};

type TranslationLike = {
  locale: string;
  name?: string | null;
  description?: string | null;
  tagline?: string | null;
};

function pickTranslation<T extends TranslationLike>(translations: T[], locale: Locale): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ||
    translations.find((t) => t.locale === 'ca') ||
    translations.find((t) => t.locale === 'es') ||
    translations.find((t) => t.locale === 'en') ||
    translations[0]
  );
}

export function normalizePricingLocale(raw?: string | null): Locale {
  const value = String(raw || 'ca').toLowerCase();
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('en')) return 'en';
  return 'ca';
}

export async function getPricingAdminData(locale: Locale) {
  const [extras, packs, inventory, totalBookings, completedBookings, totalRevenue] = await Promise.all([
    prisma.extra.findMany({
      include: {
        translations: true,
        inventory: {
          include: {
            item: {
              select: { id: true, code: true, name: true, value: true },
            },
          },
        },
        bookingExtras: {
          take: 8,
          orderBy: { booking: { eventDate: 'desc' } },
          include: {
            booking: {
              select: { id: true, reference: true, eventDate: true, status: true },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
    prisma.pack.findMany({
      include: {
        translations: true,
        inventory: {
          include: {
            item: {
              select: { id: true, code: true, name: true, value: true },
            },
          },
        },
        bookings: {
          select: { id: true, reference: true, eventDate: true, status: true, total: true },
          orderBy: { eventDate: 'desc' },
          take: 10,
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { order: 'asc' },
    }),
    prisma.inventoryItem.findMany({
      include: {
        usageHistory: { orderBy: { usedAt: 'desc' }, take: 3 },
        bookingItems: {
          include: {
            booking: {
              select: { id: true, reference: true, eventDate: true, status: true },
            },
          },
          orderBy: { booking: { eventDate: 'desc' } },
          take: 3,
        },
        _count: { select: { usageHistory: true, bookingItems: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true } }),
  ]);

  const stats = {
    totalExtras: extras.length,
    totalPacks: packs.length,
    totalInventory: inventory.length,
    totalBookings,
    completedBookings,
    totalRevenue,
    topExtras: extras
      .map((extra) => ({
        slug: extra.slug,
        name: pickTranslation(extra.translations, locale)?.name || extra.slug,
        totalSales: extra.bookingExtras.length,
        revenue: extra.bookingExtras.reduce((sum: number, row: ExtraBooking) => sum + row.price * row.quantity, 0),
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5),
    topPacks: packs
      .map((pack) => ({
        slug: pack.slug,
        name: pickTranslation(pack.translations, locale)?.name || pack.slug,
        totalBookings: pack._count.bookings,
        revenue: pack.bookings.reduce((sum, booking) => sum + booking.total, 0),
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 5),
  };

  const inventoryWithStats = inventory.map((item) => {
    const totalHours = item.usageHistory.reduce((sum, usage) => sum + (usage.hoursUsed || 0), 0);
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

  return {
    ok: true,
    data: {
      extras: extras.map((extra) => ({
        id: extra.id,
        slug: extra.slug,
        name: pickTranslation(extra.translations, locale)?.name || extra.slug,
        description: pickTranslation(extra.translations, locale)?.description,
        price: extra.price,
        priceType: extra.priceType,
        isActive: extra.isActive,
        order: extra.order,
        linkedInventory: extra.inventory.map((inventoryRow) => ({
          itemCode: inventoryRow.item.code,
          itemName: inventoryRow.item.name,
          itemValue: inventoryRow.item.value,
          quantity: inventoryRow.quantity,
        })),
        costPerUnit: extra.costPerUnit,
        salesCount: extra.bookingExtras.length,
        totalRevenue: extra.bookingExtras.reduce((sum: number, row: ExtraBooking) => sum + row.price * row.quantity, 0),
        recentSales: extra.bookingExtras.slice(0, 5).map((row: ExtraBooking) => ({
          bookingRef: row.booking.reference,
          date: row.booking.eventDate,
          price: row.price,
          quantity: row.quantity,
        })),
        editable: true,
      })),
      packs: packs.map((pack) => ({
        id: pack.id,
        slug: pack.slug,
        name: pickTranslation(pack.translations, locale)?.name || pack.slug,
        tagline: pickTranslation(pack.translations, locale)?.tagline,
        price: pack.price,
        originalPrice: pack.originalPrice,
        extraHourPrice: pack.extraHourPrice,
        djHours: pack.djHours,
        soundWatts: pack.soundWatts,
        isActive: pack.isActive,
        isFeatured: pack.isFeatured,
        includedInventory: pack.inventory.map((inventoryRow) => ({
          itemCode: inventoryRow.item.code,
          itemName: inventoryRow.item.name,
          itemValue: inventoryRow.item.value,
          quantity: inventoryRow.quantity,
          isRequired: inventoryRow.isRequired,
        })),
        totalInventoryValue: pack.inventory.reduce((sum, inventoryRow) => sum + inventoryRow.item.value * inventoryRow.quantity, 0),
        bookingsCount: pack._count.bookings,
        totalRevenue: pack.bookings.reduce((sum, booking) => sum + booking.total, 0),
        recentBookings: pack.bookings.slice(0, 5).map((booking) => ({
          reference: booking.reference,
          date: booking.eventDate,
          total: booking.total,
          status: booking.status,
        })),
        editable: false,
        editableNote: 'Edita els packs a /admin/packs',
      })),
      inventory: inventoryWithStats.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        value: item.value,
        status: item.status,
        condition: item.condition,
        stats: item.stats,
        recentUsage: item.bookingItems.slice(0, 5).map((bookingItem) => ({
          bookingRef: bookingItem.booking.reference,
          date: bookingItem.booking.eventDate,
          status: bookingItem.booking.status,
        })),
        editable: false,
        editableNote: 'Edita l\'inventari a /admin/inventory',
      })),
      stats,
    },
  };
}

export async function updateExtraPrice(extraId: string, price: number) {
  if (!extraId || price === undefined) {
    return { status: 400, body: { error: 'extraId i price són obligatoris' } };
  }

  if (price < 0) {
    return { status: 400, body: { error: 'El preu no pot ser negatiu' } };
  }

  const extra = await prisma.extra.findUnique({
    where: { id: extraId },
    include: { translations: true },
  });

  if (!extra) {
    return { status: 404, body: { error: 'Extra no trobat' } };
  }

  const updated = await prisma.extra.update({
    where: { id: extraId },
    data: { price },
  });

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

  return {
    status: 200,
    body: {
      ok: true,
      message: `Preu de "${pickTranslation(extra.translations, 'ca')?.name || extra.slug}" actualitzat a ${price}€`,
      extra: updated,
    },
  };
}
