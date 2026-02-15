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

  const status = useMemo(() => ({
    emailReady: gmailConnected || imapConfigured,
    calendarReady: googleCalendarConnected && calendarIdConfigured,
    icsReady: icsFeedConfigured,
  }), [gmailConnected, imapConfigured, googleCalendarConnected, calendarIdConfigured, icsFeedConfigured]);

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-cyan-100">Setup ràpid d&apos;integracions</h2>
          <p className="text-xs text-cyan-100/80">3 passos per deixar email + calendari + feed operatius.</p>
        </div>
        <div className="text-xs text-cyan-100/90">
          Estat global: {status.emailReady && status.calendarReady ? 'Operatiu' : 'Pendent'}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n as Step)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              step === n
                ? 'border-cyan-300/70 bg-cyan-200/20 text-cyan-100'
                : 'border-cyan-300/30 bg-cyan-200/5 text-cyan-100/80'
            }`}
          >
            Pas {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-4 rounded-xl border border-cyan-300/30 bg-slate-950/40 p-4 text-sm text-slate-200">
          <p className="font-semibold text-cyan-100">1. Email (Gmail o IMAP)</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            <li>Gmail OAuth: {gmailConnected ? `Connectat (${connectedEmail || 'compte detectat'})` : 'Pendent (falta refresh token)'}</li>
            <li>IMAP: {imapConfigured ? 'Configurat' : `Falten variables: ${missingImapVars.join(', ') || 'IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS'}`}</li>
            <li>Scopes recomanats Gmail: `gmail.readonly`, `gmail.send`</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/gmail/oauth/start" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5">Connectar Gmail</a>
            <Link href="/admin/inbox/settings" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5">Configurar IMAP</Link>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 rounded-xl border border-cyan-300/30 bg-slate-950/40 p-4 text-sm text-slate-200">
          <p className="font-semibold text-cyan-100">2. Calendar sync</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            <li>OAuth Calendar: {googleCalendarConnected ? 'Connectat' : 'Pendent (falta refresh token)'}</li>
            <li>Calendar ID: {calendarIdConfigured ? 'Configurat' : 'Pendent (falta `integrations.googleCalendar.calendarId` o env)'}</li>
            <li>Cron operatiu: {cronActive ? 'Actiu' : 'Pendent (últim estat no OK)'}</li>
            <li>Scope recomanat: `https://www.googleapis.com/auth/calendar.events`</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/google-calendar/oauth/start" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5">Connectar Calendar</a>
            <Link href="/admin/emails" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5">Revisar cron/email</Link>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 rounded-xl border border-cyan-300/30 bg-slate-950/40 p-4 text-sm text-slate-200">
          <p className="font-semibold text-cyan-100">3. ICS feed (opcional)</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            <li>Token ICS: {icsFeedConfigured ? 'Generat' : 'Pendent'}</li>
            <li>Quan estigui actiu, pots subscriure&apos;t des de Google Calendar / iPhone.</li>
          </ul>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
            >
              Tornar al pas 1
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
