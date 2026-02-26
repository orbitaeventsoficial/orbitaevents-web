'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDateTime } from '@/lib/constants';

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
  const gmailStatus = searchParams?.get('gmail') ?? null;

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
        <h1 className="text-2xl font-semibold tracking-tight">
          Configurar safata d&apos;entrada (Gmail)
        </h1>
        <p className="mt-1 text-sm">
          Connecta el teu compte de Gmail per veure els emails al panel d&apos;administració.
        </p>
      </header>

      {/* Status message from OAuth */}
      {gmailStatus === 'connected' && (
        <div className="border rounded-xl p-4" role="status" aria-live="polite">
          <p className="font-medium">✅ Gmail connectat correctament!</p>
        </div>
      )}
      {gmailStatus === 'error' && (
        <div className="border rounded-xl p-4" role="alert">
          <p className="font-medium">❌ Error connectant Gmail. Torna-ho a provar.</p>
          {searchParams?.get('reason') && (
            <p className="text-sm mt-2">
              Detall: {decodeURIComponent(searchParams?.get('reason') || '')}
            </p>
          )}
        </div>
      )}

      {/* Connection Status */}
      <div className={`rounded-2xl border p-6 ${
        isConnected
          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'
          : 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
      }`}>
        <h2 className="text-sm font-semibold uppercase mb-3">
          Estat de la connexió
        </h2>

        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-lg">
                ✓
              </span>
              <div>
                <p className="font-semibold">Gmail connectat</p>
                <p className="text-sm">{connectedEmail}</p>
              </div>
            </div>
            {connectedAt && (
              <p className="text-xs">
                Connectat el {formatDateTime(connectedAt)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-lg">
                !
              </span>
              <div>
                <p className="font-semibold">Gmail no connectat</p>
                <p className="text-sm">Cal autoritzar l&apos;accés al teu compte de Gmail</p>
              </div>
            </div>
            <button
              onClick={connectGmail}
              type="button"
              className="px-6 py-3 text-white rounded-xl shadow-lg transition-colors font-medium flex items-center gap-2"
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
        <div className="rounded-2xl border backdrop-blur-sm p-6">
          <h2 className="text-sm font-semibold uppercase mb-3">
            Provar connexió
          </h2>

          <button
            onClick={testConnection}
            disabled={testing}
            type="button"
            aria-busy={testing}
            className="px-6 py-3 text-white rounded-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {testing ? '⏳ Provant connexió...' : '🔌 Provar connexió Gmail'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-xl border ${
              testResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`} role={testResult.ok ? 'status' : 'alert'}>
              {testResult.ok ? (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold">Connexió exitosa!</p>
                    <p className="text-sm mt-1">
                      Connectat a: {testResult.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold">Error de connexió</p>
                    <p className="text-sm mt-1">
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
      <div className="rounded-2xl border p-6">
        <h2 className="text-sm font-semibold uppercase mb-2">
          ℹ️ Com funciona
        </h2>
        <ul className="text-sm space-y-2">
          <li>• L&apos;inbox del panel mostra els emails del teu Gmail</li>
          <li>• Pots veure, marcar com llegit i eliminar emails</li>
          <li>• Els emails reenviats des d&apos;info@orbitaevents.com també apareixeran</li>
          <li>• La connexió és segura via OAuth2 de Google</li>
        </ul>
      </div>

      {/* Reconnect option */}
      {isConnected && (
        <div className="rounded-2xl border backdrop-blur-sm p-6">
          <h2 className="text-sm font-semibold uppercase mb-3">
            Reconnectar
          </h2>
          <p className="text-sm mb-3">
            Si tens problemes amb la connexió, pots tornar a autoritzar Gmail.
          </p>
          <button
            onClick={connectGmail}
            type="button"
            className="px-4 py-2 rounded-xl border transition-colors text-sm font-medium"
          >
            🔄 Reconnectar Gmail
          </button>
        </div>
      )}
    </div>
  );
}
