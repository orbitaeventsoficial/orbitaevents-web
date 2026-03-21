import { RECENT_FEED_ANONYMOUS_NAMES, RECENT_FEED_BOOKING_STATUSES, RECENT_FEED_EVENT_TYPE_ICONS, RECENT_FEED_EVENT_TYPE_SERVICE_LABELS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

type RecentFeedBooking = {
  id: string;
  name: string;
  city: string;
  service: string;
  icon: 'check' | 'sparkles' | 'heart' | 'building';
  timeAgo: string;
  isReal: boolean;
};

export async function listRecentBookingsFeed(): Promise<{ bookings: RecentFeedBooking[] }> {
  const recentBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: [...RECENT_FEED_BOOKING_STATUSES],
      },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      clientName: true,
      eventType: true,
      eventLocation: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  if (recentBookings.length === 0) {
    const liveNotifications = await prisma.liveNotification.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (liveNotifications.length > 0) {
      return {
        bookings: liveNotifications.map((notification) => ({
          id: notification.id,
          name: getAnonymousName(notification.type),
          city: notification.location,
          service: getServiceName(notification.type),
          icon: getIconForType(notification.type),
          timeAgo: getTimeAgo(notification.createdAt),
          isReal: notification.isReal,
        })),
      };
    }
  }

  return {
    bookings: recentBookings.map((booking) => ({
      id: booking.id,
      name: anonymizeName(booking.clientName),
      city: extractCity(booking.eventLocation),
      service: getServiceName(booking.eventType),
      icon: getIconForType(booking.eventType),
      timeAgo: getTimeAgo(booking.createdAt),
      isReal: true,
    })),
  };
}

function anonymizeName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

function getAnonymousName(eventType: string): string {
  const options = RECENT_FEED_ANONYMOUS_NAMES[eventType] || RECENT_FEED_ANONYMOUS_NAMES.OTHER;
  return options[Math.floor(Math.random() * options.length)];
}

function extractCity(location: string): string {
  if (!location) return 'Catalunya';
  const cities = ['Barcelona', 'Girona', 'Granollers', 'Mataró', 'Terrassa', 'Sabadell', 'Vic', 'Blanes', 'Lloret'];
  for (const city of cities) {
    if (location.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  return location.split(',')[0].trim();
}

function getServiceName(eventType: string): string {
  return RECENT_FEED_EVENT_TYPE_SERVICE_LABELS[eventType] || 'Event Personalitzat';
}

function getIconForType(eventType: string): 'check' | 'sparkles' | 'heart' | 'building' {
  return RECENT_FEED_EVENT_TYPE_ICONS[eventType] || 'check';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 5) return 'Ara mateix';
  if (diffMins < 60) return `Fa ${diffMins} min`;
  if (diffHours < 24) return `Fa ${diffHours}h`;
  if (diffDays === 1) return 'Ahir';
  if (diffDays < 7) return `Fa ${diffDays} dies`;
  return 'Aquesta setmana';
}
