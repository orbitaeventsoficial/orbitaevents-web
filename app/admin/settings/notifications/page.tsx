'use client';
import { log } from '@/lib/logger';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NotificationConfig {
  smtp: {
    host: string;
    user: string;
    pass: string;
    port: string;
    from: string;
    secure: string;
  };
  recipients: {
    contactTo: string;
    adminWhatsApp: string;
  };
  webhooks: {
    whatsappWebhook: string;
    leadWebhook: string;
  };
  whatsappApi: {
    url: string;
    token: string;
  };
  status: {
    emailReady: boolean;
    whatsappReady: boolean;
  };
  automation: {
    cronSecretConfigured: boolean;
    lastRun: string | null;
    lastStatus: string | null;
    lastMessage: string | null;
    lastSummary: {
      sequences?: { executed?: number; sentEmail?: number; sentWhatsapp?: number };
      sla?: { createdTasks?: number };
      kpi24h?: { responseRate?: number; commSent?: number; commResponded?: number };
    } | null;
  };
}

export default function SettingsNotificationsPage() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [autopilotResult, setAutopilotResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/test-notifications');
      const data = await res.json();
      setConfig(data.config);
      setInstructions(data.instructions);
    } catch (error) {
      log.error('Error carregant configuració:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/admin/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconegut',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunAutopilotNow = async () => {
    setRunningAutopilot(true);
    setAutopilotResult(null);
    try {
      const res = await fetch('/api/admin/automation/daily-summary/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s’ha pogut executar el resum diari');
      }
      setAutopilotResult({
        success: true,
        message: 'Resum diari executat i enviat correctament',
      });
      await fetchConfig();
    } catch (error) {
      setAutopilotResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconegut',
      });
    } finally {
      setRunningAutopilot(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Carregant configuració...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/settings"
            className="text-sm text-slate-400 hover:text-slate-200 mb-2 inline-block"
          >
            ← Tornar a configuració
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-200">
            📧 Configuració de notificacions
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona com reps alertes quan entra un nou lead
          </p>
        </div>
      </header>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-xl border p-6 shadow-sm ${config?.status.emailReady ? 'border-emerald-400/30 bg-emerald-950/30' : 'border-rose-400/30 bg-rose-950/30'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config?.status.emailReady ? '✅' : '❌'}</span>
            <h2 className="text-lg font-semibold text-slate-200">Email</h2>
          </div>
          <p className={`text-sm ${config?.status.emailReady ? 'text-emerald-300' : 'text-rose-300'}`}>
            {config?.status.emailReady 
              ? 'Configurat i funcionant' 
              : 'No configurat: no rebràs correus de leads nous'
            }
          </p>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm ${config?.status.whatsappReady ? 'border-emerald-400/30 bg-emerald-950/30' : 'border-yellow-400/30 bg-yellow-950/30'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config?.status.whatsappReady ? '✅' : '⚠️'}</span>
            <h2 className="text-lg font-semibold text-slate-200">WhatsApp</h2>
          </div>
          <p className={`text-sm ${config?.status.whatsappReady ? 'text-emerald-300' : 'text-yellow-300'}`}>
            {config?.status.whatsappReady 
              ? 'Configurat com a backup' 
              : 'No configurat (opcional)'
            }
          </p>
        </div>
      </div>

      {/* Test Email */}
      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">🧪 Test d'Email</h2>
        
      {testResult && (
          <div className={`mb-4 p-4 rounded-lg ${testResult.success ? 'bg-emerald-950/30 border border-emerald-400/30 text-emerald-300' : 'bg-rose-950/30 border border-rose-400/30 text-rose-300'}`} role={testResult.success ? 'status' : 'alert'}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleTestEmail}
          disabled={testing || !config?.status.emailReady}
          type="button"
          aria-busy={testing}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? '📤 Enviant...' : '📧 Envia correu de prova'}
        </button>
        
        {!config?.status.emailReady && (
          <p className="mt-2 text-sm text-slate-400">
            Configura primer les variables SMTP per poder testejar
          </p>
        )}
      </section>

      {/* Commercial Autopilot */}
      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">🤖 Autopilot Comercial</h2>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400">CRON_SECRET</span>
            <span className={config?.automation.cronSecretConfigured ? 'text-emerald-300' : 'text-rose-300'}>
              {config?.automation.cronSecretConfigured ? '✅ Configurat' : '❌ FALTA'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400">Última execució</span>
            <span className="text-slate-200">
              {config?.automation.lastRun
                ? new Date(config.automation.lastRun).toLocaleString('ca-ES')
                : 'Mai'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-slate-400">Estat</span>
            <span
              className={
                config?.automation.lastStatus === 'ok'
                  ? 'text-emerald-300'
                  : config?.automation.lastStatus === 'error'
                    ? 'text-rose-300'
                    : 'text-slate-200'
              }
            >
              {config?.automation.lastStatus || 'Sense dades'}
            </span>
          </div>
          {config?.automation.lastSummary && (
            <div className="rounded-lg bg-white/5 p-3 text-slate-200">
              <p>
                Seq: {config.automation.lastSummary.sequences?.executed ?? 0} · Email:{' '}
                {config.automation.lastSummary.sequences?.sentEmail ?? 0} · WA:{' '}
                {config.automation.lastSummary.sequences?.sentWhatsapp ?? 0}
              </p>
              <p>
                Tasques 24h: {config.automation.lastSummary.sla?.createdTasks ?? 0} · Resp 24h:{' '}
                {((config.automation.lastSummary.kpi24h?.responseRate ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          )}
          {config?.automation.lastMessage && (
            <p className="text-xs text-rose-300">Últim error: {config.automation.lastMessage}</p>
          )}
        </div>

        {autopilotResult && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              autopilotResult.success
                ? 'bg-emerald-950/30 border border-emerald-400/30 text-emerald-300'
                : 'bg-rose-950/30 border border-rose-400/30 text-rose-300'
            }`}
            role={autopilotResult.success ? 'status' : 'alert'}
          >
            {autopilotResult.message}
          </div>
        )}

        <button
          onClick={handleRunAutopilotNow}
          disabled={runningAutopilot || !config?.automation.cronSecretConfigured}
          type="button"
          aria-busy={runningAutopilot}
          className="mt-4 px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runningAutopilot ? '🚀 Executant...' : '🚀 Executar resum diari ara'}
        </button>
        {!config?.automation.cronSecretConfigured && (
          <p className="mt-2 text-sm text-slate-400">
            Configura <code className="bg-white/5 px-1 rounded">CRON_SECRET</code> per activar l’autopilot.
          </p>
        )}
      </section>

      {/* Detall de configuració */}
      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">⚙️ Configuració Actual</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-200 mb-2">SMTP (Email)</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(config?.smtp || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400 uppercase text-xs">{key}</span>
                  <span className={value.includes('✅') ? 'text-emerald-300' : value.includes('❌') ? 'text-rose-300' : 'text-slate-200'}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-200 mb-2">Destinataris</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(config?.recipients || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400 uppercase text-xs">{key}</span>
                  <span className="text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instruccions */}
      {instructions.length > 0 && !config?.status.emailReady && (
        <section className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-200 mb-4">📝 Instruccions de Configuració</h2>
          
          {instructions.map((instruction, index) => (
            <pre key={index} className="bg-slate-950/60 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap mb-4">
              {instruction}
            </pre>
          ))}
        </section>
      )}

      {/* Referència ràpida */}
      <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">📚 Referència Ràpida</h2>
        
        <div className="prose prose-sm max-w-none text-slate-300">
          <h3 className="text-base font-medium text-slate-200">Variables d'entorn necessàries:</h3>
          <div className="bg-white/5 p-4 rounded-lg font-mono text-xs">
            <div className="text-red-500"># Obligatòries per email</div>
            <div>SMTP_HOST=smtp.dondominio.com</div>
            <div>SMTP_PORT=587</div>
            <div>SMTP_USER=info@orbitaevents.com</div>
            <div>SMTP_PASS=la_teva_contrasenya</div>
            <div>SMTP_FROM=info@orbitaevents.com</div>
            <div>CONTACT_TO=info@orbitaevents.com</div>
            <div className="mt-4 text-yellow-300"># Opcionals per WhatsApp</div>
            <div>ADMIN_WHATSAPP=+34612345678</div>
            <div>WHATSAPP_WEBHOOK_URL=https://hook.make.com/xxx</div>
          </div>
          
          <h3 className="text-base font-medium text-slate-200 mt-6">On configurar:</h3>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Ves al <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">panell de Railway</a></li>
            <li>Selecciona el projecte <code className="bg-white/5 px-1 rounded">orbitaevents-web</code></li>
            <li>Configuració → Variables d&apos;entorn</li>
            <li>Afegeix cada variable amb el seu valor</li>
            <li>Redesplega el projecte</li>
          </ol>
        </div>
      </section>
    </div>
  );
}






