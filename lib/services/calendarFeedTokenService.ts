import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/app/config/site-config';

const SETTING_KEY = 'integrations.calendar.feedToken';

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export async function getCalendarFeedToken(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  return setting?.value || null;
}

export async function regenerateCalendarFeedToken(): Promise<string> {
  const token = crypto.randomBytes(24).toString('base64url');

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: {
      value: token,
      category: 'config',
      label: 'Calendar feed token',
      description: 'Token to expose booking calendar as ICS feed',
    },
    create: {
      key: SETTING_KEY,
      value: token,
      type: 'STRING',
      category: 'config',
      label: 'Calendar feed token',
      description: 'Token to expose booking calendar as ICS feed',
    },
  });

  return token;
}

export async function isValidCalendarFeedToken(token: string): Promise<boolean> {
  const current = await getCalendarFeedToken();
  return Boolean(current && current === token);
}

export async function buildCalendarFeedIcs(): Promise<string> {
  const now = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 2);

  const bookings = await prisma.booking.findMany({
    where: {
      eventDate: { gte: now, lte: end },
      status: { not: 'CANCELLED' },
    },
    orderBy: { eventDate: 'asc' },
    select: {
      id: true,
      reference: true,
      clientName: true,
      eventType: true,
      eventDate: true,
      eventStartTime: true,
      eventEndTime: true,
      eventLocation: true,
      eventVenue: true,
      status: true,
      notes: true,
      updatedAt: true,
    },
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Orbita Events//Admin Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Orbita Events - Reservas',
    'X-WR-TIMEZONE:Europe/Madrid',
  ];

  bookings.forEach((booking) => {
    const start = new Date(booking.eventDate);
    const endDate = new Date(booking.eventDate);
    endDate.setHours(endDate.getHours() + 6);

    const summary = `${booking.reference} · ${booking.eventType} · ${booking.clientName}`;
    const location = [booking.eventVenue, booking.eventLocation].filter(Boolean).join(' - ');
    const description = [
      `Estado: ${booking.status}`,
      booking.notes ? `Notas: ${booking.notes}` : '',
    ].filter(Boolean).join('\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:booking-${booking.id}@${SITE_CONFIG.web.domain}`);
    lines.push(`DTSTAMP:${toIcsDateTime(new Date(booking.updatedAt))}`);
    lines.push(`DTSTART:${toIcsDateTime(start)}`);
    lines.push(`DTEND:${toIcsDateTime(endDate)}`);
    lines.push(`SUMMARY:${escapeIcs(summary)}`);
    if (location) lines.push(`LOCATION:${escapeIcs(location)}`);
    if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
