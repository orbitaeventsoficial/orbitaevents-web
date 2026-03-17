import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CAL_API = 'https://www.googleapis.com/calendar/v3';
const REFRESH_TOKEN_KEY = 'integrations.googleCalendar.refreshToken';
const CALENDAR_ID_KEY = 'integrations.googleCalendar.calendarId';
const EVENT_KEY_PREFIX = 'integrations.googleCalendar.bookingEvent.';

type SyncStatus = 'synced' | 'deleted' | 'skipped' | 'error';
type SyncAction = 'upsert' | 'delete';

interface CalendarSyncResult {
  ok: boolean;
  status: SyncStatus;
  action?: SyncAction;
  bookingId: string;
  eventId?: string | null;
  reason?: string;
  error?: string;
}

type BookingData = {
  id: string;
  reference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: Date;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string;
  eventVenue: string | null;
  notes: string | null;
  status: string;
  total: number;
  depositPaid: boolean;
  remainingPaid: boolean;
};

function eventSettingKey(bookingId: string): string {
  return `${EVENT_KEY_PREFIX}${bookingId}`;
}

async function upsertSetting(key: string, value: string, label: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value, type: 'STRING', category: 'integrations', label },
    create: { key, value, type: 'STRING', category: 'integrations', label },
  });
}

async function deleteSetting(key: string) {
  await prisma.setting.deleteMany({ where: { key } });
}

function getDateOnly(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseTime(baseDate: Date, hhmm: string | null): Date | null {
  if (!hhmm) return null;
  const [hRaw, mRaw] = hhmm.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const date = new Date(baseDate);
  date.setHours(h, m, 0, 0);
  return date;
}

function buildEventPayload(booking: BookingData) {
  const title = `${booking.reference} · ${booking.clientName} · ${booking.eventType}`;
  const location = [booking.eventVenue, booking.eventLocation].filter(Boolean).join(' · ');
  const paymentStatus = booking.depositPaid && booking.remainingPaid
    ? 'Pago completo'
    : booking.depositPaid
      ? 'Pago parcial'
      : 'Pago pendiente';

  const description = [
    `Reserva: ${booking.reference}`,
    `Cliente: ${booking.clientName}`,
    `Email: ${booking.clientEmail}`,
    `Tel: ${booking.clientPhone}`,
    `Estado CRM: ${booking.status}`,
    `Total: ${booking.total.toLocaleString('es-ES')}€`,
    `Cobro: ${paymentStatus}`,
    booking.notes ? `Notas: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const start = parseTime(booking.eventDate, booking.eventStartTime);
  const end = parseTime(booking.eventDate, booking.eventEndTime);

  if (start && end) {
    const safeEnd = new Date(end);
    if (safeEnd.getTime() <= start.getTime()) {
      safeEnd.setDate(safeEnd.getDate() + 1);
    }
    return {
      summary: title,
      location,
      description,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: safeEnd.toISOString(),
        timeZone: 'Europe/Madrid',
      },
    };
  }

  const dayStart = new Date(booking.eventDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return {
    summary: title,
    location,
    description,
    start: { date: getDateOnly(dayStart) },
    end: { date: getDateOnly(dayEnd) },
  };
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client no configurado');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Google token refresh failed (${tokenRes.status}): ${text}`);
  }

  const tokenData = await tokenRes.json().catch(() => ({} as Record<string, unknown>));
  const accessToken = typeof tokenData.access_token === 'string' ? tokenData.access_token : null;
  if (!accessToken) throw new Error('Google no devolvió access token');
  return accessToken;
}

