// app/admin/emails/ManualActionsPanel.tsx
'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

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
      // Use admin-protected endpoint instead of exposing CRON_SECRET
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
          message: pending > 0
            ? `✅ Recordatori enviat (${pending} pendents)`
            : '✅ No hi ha testimonis pendents',
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
    <section className="rounded-2xl border admin-card-glass overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold">🔧 Accions Manuals</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Run Cron Manually */}
        <div>
          <h3 className="text-sm font-medium mb-2">Executar Cron Post-Event</h3>
          <p className="text-xs mb-3">
            Envia correus a tots els esdeveniments completats pendents
          </p>
          <button
            onClick={runCronManually}
            disabled={runningCron}
            type="button"
            aria-busy={runningCron}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              runningCron
                ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
            }`}
          >
            {runningCron ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                Executant...
              </span>
            ) : (
              '🚀 Executar ara'
            )}
          </button>
          {cronResult && (
            <p
              className={`mt-2 text-xs ${cronResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}
              role={cronResult.ok ? 'status' : 'alert'}
            >
              {cronResult.message}
            </p>
          )}
        </div>

        <hr className="" />

        {/* Testimonials Reminder */}
        <div>
          <h3 className="text-sm font-medium mb-2">Recordatori de testimonis</h3>
          <p className="text-xs mb-3">
            Envia un resum amb testimonis pendents d'aprovació
          </p>
          <button
            onClick={sendTestimonialsReminder}
            disabled={runningReminder}
            type="button"
            aria-busy={runningReminder}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              runningReminder
                ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
            }`}
          >
            {runningReminder ? 'Enviant...' : '⭐ Envia recordatori'}
          </button>
          {reminderResult && (
            <p
              className={`mt-2 text-xs ${reminderResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}
              role={reminderResult.ok ? 'status' : 'alert'}
            >
              {reminderResult.message}
            </p>
          )}
        </div>

        <hr className="" />

        {/* Send Test Email */}
        <div>
          <h3 className="text-sm font-medium mb-2">Envia correu de prova</h3>
          <p className="text-xs mb-3">
            Envia un email de prova per verificar la configuració SMTP
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="email@exemple.com"
              aria-label="Email de prova"
              className="flex-1 px-3 py-2 text-sm rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
            <button
              onClick={sendTestEmail}
              disabled={sendingTest}
              type="button"
              aria-busy={sendingTest}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                sendingTest
                  ? 'bg-white/5 text-white/30 border border-white/10'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {sendingTest ? '...' : '📧'}
            </button>
          </div>
          {testResult && (
            <p
              className={`mt-2 text-xs ${testResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}
              role={testResult.ok ? 'status' : 'alert'}
            >
              {testResult.message}
            </p>
          )}
        </div>

        <hr className="" />

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-medium mb-3">Enllaços Ràpids</h3>
          <div className="space-y-2">
            <a
              href="/api/canvas/rating?name=Prova&rating=10&code=TEST15&discount=15"
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2 text-sm rounded-xl transition-colors border"
            >
              🎨 Previsualitzar Canvas
            </a>
            <a
              href="/ca/valoracio?ref=TEST-001"
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2 text-sm rounded-xl transition-colors border"
            >
              ⭐ Veure pàgina valoració
            </a>
            <a
              href="/admin/google-reviews"
              className="block w-full text-center px-3 py-2 text-sm rounded-xl transition-colors border"
            >
              📋 Gestionar ressenyes
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
