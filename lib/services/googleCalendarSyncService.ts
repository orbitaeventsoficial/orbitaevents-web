import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { formatCurrency } from '@/lib/constants';
import { getPaymentBand } from '@/lib/payment-status';
import {
  GOOGLE_CALENDAR_BOOKING_REMINDERS,
  GOOGLE_CALENDAR_BOOKING_REMINDER_SUMMARY,
  GOOGLE_CALENDAR_EVENT_KEY_PREFIXES,
  GOOGLE_CALENDAR_SETTING_KEYS,
  GOOGLE_CALENDAR_SOCIAL_POST_REMINDERS,
  GOOGLE_CALENDAR_SOCIAL_POST_REMINDER_SUMMARY,
} from '@/lib/constants/googleCalendar';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CAL_API = 'https://www.googleapis.com/calendar/v3';
const REFRESH_TOKEN_KEY = GOOGLE_CALENDAR_SETTING_KEYS.refreshToken;
const CALENDAR_ID_KEY = GOOGLE_CALENDAR_SETTING_KEYS.calendarId;
const EVENT_KEY_PREFIX = GOOGLE_CALENDAR_EVENT_KEY_PREFIXES.booking;
const SOCIAL_EVENT_KEY_PREFIX = GOOGLE_CALENDAR_EVENT_KEY_PREFIXES.socialPost;
const LEAD_EVENT_KEY_PREFIX = GOOGLE_CALENDAR_EVENT_KEY_PREFIXES.lead;
const TASK_EVENT_KEY_PREFIX = GOOGLE_CALENDAR_EVENT_KEY_PREFIXES.task;
const AVAILABILITY_EVENT_KEY_PREFIX = GOOGLE_CALENDAR_EVENT_KEY_PREFIXES.availability;

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
  cashAmount: number | null;
  depositPaid: boolean;
  remainingPaid: boolean;
};

type CalendarEventPayload = Record<string, unknown>;

type ReconcileEvent = {
  entity: 'booking' | 'lead' | 'task' | 'availability' | 'socialPost';
  entityId: string;
  settingKey: string;
  settingLabel: string;
  payload: CalendarEventPayload;
};

export type GoogleCalendarReconcileSummary = {
  connected: boolean;
  desired: number;
  synced: number;
  deleted: number;
  failed: number;
  skipped: number;
};

function eventSettingKey(bookingId: string): string {
  return `${EVENT_KEY_PREFIX}${bookingId}`;
}

function socialEventSettingKey(postId: string): string {
  return `${SOCIAL_EVENT_KEY_PREFIX}${postId}`;
}

function leadEventSettingKey(leadId: string): string {
  return `${LEAD_EVENT_KEY_PREFIX}${leadId}`;
}

function taskEventSettingKey(taskId: string): string {
  return `${TASK_EVENT_KEY_PREFIX}${taskId}`;
}

