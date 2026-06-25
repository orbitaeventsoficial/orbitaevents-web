import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import CalendarTokenManager from './CalendarTokenManager';
import IntegrationSetupWizard from './IntegrationSetupWizard';
import { formatDateTimeFull } from '@/lib/constants';
import { AdminPage } from '../../components/AdminPage';
import { EditorControlStrip } from '../../components/EditorControlStrip';
import { getAppBaseUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

function BoolBadge({ ok }: { ok: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? 'admin-tone-soft-success admin-tone-text-success' : 'admin-tone-soft-warning admin-tone-text-warning'}`}>
      {ok ? 'Connectat' : 'Pendent'}
    </span>
  );
}

const LINK_BUTTON = 'ap-btn ap-btn--secondary';
const CARD = 'rounded-2xl border p-5 admin-card-glass';

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
          'integrations.googleAds.refreshToken',
          'integrations.googleAds.connectedAt',
          'emails.cron.lastStatus',
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
  const missingImapVars = [
    !process.env.IMAP_HOST ? 'IMAP_HOST' : null,
    !process.env.IMAP_PORT ? 'IMAP_PORT' : null,
    !process.env.IMAP_USER ? 'IMAP_USER' : null,
    !process.env.IMAP_PASS ? 'IMAP_PASS' : null,
  ].filter(Boolean) as string[];
  const imapConfigured = missingImapVars.length === 0;
  const calendarFeedToken = map['integrations.calendar.feedToken'];
  const googleCalendarConnected = Boolean(map['integrations.googleCalendar.refreshToken']);
  const calendarIdConfigured = Boolean(map['integrations.googleCalendar.calendarId'] || process.env.GOOGLE_CALENDAR_ID);
  const cronActive = String(map['emails.cron.lastStatus'] || '').toUpperCase() === 'OK';
  const connectedCount = [
    Boolean(map['integrations.google.refreshToken']),
    Boolean(map['integrations.googleAds.refreshToken']),
    Boolean(map['integrations.gmail.refreshToken']),
    imapConfigured,
    googleCalendarConnected,
    Boolean(calendarFeedToken),
  ].filter(Boolean).length;
  const weakestLink = !Boolean(map['integrations.gmail.refreshToken'])
    ? 'Gmail'
    : !imapConfigured
      ? 'IMAP'
      : !googleCalendarConnected
        ? 'Google Calendar'
        : !Boolean(map['integrations.googleAds.refreshToken'])
          ? 'Google Ads'
          : !Boolean(map['integrations.google.refreshToken'])
            ? 'Google Business'
            : !calendarFeedToken
              ? 'ICS'
              : null;

  return (
    <AdminPage
      title="Centre d'integracions"
      subtitle="Sincronitza CRM, emails i calendari amb Google i mòbil."
      back={{ href: '/admin/settings', label: 'Configuració' }}
    >
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: 'Què tens connectat ara mateix',
          stats: [
            { label: 'Integracions', value: connectedCount, hint: 'actives' },
            { label: 'IMAP', value: imapConfigured ? 'OK' : 'Pendent', tone: imapConfigured ? 'success' : 'warning' },
            { label: 'Cron', value: cronActive ? 'OK' : 'Pendent', tone: cronActive ? 'success' : 'warning' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de tocar res',
          items: [
            weakestLink ? `${weakestLink} és ara mateix el punt més feble de la cadena d’integracions.` : 'Les integracions principals estan cobertes.',
            imapConfigured ? 'La safata IMAP té les variables mínimes presents.' : `Falten variables IMAP: ${missingImapVars.join(', ')}.`,
            googleCalendarConnected
              ? `Google Calendar està connectat${calendarIdConfigured ? ' i té calendari objectiu disponible.' : ', però encara falta calendarId.'}`
              : 'Google Calendar encara no està connectat.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: weakestLink ? `Regularitzar ${weakestLink} abans d’afegir més capes` : 'Mantenir les connexions i validar el recorregut complet',
          description: weakestLink
            ? 'El millor retorn aquí no és obrir totes les integracions alhora, sinó arreglar el primer punt dèbil de la cadena perquè CRM, calendari i notificacions tornin a parlar entre ells.'
            : 'Si la base ja és estable, el següent pas és validar que els automatismes i els recorreguts reals continuen funcionant de punta a punta.',
          primaryAction: {
            href: !imapConfigured ? '/admin/inbox/settings' : '/admin/settings/integrations',
            label: !imapConfigured ? 'Configurar IMAP' : 'Revisar integracions',
          },
          secondaryAction: { href: '/admin/settings', label: 'Tornar a configuració' },
          secondaryPills: [
            googleCalendarConnected ? 'Calendar connectat' : 'Calendar pendent',
            calendarFeedToken ? 'ICS actiu' : 'ICS pendent',
          ],
        }}
      />

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
        <article className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Google Business</h2>
            <BoolBadge ok={Boolean(map['integrations.google.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm">Connexió per dades de Google Reviews i ecosistema Google.</p>
          <a href="/api/google/oauth/start" className={`mt-4 inline-flex ${LINK_BUTTON}`}>Connectar Google</a>
        </article>

        <article className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Google Ads (OAuth)</h2>
            <BoolBadge ok={Boolean(map['integrations.googleAds.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm">Connexió OAuth per carregar dades de campanyes i conversions a Analítica.</p>
          <p className="mt-1 text-xs">Connectat: {map['integrations.googleAds.connectedAt'] ? formatDateTimeFull(map['integrations.googleAds.connectedAt']) : '-'}</p>
          <a href="/api/google-ads/oauth/start" className={`mt-4 inline-flex ${LINK_BUTTON}`}>
            {map['integrations.googleAds.refreshToken'] ? 'Reconnectar Google Ads' : 'Connectar Google Ads'}
          </a>
        </article>

        <article className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Gmail (OAuth)</h2>
            <BoolBadge ok={Boolean(map['integrations.gmail.refreshToken'])} />
          </div>
          <p className="mt-2 text-sm">Lectura i operativa de bústia Gmail des de l&apos;admin.</p>
          <p className="mt-1 text-xs">Compte: {map['integrations.gmail.email'] || '-'}</p>
          <a href="/api/gmail/oauth/start" className={`mt-4 inline-flex ${LINK_BUTTON}`}>Connectar Gmail</a>
        </article>

        <article className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Safata IMAP</h2>
            <BoolBadge ok={imapConfigured} />
          </div>
          <p className="mt-2 text-sm">Captura i importació d&apos;emails a leads CRM.</p>
          {!imapConfigured && <p className="mt-1 text-xs">Falten: {missingImapVars.join(', ')}</p>}
          <Link href="/admin/inbox/settings" className={`mt-4 inline-flex ${LINK_BUTTON}`}>Configurar IMAP</Link>
        </article>

        <article className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Sincronització Google Calendar</h2>
            <BoolBadge ok={googleCalendarConnected} />
          </div>
          <p className="mt-2 text-sm">Mirall automàtic complet cada 15 minuts: reserves, leads amb data, tasques obertes, dies bloquejats i publicacions socials. La primera connexió omple el calendari immediatament.</p>
          <p className="mt-1 text-xs">
            Calendari: {map['integrations.googleCalendar.calendarId'] || process.env.GOOGLE_CALENDAR_ID || 'primary'} · Compte: {map['integrations.googleCalendar.connectedEmail'] || '-'}
          </p>
          {!calendarIdConfigured && <p className="mt-1 text-xs">Falta calendarId (setting `integrations.googleCalendar.calendarId` o env `GOOGLE_CALENDAR_ID`)</p>}
          <a href="/api/google-calendar/oauth/start" className={`mt-4 inline-flex ${LINK_BUTTON}`}>
            {googleCalendarConnected ? 'Reconnectar Google Calendar' : 'Connectar Google Calendar'}
          </a>
        </article>

        <article className={CARD}>
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Feed de calendari (ICS)</h2>
            <BoolBadge ok={Boolean(calendarFeedToken)} />
          </div>
          <p className="mt-2 text-sm">Subscripció del calendari de reserves a Google Calendar, iPhone o Android.</p>
          <CalendarTokenManager baseUrl={baseUrl} initialToken={calendarFeedToken || null} />
        </article>
      </section>

      <section className={CARD}>
        <h2 className="ap-h2">Checklist tècnic</h2>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <p>• Gmail token: {map['integrations.gmail.refreshToken'] ? 'OK' : 'Pendent'}</p>
          <p>• Google token: {map['integrations.google.refreshToken'] ? 'OK' : 'Pendent'}</p>
          <p>• Google Ads token: {map['integrations.googleAds.refreshToken'] ? 'OK' : 'Pendent'}</p>
          <p>• Calendar token: {googleCalendarConnected ? 'OK' : 'Pendent'}</p>
          <p>• Calendar ID: {calendarIdConfigured ? 'OK' : 'Pendent'}</p>
          <p>• ICS token: {calendarFeedToken ? 'OK' : 'Pendent'}</p>
          <p>• Cron estat: {map['emails.cron.lastStatus'] || 'Pendent'}</p>
        </div>
      </section>
    </AdminPage>
  );
}
