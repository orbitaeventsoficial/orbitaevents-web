// app/admin/emails/ManualActionsPanel.tsx
'use client';

import { useState } from 'react';

export default function ManualActionsPanel() {
  const [runningCron, setRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function runCronManually() {
    setRunningCron(true);
    setCronResult(null);

    try {
      // Use admin-protected endpoint instead of exposing CRON_SECRET
      const res = await fetch('/api/admin/emails/run-cron', {
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

  async function sendTestEmail() {
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ ok: false, message: '❌ Introdueix un email vàlid' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/emails/test', {
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
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-slate-900">🔧 Accions Manuals</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Run Cron Manually */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Executar Cron Post-Event</h3>
          <p className="text-xs text-slate-500 mb-3">
            Envia emails a tots els events completats pendents
          </p>
          <button
            onClick={runCronManually}
            disabled={runningCron}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              runningCron
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {runningCron ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Executant...
              </span>
            ) : (
              '🚀 Executar ara'
            )}
          </button>
          {cronResult && (
            <p className={`mt-2 text-xs ${cronResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {cronResult.message}
            </p>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Send Test Email */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Enviar Email de Prova</h3>
          <p className="text-xs text-slate-500 mb-3">
            Envia un email de prova per verificar la configuració SMTP
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={sendTestEmail}
              disabled={sendingTest}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sendingTest
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {sendingTest ? '...' : '📧'}
            </button>
          </div>
          {testResult && (
            <p className={`mt-2 text-xs ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </p>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Enllaços Ràpids</h3>
          <div className="space-y-2">
            <a
              href="/api/canvas/rating?name=Prova&rating=10&code=TEST15&discount=15"
              target="_blank" rel="noopener noreferrer"
              rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              🎨 Previsualitzar Canvas
            </a>
            <a
              href="/ca/valoracio?ref=TEST-001"
              target="_blank" rel="noopener noreferrer"
              rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              ⭐ Veure pàgina valoració
            </a>
            <a
              href="/admin/ressenyes"
              className="block w-full text-center px-3 py-2 text-sm bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              📋 Gestionar ressenyes
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