function availabilityEventSettingKey(availabilityId: string): string {
  return `${AVAILABILITY_EVENT_KEY_PREFIX}${availabilityId}`;
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
  const paymentBand = getPaymentBand(booking.depositPaid, booking.remainingPaid, {
    cashAmount: booking.cashAmount,
    total: booking.total,
  });
  const paymentStatus = paymentBand === 'paid'
    ? 'Pagament complet'
    : paymentBand === 'partial'
      ? 'Pagament parcial'
      : 'Pagament pendent';

  const description = [
    `Reserva: ${booking.reference}`,
    `Cliente: ${booking.clientName}`,
    `Email: ${booking.clientEmail}`,
    `Tel: ${booking.clientPhone}`,
    `Estat CRM: ${booking.status}`,
    `Total: ${formatCurrency(booking.total)}`,
    `Cobrament: ${paymentStatus}`,
    `Alarmes: ${GOOGLE_CALENDAR_BOOKING_REMINDER_SUMMARY}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const start = parseTime(booking.eventDate, booking.eventStartTime);
  const end = parseTime(booking.eventDate, booking.eventEndTime);

  const reminders = {
    useDefault: false,
    overrides: [...GOOGLE_CALENDAR_BOOKING_REMINDERS],
  };

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
      reminders,
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
    reminders,
  };
}

function buildTimedOrAllDayPayload(input: {
  summary: string;
  description: string;
  date: Date;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
}): CalendarEventPayload {
  const start = parseTime(input.date, input.startTime || null);
  const end = parseTime(input.date, input.endTime || null);

  if (start) {
    const safeEnd = end ? new Date(end) : new Date(start.getTime() + 60 * 60 * 1000);
    if (safeEnd.getTime() <= start.getTime()) safeEnd.setDate(safeEnd.getDate() + 1);
    return {
      summary: input.summary,
      description: input.description,
      location: input.location || undefined,
      start: { dateTime: start.toISOString(), timeZone: 'Europe/Madrid' },
      end: { dateTime: safeEnd.toISOString(), timeZone: 'Europe/Madrid' },
    };
  }

  const dayStart = new Date(input.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return {
    summary: input.summary,
    description: input.description,
    location: input.location || undefined,
    start: { date: getDateOnly(dayStart) },
    end: { date: getDateOnly(dayEnd) },
  };
}

function isCalendarEventSetting(key: string): boolean {
  return Object.values(GOOGLE_CALENDAR_EVENT_KEY_PREFIXES).some((prefix) => key.startsWith(prefix));
}


function buildSocialPostPayload(post: {
  title: string;
  platforms: string[];
  contentType: string;
  status: string;
  scheduledAt: Date | null;
  notes: string | null;
}) {
  if (!post.scheduledAt) throw new Error('Social post sense scheduledAt');

  const start = new Date(post.scheduledAt);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const description = [
    `Publicació social: ${post.title}`,
    `Plataformes: ${post.platforms.join(', ')}`,
    `Tipus: ${post.contentType}`,
    `Estat: ${post.status}`,
    `Alarmes: ${GOOGLE_CALENDAR_SOCIAL_POST_REMINDER_SUMMARY}`,
    post.notes ? `Notes: ${post.notes}` : null,
  ].filter(Boolean).join('\n');

  return {
    summary: `Publicar · ${post.platforms.join('/')} · ${post.title}`,
    description,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'Europe/Madrid',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'Europe/Madrid',
    },
    reminders: {
      useDefault: false,
      overrides: GOOGLE_CALENDAR_SOCIAL_POST_REMINDERS,
    },
  };
}
async function getAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client no configurat');
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
  if (!accessToken) throw new Error('Google no ha retornat access token');
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
  if (['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED'].includes(status)) return 'upsert';
  return null;
}

async function upsertReconcileEvent(input: {
  event: ReconcileEvent;
  previousEventId: string | null;
  calendarId: string;
  accessToken: string;
}): Promise<string | null> {
  const { event, previousEventId, calendarId, accessToken } = input;
  let response: Response;
  if (previousEventId) {
    response = await googleCalendarFetch(
      'PATCH',
      calendarId,
      `events/${encodeURIComponent(previousEventId)}`,
      accessToken,
      event.payload
    );
    if (response.status === 404) {
      response = await googleCalendarFetch('POST', calendarId, 'events', accessToken, event.payload);
    }
  } else {
    response = await googleCalendarFetch('POST', calendarId, 'events', accessToken, event.payload);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar reconcile upsert failed (${response.status}): ${text}`);
  }

  const data = await response.json().catch(() => ({} as Record<string, unknown>));
  const eventId = typeof data.id === 'string' ? data.id : previousEventId;
  if (eventId) await upsertSetting(event.settingKey, eventId, event.settingLabel);
  return eventId;
}

