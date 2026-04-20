// lib/services/capacityConflictService.ts
// ═══════════════════════════════════════════════════════════════════════════
// CAPACITY CONFLICT DETECTOR
// Detecta conflictes d'inventari entre reserves el mateix dia: quan la suma
// de quantitats demanades d'un ítem supera l'stock disponible.
// Funció pura + wrapper async.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type CapacityConflict = {
  date: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  stockAvailable: number;
  totalDemanded: number;
  deficit: number;
  bookings: Array<{ bookingId: string; clientName: string; quantity: number }>;
};

export type CapacityConflictReport = {
  generatedAt: string;
  windowDays: number;
  conflicts: CapacityConflict[];
  verdict: string;
};

export type CapacityBookingInput = {
  bookingId: string;
  clientName: string;
  eventDate: string;
  items: Array<{ itemId: string; itemName: string; itemCode: string; stock: number; quantity: number }>;
};

export type CapacityConflictInput = {
  bookings: CapacityBookingInput[];
  now: Date;
  windowDays?: number;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function detectCapacityConflicts(input: CapacityConflictInput): CapacityConflictReport {
  const windowDays = input.windowDays ?? 14;

  // Agrupa demanda per dia × ítem
  const dayItemMap = new Map<string, {
    itemId: string;
    itemName: string;
    itemCode: string;
    stock: number;
    bookings: Array<{ bookingId: string; clientName: string; quantity: number }>;
  }>();

  for (const booking of input.bookings) {
    for (const item of booking.items) {
      const key = `${booking.eventDate}|${item.itemId}`;
      let entry = dayItemMap.get(key);
      if (!entry) {
        entry = {
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          stock: item.stock,
          bookings: [],
        };
        dayItemMap.set(key, entry);
      }
      entry.bookings.push({
        bookingId: booking.bookingId,
        clientName: booking.clientName,
        quantity: item.quantity,
      });
    }
  }

  const conflicts: CapacityConflict[] = [];

  for (const [key, entry] of dayItemMap.entries()) {
    const totalDemanded = entry.bookings.reduce((sum, b) => sum + b.quantity, 0);
    if (totalDemanded <= entry.stock) continue;
    if (entry.bookings.length < 2) continue;

    const date = key.split('|')[0];
    conflicts.push({
      date,
      itemId: entry.itemId,
      itemName: entry.itemName,
      itemCode: entry.itemCode,
      stockAvailable: entry.stock,
      totalDemanded,
      deficit: totalDemanded - entry.stock,
      bookings: entry.bookings,
    });
  }

  conflicts.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return b.deficit - a.deficit;
  });

  let verdict: string;
  if (conflicts.length === 0) {
    verdict = `Cap conflicte de capacitat en els pròxims ${windowDays} dies.`;
  } else {
    const days = new Set(conflicts.map((c) => c.date)).size;
    verdict = `${conflicts.length} ${conflicts.length === 1 ? 'conflicte' : 'conflictes'} en ${days} ${days === 1 ? 'dia' : 'dies'}. Revisa l'inventari.`;
  }

  return {
    generatedAt: input.now.toISOString(),
    windowDays,
    conflicts,
    verdict,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadCapacityConflicts(now: Date = new Date(), windowDays = 14): Promise<CapacityConflictReport> {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(todayStart.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
      eventDate: { gte: todayStart, lt: windowEnd },
    },
    select: {
      id: true,
      clientName: true,
      eventDate: true,
      inventory: {
        select: {
          quantity: true,
          item: {
            select: {
              id: true,
              name: true,
              code: true,
              stockQuantity: true,
            },
          },
        },
      },
    },
  });

  const mapped: CapacityBookingInput[] = bookings.map((b) => ({
    bookingId: b.id,
    clientName: b.clientName,
    eventDate: b.eventDate.toISOString().slice(0, 10),
    items: b.inventory.map((inv) => ({
      itemId: inv.item.id,
      itemName: inv.item.name,
      itemCode: inv.item.code,
      stock: inv.item.stockQuantity ?? 1,
      quantity: inv.quantity,
    })),
  }));

  return detectCapacityConflicts({ bookings: mapped, now, windowDays });
}
