// app/admin/emails/ManualActionsPanel.tsx
'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

const IDLE_BUTTON = 'w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors admin-tone-idle';
const DISABLED_BUTTON = 'w-full cursor-not-allowed rounded-xl border border-[var(--line)] bg-[var(--raised)] px-4 py-2.5 text-sm font-medium text-[var(--t3)]';
const PRIMARY_BUTTON = 'ap-btn ap-btn--primary';

function ResultMessage({ result }: { result: { ok: boolean; message: string } }) {
  return (
    <p
      className={`mt-2 text-xs ${result.ok ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}
      role={result.ok ? 'status' : 'alert'}
    >
      {result.message}
    </p>
  );
}

export default function ManualActionsPanel() {
  const [runningCron, setRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [runningReminder, setRunningReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function runCronManually() {
    setRunningCron(true);
    setCronResult(null);

    try {
      const res = await fetchWithCsrf('/api/admin/emails/run-cron', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setCronResult({
          ok: true,
          message: `✅ Executat! ${data.summary?.sent || 0} emails enviats, ${data.summary?.skipped || 0} omesos`,
        });
      } else {
        setCronResult({
          ok: false,
          message: `❌ Error: ${data.error || 'Error desconegut'}`,
        });
      }
    } catch (error) {
      setCronResult({
        ok: false,
        message: `❌ Error de connexió: ${error instanceof Error ? error.message : 'Error'}`,
      });
    } finally {
      setRunningCron(false);
    }
  }

  async function sendTestimonialsReminder() {
    setRunningReminder(true);
    setReminderResult(null);

    try {
      const res = await fetchWithCsrf('/api/admin/emails/testimonials-reminder', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        const pending = data.pendingCount || 0;
        setReminderResult({
          ok: true,
          message: pending > 0 ? `✅ Recordatori enviat (${pending} pendents)` : '✅ No hi ha testimonis pendents',
        });
      } else {
        setReminderResult({
          ok: false,
          message: `❌ Error: ${data.error || 'Error desconegut'}`,
        });
      }
    } catch (error) {
      setReminderResult({
        ok: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error'}`,
      });
    } finally {
      setRunningReminder(false);
    }
  }

  async function sendTestEmail() {
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ ok: false, message: '❌ Introdueix un email vàlid' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetchWithCsrf('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setTestResult({ ok: true, message: '✅ Email de prova enviat!' });
        setTestEmail('');
      } else {
        setTestResult({ ok: false, message: `❌ ${data.error || 'Error enviant'}` });
      }
    } catch (error) {
      setTestResult({
        ok: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Error'}`,
      });
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <section className="ap-card overflow-hidden" data-help-title="Accions manuals d'email" data-help-desc="Aquí pots forçar automatismes, enviar recordatoris o validar que el sistema de correu funciona sense esperar el cron.">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">🔧 Accions Manuals</h2>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <h3 className="mb-2 text-sm font-medium">Executar Cron Post-Event</h3>
          <p className="mb-3 text-xs">Envia correus a tots els esdeveniments completats pendents</p>
          <button
            onClick={runCronManually}
            disabled={runningCron}
            type="button"
            aria-busy={runningCron}
            className={runningCron ? DISABLED_BUTTON : IDLE_BUTTON}
          >
            {runningCron ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Executant...
              </span>
            ) : (
              '🚀 Executar ara'
            )}
          </button>
          {cronResult && <ResultMessage result={cronResult} />}
        </div>

        <hr />

        <div>
          <h3 className="mb-2 text-sm font-medium">Recordatori de testimonis</h3>
          <p className="mb-3 text-xs">Envia un resum amb testimonis pendents d'aprovació</p>
          <button
            onClick={sendTestimonialsReminder}
            disabled={runningReminder}
            type="button"
            aria-busy={runningReminder}
            className={runningReminder ? DISABLED_BUTTON : IDLE_BUTTON}
          >
            {runningReminder ? 'Enviant...' : '⭐ Envia recordatori'}
          </button>
          {reminderResult && <ResultMessage result={reminderResult} />}
        </div>

        <hr />

        <div>
          <h3 className="mb-2 text-sm font-medium">Envia correu de prova</h3>
          <p className="mb-3 text-xs">Envia un email de prova per verificar la configuració SMTP</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="email@exemple.com"
              aria-label="Email de prova"
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <button
              onClick={sendTestEmail}
              disabled={sendingTest}
              type="button"
              aria-busy={sendingTest}
              className={sendingTest ? DISABLED_BUTTON.replace('w-full ', '') : PRIMARY_BUTTON}
            >
              {sendingTest ? '...' : '📧'}
            </button>
          </div>
          {testResult && <ResultMessage result={testResult} />}
        </div>

        <hr />

        <div>
          <h3 className="mb-3 text-sm font-medium">Enllaços Ràpids</h3>
          <div className="space-y-2">
            <a
              href="/api/canvas/rating?name=Prova&rating=10&code=TEST15&discount=15"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl border px-3 py-2 text-center text-sm transition-colors"
            >
              🎨 Previsualitzar Canvas
            </a>
            <a
              href="/ca/valoracio?ref=TEST-001"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl border px-3 py-2 text-center text-sm transition-colors"
            >
              ⭐ Veure pàgina valoració
            </a>
            <a
              href="/admin/google-reviews"
              className="block w-full rounded-xl border px-3 py-2 text-center text-sm transition-colors"
            >
              📋 Gestionar ressenyes
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