export async function reconcileGoogleCalendar(): Promise<GoogleCalendarReconcileSummary> {
  const summary: GoogleCalendarReconcileSummary = {
    connected: false,
    desired: 0,
    synced: 0,
    deleted: 0,
    failed: 0,
    skipped: 0,
  };

  const [settings, bookings, leads, tasks, availabilities, socialPosts] = await Promise.all([
    prisma.setting.findMany({
      where: {
        OR: [
          { key: { in: [REFRESH_TOKEN_KEY, CALENDAR_ID_KEY] } },
          ...Object.values(GOOGLE_CALENDAR_EVENT_KEY_PREFIXES).map((prefix) => ({ key: { startsWith: prefix } })),
        ],
      },
      select: { key: true, value: true },
    }),
    prisma.booking.findMany({
      where: { status: { not: 'CANCELLED' } },
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
        cashAmount: true,
        depositPaid: true,
        remainingPaid: true,
      },
    }),
    prisma.lead.findMany({
      where: { eventDate: { not: null }, status: { not: 'LOST' }, booking: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        eventType: true,
        eventDate: true,
        eventStartTime: true,
        eventEndTime: true,
        eventLocation: true,
        status: true,
        priority: true,
      },
    }),
    prisma.task.findMany({
      where: { dueDate: { not: null }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      select: { id: true, title: true, description: true, dueDate: true, status: true, priority: true },
    }),
    prisma.availability.findMany({
      where: { status: 'BLOCKED' },
      select: { id: true, date: true, note: true },
    }),
    prisma.socialPost.findMany({
      where: { scheduledAt: { not: null }, status: { in: ['DRAFT', 'SCHEDULED'] } },
      select: {
        id: true,
        title: true,
        platforms: true,
        contentType: true,
        status: true,
        scheduledAt: true,
        notes: true,
      },
    }),
  ]);

  const settingsMap = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const refreshToken = settingsMap[REFRESH_TOKEN_KEY];
  summary.desired = bookings.length + leads.length + tasks.length + availabilities.length + socialPosts.length;
  if (!refreshToken) {
    summary.skipped = summary.desired;
    return summary;
  }

  summary.connected = true;
  const calendarId = settingsMap[CALENDAR_ID_KEY] || process.env.GOOGLE_CALENDAR_ID || 'primary';
  const accessToken = await getAccessToken(refreshToken);
  const desiredEvents: ReconcileEvent[] = [
    ...bookings.map((booking) => ({
      entity: 'booking' as const,
      entityId: booking.id,
      settingKey: eventSettingKey(booking.id),
      settingLabel: `Google Calendar event id for booking ${booking.reference}`,
      payload: buildEventPayload(booking),
    })),
    ...leads.map((lead) => ({
      entity: 'lead' as const,
      entityId: lead.id,
      settingKey: leadEventSettingKey(lead.id),
      settingLabel: `Google Calendar event id for lead ${lead.name}`,
      payload: buildTimedOrAllDayPayload({
        summary: `Lead · ${lead.name} · ${lead.eventType}`,
        description: [
          `Lead: ${lead.name}`,
          `Email: ${lead.email}`,
          lead.phone ? `Tel: ${lead.phone}` : null,
          `Estat CRM: ${lead.status}`,
          `Prioritat: ${lead.priority}`,
        ].filter(Boolean).join('\n'),
        date: lead.eventDate!,
        startTime: lead.eventStartTime,
        endTime: lead.eventEndTime,
        location: lead.eventLocation,
      }),
    })),
    ...tasks.map((task) => ({
      entity: 'task' as const,
      entityId: task.id,
      settingKey: taskEventSettingKey(task.id),
      settingLabel: `Google Calendar event id for task ${task.title}`,
      payload: buildTimedOrAllDayPayload({
        summary: `Tasca · ${task.title}`,
        description: [
          `Estat: ${task.status}`,
          `Prioritat: ${task.priority}`,
          task.description || null,
        ].filter(Boolean).join('\n'),
        date: task.dueDate!,
      }),
    })),
    ...availabilities.map((availability) => ({
      entity: 'availability' as const,
      entityId: availability.id,
      settingKey: availabilityEventSettingKey(availability.id),
      settingLabel: 'Google Calendar event id for blocked availability',
      payload: buildTimedOrAllDayPayload({
        summary: 'Dia bloquejat',
        description: availability.note || 'Disponibilitat bloquejada des de l’admin',
        date: availability.date,
      }),
    })),
    ...socialPosts.map((post) => ({
      entity: 'socialPost' as const,
      entityId: post.id,
      settingKey: socialEventSettingKey(post.id),
      settingLabel: `Google Calendar event id for social post ${post.title}`,
      payload: buildSocialPostPayload(post),
    })),
  ];
  const desiredSettingKeys = new Set(desiredEvents.map((event) => event.settingKey));

  for (const event of desiredEvents) {
    try {
      await upsertReconcileEvent({
        event,
        previousEventId: settingsMap[event.settingKey] || null,
        calendarId,
        accessToken,
      });
      summary.synced += 1;
    } catch (error) {
      summary.failed += 1;
      log.error('Google calendar reconcile event failed', error, {
        context: { entity: event.entity, entityId: event.entityId },
      });
    }
  }

  const staleMappings = settings.filter(
    (setting) => isCalendarEventSetting(setting.key) && !desiredSettingKeys.has(setting.key)
  );
  for (const setting of staleMappings) {
    try {
      const response = await googleCalendarFetch(
        'DELETE',
        calendarId,
        `events/${encodeURIComponent(setting.value)}`,
        accessToken
      );
      if (!response.ok && response.status !== 404) {
        const text = await response.text();
        throw new Error(`Google Calendar reconcile delete failed (${response.status}): ${text}`);
      }
      await deleteSetting(setting.key);
      summary.deleted += 1;
    } catch (error) {
      summary.failed += 1;
      log.error('Google calendar reconcile stale event failed', error, {
        context: { settingKey: setting.key },
      });
    }
  }

  await prisma.adminLog.create({
    data: {
      action: 'CALENDAR_RECONCILE',
      entity: 'system',
      details: summary,
    },
  });
  return summary;
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
      cashAmount: true,
      depositPaid: true,
      remainingPaid: true,
    },
  });

  if (!booking) {
    return {
      ok: false,
      status: 'error',
      bookingId,
      error: 'Reserva no trobada',
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
export async function syncSocialPostToGoogleCalendar(
  postId: string,
  forcedAction?: SyncAction
): Promise<CalendarSyncResult> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      platforms: true,
      contentType: true,
      status: true,
      scheduledAt: true,
      notes: true,
    },
  });

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [REFRESH_TOKEN_KEY, CALENDAR_ID_KEY, socialEventSettingKey(postId)],
      },
    },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const refreshToken = map[REFRESH_TOKEN_KEY];
  const calendarId = map[CALENDAR_ID_KEY] || process.env.GOOGLE_CALENDAR_ID || 'primary';
  const previousEventId = map[socialEventSettingKey(postId)] || null;

  const action: SyncAction | null = forcedAction || (post && post.scheduledAt && ['DRAFT', 'SCHEDULED'].includes(post.status) ? 'upsert' : previousEventId ? 'delete' : null);

  if (!action) {
    return { ok: true, status: 'skipped', bookingId: postId, reason: 'Social post sense alarma sincronitzable' };
  }

  if (!refreshToken) {
    return { ok: true, status: 'skipped', action, bookingId: postId, reason: 'Google Calendar no conectado' };
  }

  try {
    const accessToken = await getAccessToken(refreshToken);

    if (action === 'delete') {
      if (previousEventId) {
        const delRes = await googleCalendarFetch('DELETE', calendarId, `events/${encodeURIComponent(previousEventId)}`, accessToken);
        if (!delRes.ok && delRes.status !== 404) {
          const text = await delRes.text();
          throw new Error(`Google Calendar social delete failed (${delRes.status}): ${text}`);
        }
      }
      await deleteSetting(socialEventSettingKey(postId));
      await prisma.adminLog.create({
        data: {
          action: 'CALENDAR_SYNC',
          entity: 'socialPost',
          entityId: postId,
          details: { status: 'deleted', calendarId, eventId: previousEventId },
        },
      });
      return { ok: true, status: 'deleted', action, bookingId: postId, eventId: previousEventId };
    }

    if (!post) {
      return { ok: false, status: 'error', action, bookingId: postId, error: 'Social post no trobat' };
    }

    const payload = buildSocialPostPayload(post);
    let eventId = previousEventId;
    let response: Response;
    if (eventId) {
      response = await googleCalendarFetch('PATCH', calendarId, `events/${encodeURIComponent(eventId)}`, accessToken, payload);
      if (response.status === 404) response = await googleCalendarFetch('POST', calendarId, 'events', accessToken, payload);
    } else {
      response = await googleCalendarFetch('POST', calendarId, 'events', accessToken, payload);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Calendar social upsert failed (${response.status}): ${text}`);
    }

    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    eventId = typeof data.id === 'string' ? data.id : eventId;
    if (eventId) {
      await upsertSetting(socialEventSettingKey(postId), eventId, `Google Calendar event id for social post ${post.title}`);
    }

    await prisma.adminLog.create({
      data: {
        action: 'CALENDAR_SYNC',
        entity: 'socialPost',
        entityId: postId,
        details: { status: 'synced', calendarId, eventId, socialStatus: post.status },
      },
    });

    return { ok: true, status: 'synced', action, bookingId: postId, eventId: eventId || null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error sincronizando Google Calendar social';
    log.error('Google calendar social sync failed', error, { context: { postId, action } });
    await prisma.adminLog.create({
      data: {
        action: 'CALENDAR_SYNC_ERROR',
        entity: 'socialPost',
        entityId: postId,
        details: { action, error: message },
      },
    }).catch(() => null);
    return { ok: false, status: 'error', action, bookingId: postId, error: message };
  }
}
