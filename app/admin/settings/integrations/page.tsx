import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import CalendarTokenManager from './CalendarTokenManager';

export const dynamic = 'force-dynamic';

function BoolBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {ok ? 'Connectat' : 'Pendent'}
    </span>
  );
}

export default async function IntegrationsPage() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'integrations.google.refreshToken',
          'integrations.gmail.refreshToken',
          'integrations.gmail.email',
          'integrations.calendar.feedToken',
          'integrations.googleCalendar.refreshToken',
          'integrations.googleCalendar.connectedEmail',
          'integrations.googleCalendar.connectedAt',
          'integrations.googleCalendar.calendarId',
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com').replace(/\/+$/, '');
  const imapConfigured = Boolean(
    process.env.IMAP_HOST && process.env.IMAP_PORT && process.env.IMAP_USER && process.env.IMAP_PASS
  );
  const calendarFeedToken = map['integrations.calendar.feedToken'];
  const googleCalendarConnected = Boolean(map['integrations.googleCalendar.refreshToken']);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Centro de Integraciones</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sincroniza CRM, emails y calendario con Google y móvil.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Google Business</h2>
            <BoolBadge ok={Boolean(map['integrations.google.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Connexió per dades de Google Reviews i ecosistema Google.
          </p>
          <a
            href="/api/google/oauth/start"
            className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Connectar Google
          </a>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Gmail OAuth</h2>
            <BoolBadge ok={Boolean(map['integrations.gmail.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Lectura i operativa de bústia Gmail des de l&apos;admin.
          </p>
          <p className="mt-1 text-xs text-slate-500">Compte: {map['integrations.gmail.email'] || '-'}</p>
          <a
            href="/api/gmail/oauth/start"
            className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Connectar Gmail
          </a>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">IMAP Inbox</h2>
            <BoolBadge ok={imapConfigured} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Captura i importació d&apos;emails a leads CRM.
          </p>
          <Link
            href="/admin/inbox/settings"
            className="mt-4 inline-flex rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Configurar IMAP
          </Link>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Google Calendar Sync</h2>
            <BoolBadge ok={googleCalendarConnected} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Sincronización automática de reservas confirmadas/preparación y baja automática al cancelar.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Calendario: {map['integrations.googleCalendar.calendarId'] || 'primary'}
            {' '}· Cuenta: {map['integrations.googleCalendar.connectedEmail'] || '-'}
          </p>
          <a
            href="/api/google-calendar/oauth/start"
            className="mt-4 inline-flex rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {googleCalendarConnected ? 'Reconectar Google Calendar' : 'Conectar Google Calendar'}
          </a>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Calendar Feed (ICS)</h2>
            <BoolBadge ok={Boolean(calendarFeedToken)} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Subscripció del calendari de reserves a Google Calendar, iPhone o Android.
          </p>
          <CalendarTokenManager baseUrl={baseUrl} initialToken={calendarFeedToken || null} />
        </article>
      </section>
    </div>
  );
}
