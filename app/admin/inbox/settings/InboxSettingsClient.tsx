'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InboxSettingsClient({
  isConnected,
  connectedEmail,
  connectedAt,
}: {
  isConnected: boolean;
  connectedEmail: string | null;
  connectedAt: string | null;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    error?: string;
    email?: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const gmailStatus = searchParams.get('gmail');

  async function testConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/inbox/messages?action=test');
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({
        ok: false,
        error: 'Error de connexió amb el servidor',
      });
    } finally {
      setTesting(false);
    }
  }

  function connectGmail() {
    // Redirigir al flujo OAuth de Gmail
    window.location.href = '/api/gmail/oauth/start';
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          Configurar Inbox (Gmail)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Connecta el teu compte de Gmail per veure els emails al panel d&apos;administració.
        </p>
      </header>

      {/* Status message from OAuth */}
      {gmailStatus === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="status" aria-live="polite">
          <p className="text-green-700 font-medium">✅ Gmail connectat correctament!</p>
        </div>
      )}
      {gmailStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4" role="alert">
          <p className="text-red-700 font-medium">❌ Error connectant Gmail. Torna-ho a provar.</p>
          {searchParams.get('reason') && (
            <p className="text-red-600 text-sm mt-2">
              Detall: {decodeURIComponent(searchParams.get('reason') || '')}
            </p>
          )}
        </div>
      )}

      {/* Connection Status */}
      <div className={`rounded-xl border p-6 ${
        isConnected
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <h2 className="text-sm font-semibold uppercase mb-3 text-slate-700">
          Estat de la connexió
        </h2>

        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg">
                ✓
              </span>
              <div>
                <p className="font-semibold text-green-700">Gmail connectat</p>
                <p className="text-sm text-green-600">{connectedEmail}</p>
              </div>
            </div>
            {connectedAt && (
              <p className="text-xs text-green-600">
                Connectat el {new Date(connectedAt).toLocaleDateString('ca-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg">
                !
              </span>
              <div>
                <p className="font-semibold text-amber-700">Gmail no connectat</p>
                <p className="text-sm text-amber-600">Cal autoritzar l&apos;accés al teu compte de Gmail</p>
              </div>
            </div>
            <button
              onClick={connectGmail}
              type="button"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connectar Gmail
            </button>
          </div>
        )}
      </div>

      {/* Test Connection */}
      {isConnected && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase mb-3 text-slate-700">
            Provar connexió
          </h2>

          <button
            onClick={testConnection}
            disabled={testing}
            type="button"
            aria-busy={testing}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {testing ? '⏳ Provant connexió...' : '🔌 Provar connexió Gmail'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              testResult.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`} role={testResult.ok ? 'status' : 'alert'}>
              {testResult.ok ? (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-700">Connexió exitosa!</p>
                    <p className="text-sm text-green-600 mt-1">
                      Connectat a: {testResult.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold text-red-700">Error de connexió</p>
                    <p className="text-sm text-red-600 mt-1">
                      {testResult.error || 'No es pot connectar a Gmail'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-sm font-semibold uppercase mb-2 text-blue-900">
          ℹ️ Com funciona
        </h2>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• L&apos;inbox del panel mostra els emails del teu Gmail</li>
          <li>• Pots veure, marcar com llegit i eliminar emails</li>
          <li>• Els emails reenviats des d&apos;info@orbitaevents.com també apareixeran</li>
          <li>• La connexió és segura via OAuth2 de Google</li>
        </ul>
      </div>

      {/* Reconnect option */}
      {isConnected && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase mb-3 text-slate-700">
            Reconnectar
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Si tens problemes amb la connexió, pots tornar a autoritzar Gmail.
          </p>
          <button
            onClick={connectGmail}
            type="button"
            className="px-4 py-2 bg-stone-200 text-slate-700 rounded-lg hover:bg-stone-300 transition-colors text-sm font-medium"
          >
            🔄 Reconnectar Gmail
          </button>
        </div>
      )}
    </div>
  );
}
