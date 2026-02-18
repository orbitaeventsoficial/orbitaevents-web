import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import CalendarTokenManager from './CalendarTokenManager';
import IntegrationSetupWizard from './IntegrationSetupWizard';

export const dynamic = 'force-dynamic';

function BoolBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
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
          'emails.cron.lastStatus',
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com').replace(/\/+$/, '');
  const missingImapVars = [
    !process.env.IMAP_HOST ? 'IMAP_HOST' : null,
    !process.env.IMAP_PORT ? 'IMAP_PORT' : null,
    !process.env.IMAP_USER ? 'IMAP_USER' : null,
    !process.env.IMAP_PASS ? 'IMAP_PASS' : null,
  ].filter(Boolean) as string[];
  const imapConfigured = missingImapVars.length === 0;
  const calendarFeedToken = map['integrations.calendar.feedToken'];
  const googleCalendarConnected = Boolean(map['integrations.googleCalendar.refreshToken']);
  const calendarIdConfigured = Boolean(
    map['integrations.googleCalendar.calendarId'] || process.env.GOOGLE_CALENDAR_ID
  );
  const cronActive = String(map['emails.cron.lastStatus'] || '').toUpperCase() === 'OK';

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-100">Centre d&apos;integracions</h1>
        <p className="mt-1 text-sm text-slate-300">
          Sincronitza CRM, emails i calendari amb Google i mòbil.
        </p>
      </header>

      <IntegrationSetupWizard
        gmailConnected={Boolean(map['integrations.gmail.refreshToken'])}
        imapConfigured={imapConfigured}
        googleCalendarConnected={googleCalendarConnected}
        calendarIdConfigured={calendarIdConfigured}
        icsFeedConfigured={Boolean(calendarFeedToken)}
        cronActive={cronActive}
        connectedEmail={String(map['integrations.googleCalendar.connectedEmail'] || map['integrations.gmail.email'] || '')}
        missingImapVars={missingImapVars}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Google Business</h2>
            <BoolBadge ok={Boolean(map['integrations.google.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Connexió per dades de Google Reviews i ecosistema Google.
          </p>
          <a
            href="/api/google/oauth/start"
            className="mt-4 inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            Connectar Google
          </a>
        </article>

        <article className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Gmail (OAuth)</h2>
            <BoolBadge ok={Boolean(map['integrations.gmail.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Lectura i operativa de bústia Gmail des de l&apos;admin.
          </p>
          <p className="mt-1 text-xs text-slate-400">Compte: {map['integrations.gmail.email'] || '-'}</p>
          <a
            href="/api/gmail/oauth/start"
            className="mt-4 inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            Connectar Gmail
          </a>
        </article>

        <article className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Safata IMAP</h2>
            <BoolBadge ok={imapConfigured} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Captura i importació d&apos;emails a leads CRM.
          </p>
          {!imapConfigured && (
            <p className="mt-1 text-xs text-amber-300">
              Falten: {missingImapVars.join(', ')}
            </p>
          )}
          <Link
            href="/admin/inbox/settings"
            className="mt-4 inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            Configurar IMAP
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Sincronització Google Calendar</h2>
            <BoolBadge ok={googleCalendarConnected} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Sincronització automàtica de reserves confirmades/preparació i baixa automàtica en cancel·lar.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Calendari: {map['integrations.googleCalendar.calendarId'] || process.env.GOOGLE_CALENDAR_ID || 'primary'}
            {' '}· Compte: {map['integrations.googleCalendar.connectedEmail'] || '-'}
          </p>
          {!calendarIdConfigured && (
            <p className="mt-1 text-xs text-amber-300">
              Falta calendarId (setting `integrations.googleCalendar.calendarId` o env `GOOGLE_CALENDAR_ID`)
            </p>
          )}
          <a
            href="/api/google-calendar/oauth/start"
            className="mt-4 inline-flex rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            {googleCalendarConnected ? 'Reconnectar Google Calendar' : 'Connectar Google Calendar'}
          </a>
        </article>

        <article className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Feed de calendari (ICS)</h2>
            <BoolBadge ok={Boolean(calendarFeedToken)} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Subscripció del calendari de reserves a Google Calendar, iPhone o Android.
          </p>
          <CalendarTokenManager baseUrl={baseUrl} initialToken={calendarFeedToken || null} />
        </article>
      </section>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-100">Checklist tècnic</h2>
        <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
          <p>• Gmail token: {map['integrations.gmail.refreshToken'] ? 'OK' : 'Pendent'}</p>
          <p>• Google token: {map['integrations.google.refreshToken'] ? 'OK' : 'Pendent'}</p>
          <p>• Calendar token: {googleCalendarConnected ? 'OK' : 'Pendent'}</p>
          <p>• Calendar ID: {calendarIdConfigured ? 'OK' : 'Pendent'}</p>
          <p>• ICS token: {calendarFeedToken ? 'OK' : 'Pendent'}</p>
          <p>• Cron estat: {map['emails.cron.lastStatus'] || 'Pendent'}</p>
        </div>
      </section>
    </div>
  );
}
