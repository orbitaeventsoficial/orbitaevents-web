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
}

export default function SettingsNotificationsPage() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500">Carregant configuració...</p>
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
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
          >
            ← Tornar a configuració
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            📧 Configuració de Notificacions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona com reps alertes quan entra un nou lead
          </p>
        </div>
      </header>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`rounded-xl border p-6 shadow-sm ${config?.status.emailReady ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config?.status.emailReady ? '✅' : '❌'}</span>
            <h2 className="text-lg font-semibold text-black">Email</h2>
          </div>
          <p className={`text-sm ${config?.status.emailReady ? 'text-green-700' : 'text-red-700'}`}>
            {config?.status.emailReady 
              ? 'Configurat i funcionant' 
              : 'No configurat - No rebràs emails de leads nous'
            }
          </p>
        </div>

        <div className={`rounded-xl border p-6 shadow-sm ${config?.status.whatsappReady ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config?.status.whatsappReady ? '✅' : '⚠️'}</span>
            <h2 className="text-lg font-semibold text-black">WhatsApp</h2>
          </div>
          <p className={`text-sm ${config?.status.whatsappReady ? 'text-green-700' : 'text-yellow-700'}`}>
            {config?.status.whatsappReady 
              ? 'Configurat com a backup' 
              : 'No configurat (opcional)'
            }
          </p>
        </div>
      </div>

      {/* Test Email */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-black mb-4">🧪 Test d'Email</h2>
        
        {testResult && (
          <div className={`mb-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleTestEmail}
          disabled={testing || !config?.status.emailReady}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? '📤 Enviant...' : '📧 Enviar Email de Test'}
        </button>
        
        {!config?.status.emailReady && (
          <p className="mt-2 text-sm text-slate-500">
            Configura primer les variables SMTP per poder testejar
          </p>
        )}
      </section>

      {/* Configuration Details */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-black mb-4">⚙️ Configuració Actual</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">SMTP (Email)</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(config?.smtp || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 uppercase text-xs">{key}</span>
                  <span className={value.includes('✅') ? 'text-green-600' : value.includes('❌') ? 'text-red-600' : 'text-black'}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Destinataris</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(config?.recipients || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 uppercase text-xs">{key}</span>
                  <span className="text-black">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instructions */}
      {instructions.length > 0 && !config?.status.emailReady && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">📝 Instruccions de Configuració</h2>
          
          {instructions.map((instruction, index) => (
            <pre key={index} className="bg-white text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap mb-4">
              {instruction}
            </pre>
          ))}
        </section>
      )}

      {/* Quick Reference */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-black mb-4">📚 Referència Ràpida</h2>
        
        <div className="prose prose-sm max-w-none text-slate-600">
          <h3 className="text-base font-medium text-slate-800">Variables d'entorn necessàries:</h3>
          <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs">
            <div className="text-red-500"># Obligatòries per email</div>
            <div>SMTP_HOST=smtp.dondominio.com</div>
            <div>SMTP_PORT=587</div>
            <div>SMTP_USER=info@orbitaevents.com</div>
            <div>SMTP_PASS=la_teva_contrasenya</div>
            <div>SMTP_FROM=info@orbitaevents.com</div>
            <div>CONTACT_TO=info@orbitaevents.com</div>
            <div className="mt-4 text-yellow-600"># Opcionals per WhatsApp</div>
            <div>ADMIN_WHATSAPP=+34612345678</div>
            <div>WHATSAPP_WEBHOOK_URL=https://hook.make.com/xxx</div>
          </div>
          
          <h3 className="text-base font-medium text-slate-800 mt-6">On configurar:</h3>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Ves a <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Vercel Dashboard</a></li>
            <li>Selecciona el projecte <code className="bg-slate-100 px-1 rounded">orbitaevents-web</code></li>
            <li>Settings → Environment Variables</li>
            <li>Afegeix cada variable amb el seu valor</li>
            <li>Redesplega el projecte</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
