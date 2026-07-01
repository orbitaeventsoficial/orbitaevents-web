'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type WizardProps = {
  gmailConnected: boolean;
  imapConfigured: boolean;
  googleCalendarConnected: boolean;
  calendarIdConfigured: boolean;
  icsFeedConfigured: boolean;
  cronActive: boolean;
  connectedEmail: string;
  missingImapVars: string[];
};

type Step = 1 | 2 | 3;

const STEP_ACTIVE = 'rounded-full border px-3 py-1 text-xs font-semibold admin-tone-soft-info admin-tone-border-info admin-tone-text-info';
const STEP_IDLE = 'rounded-full border px-3 py-1 text-xs font-semibold admin-tone-idle';
const LINK_BUTTON = 'ap-btn ap-btn--secondary text-xs';

export default function IntegrationSetupWizard({
  gmailConnected,
  imapConfigured,
  googleCalendarConnected,
  calendarIdConfigured,
  icsFeedConfigured,
  cronActive,
  connectedEmail,
  missingImapVars,
}: WizardProps) {
  const [step, setStep] = useState<Step>(1);

  const status = useMemo(
    () => ({
      emailReady: gmailConnected || imapConfigured,
      calendarReady: googleCalendarConnected && calendarIdConfigured,
      icsReady: icsFeedConfigured,
    }),
    [gmailConnected, imapConfigured, googleCalendarConnected, calendarIdConfigured, icsFeedConfigured]
  );

  return (
    <section className="ap-card p-5 admin-card-glass">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="ap-h2">Configuració ràpida d&apos;integracions</h2>
          <p className="text-xs">3 passos per deixar email + calendari + feed operatius.</p>
        </div>
        <div className="text-xs">Estat global: {status.emailReady && status.calendarReady ? 'Operatiu' : 'Pendent'}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" onClick={() => setStep(n as Step)} className={step === n ? STEP_ACTIVE : STEP_IDLE}>
            Pas {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-4 ap-card p-4 text-sm">
          <p className="font-semibold">1. Email (Gmail o IMAP)</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>Gmail OAuth: {gmailConnected ? `Connectat (${connectedEmail || 'compte detectat'})` : 'Pendent (falta refresh token)'}</li>
            <li>IMAP: {imapConfigured ? 'Configurat' : `Falten variables: ${missingImapVars.join(', ') || 'IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS'}`}</li>
            <li>Scopes recomanats Gmail: `gmail.readonly`, `gmail.modify`</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/gmail/oauth/start" className={LINK_BUTTON}>Connectar Gmail</a>
            <Link href="/admin/inbox/settings" className={LINK_BUTTON}>Configurar IMAP</Link>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 ap-card p-4 text-sm">
          <p className="font-semibold">2. Sincronització de calendari</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>OAuth Calendar: {googleCalendarConnected ? 'Connectat' : 'Pendent (falta refresh token)'}</li>
            <li>Calendar ID: {calendarIdConfigured ? 'Configurat' : 'Pendent (falta `integrations.googleCalendar.calendarId` o env)'}</li>
            <li>Cron operatiu: {cronActive ? 'Actiu' : 'Pendent (últim estat no OK)'}</li>
            <li>Scope recomanat: `https://www.googleapis.com/auth/calendar.events`</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/google-calendar/oauth/start" className={LINK_BUTTON}>Connectar Calendar</a>
            <Link href="/admin/emails" className={LINK_BUTTON}>Revisar cron/email</Link>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 ap-card p-4 text-sm">
          <p className="font-semibold">3. Feed ICS (opcional)</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>Token ICS: {icsFeedConfigured ? 'Generat' : 'Pendent'}</li>
            <li>Quan estigui actiu, pots subscriure&apos;t des de Google Calendar / iPhone.</li>
          </ul>
          <div className="mt-3">
            <button type="button" onClick={() => setStep(1)} className={LINK_BUTTON}>Tornar al pas 1</button>
          </div>
        </div>
      )}
    </section>
  );
}