async function googleCalendarFetch(
  method: 'POST' | 'PATCH' | 'DELETE',
  calendarId: string,
  path: string,
  accessToken: string,
  body?: Record<string, unknown>
) {
  return fetch(`${GOOGLE_CAL_API}/calendars/${encodeURIComponent(calendarId)}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function desiredActionForStatus(status: string): SyncAction | null {
  if (status === 'CANCELLED') return 'delete';
  if (['CONFIRMED', 'PREPARING', 'COMPLETED'].includes(status)) return 'upsert';
  return null;
}

export async function syncBookingToGoogleCalendar(
  bookingId: string,
  forcedAction?: SyncAction
): Promise<CalendarSyncResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      reference: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      eventType: true,
      eventDate: true,
      eventStartTime: true,
      eventEndTime: true,
      eventLocation: true,
      eventVenue: true,
      notes: true,
      status: true,
      total: true,
      depositPaid: true,
      remainingPaid: true,
    },
  });

  if (!booking) {
    return {
      ok: false,
      status: 'error',
      bookingId,
      error: 'Reserva no encontrada',
    };
  }

  const action = forcedAction || desiredActionForStatus(booking.status);
  if (!action) {
    return {
      ok: true,
      status: 'skipped',
      bookingId,
      reason: `Estado ${booking.status} no sincronizable`,
    };
  }

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [REFRESH_TOKEN_KEY, CALENDAR_ID_KEY, eventSettingKey(bookingId)],
      },
    },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const refreshToken = map[REFRESH_TOKEN_KEY];
  const calendarId = map[CALENDAR_ID_KEY] || process.env.GOOGLE_CALENDAR_ID || 'primary';
  const previousEventId = map[eventSettingKey(bookingId)] || null;

  if (!refreshToken) {
    return {
      ok: true,
      status: 'skipped',
      action,
      bookingId,
      reason: 'Google Calendar no conectado',
    };
  }

  try {
    const accessToken = await getAccessToken(refreshToken);

    if (action === 'delete') {
      if (previousEventId) {
        const delRes = await googleCalendarFetch(
          'DELETE',
          calendarId,
          `events/${encodeURIComponent(previousEventId)}`,
          accessToken
        );
        if (!delRes.ok && delRes.status !== 404) {
          const text = await delRes.text();
          throw new Error(`Google Calendar delete failed (${delRes.status}): ${text}`);
        }
      }
      await deleteSetting(eventSettingKey(bookingId));
      await prisma.adminLog.create({
        data: {
          action: 'CALENDAR_SYNC',
          entity: 'booking',
          entityId: bookingId,
          details: {
            status: 'deleted',
            calendarId,
            eventId: previousEventId,
          },
        },
      });
      return {
        ok: true,
        status: 'deleted',
        action,
        bookingId,
        eventId: previousEventId,
      };
    }

    const payload = buildEventPayload(booking);
    let eventId = previousEventId;
    let response: Response;
    if (eventId) {
      response = await googleCalendarFetch(
        'PATCH',
        calendarId,
        `events/${encodeURIComponent(eventId)}`,
        accessToken,
        payload
      );
      if (response.status === 404) {
        response = await googleCalendarFetch('POST', calendarId, 'events', accessToken, payload);
      }
    } else {
      response = await googleCalendarFetch('POST', calendarId, 'events', accessToken, payload);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Calendar upsert failed (${response.status}): ${text}`);
    }

    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    eventId = typeof data.id === 'string' ? data.id : eventId;
    if (eventId) {
      await upsertSetting(
        eventSettingKey(bookingId),
        eventId,
        `Google Calendar event id for booking ${booking.reference}`
      );
    }

    await prisma.adminLog.create({
      data: {
        action: 'CALENDAR_SYNC',
        entity: 'booking',
        entityId: bookingId,
        details: {
          status: 'synced',
          calendarId,
          eventId,
          bookingStatus: booking.status,
        },
      },
    });

    return {
      ok: true,
      status: 'synced',
      action,
      bookingId,
      eventId: eventId || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error sincronizando Google Calendar';
    log.error('Google calendar sync failed', error, { context: { bookingId, action } });
    await prisma.adminLog.create({
      data: {
        action: 'CALENDAR_SYNC_ERROR',
        entity: 'booking',
        entityId: bookingId,
        details: {
          action,
          error: message,
        },
      },
    }).catch(() => null);
    return {
      ok: false,
      status: 'error',
      action,
      bookingId,
      error: message,
    };
  }
}
