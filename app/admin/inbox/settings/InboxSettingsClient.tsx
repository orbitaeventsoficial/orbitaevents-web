'use client';

import { useState } from 'react';

interface EnvStatus {
  IMAP_HOST: boolean;
  IMAP_PORT: boolean;
  IMAP_USER: boolean;
  IMAP_PASS: boolean;
}

export default function InboxSettingsClient({
  envStatus,
  allConfigured,
}: {
  envStatus: EnvStatus;
  allConfigured: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    error?: string;
  } | null>(null);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/inbox/messages?action=test');
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        ok: false,
        error: 'Error de connexió amb el servidor',
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          Configurar correu (IMAP)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          L&apos;inbox del panel mostra els emails reals quan les variables IMAP estan configurades.
        </p>
      </header>

      {/* Status de les variables d'entorn */}
      <div className={`rounded-xl border p-6 ${
        allConfigured
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <h2 className="text-sm font-semibold uppercase mb-3 text-slate-700">
          Estat de la configuració
        </h2>

        <div className="space-y-2">
          {Object.entries(envStatus).map(([key, isSet]) => (
            <div key={key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                isSet ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {isSet ? '✓' : '✕'}
              </span>
              <code className="text-sm font-mono text-slate-700">{key}</code>
              <span className="text-xs text-slate-500">
                {isSet ? '(configurada)' : '(no configurada)'}
              </span>
            </div>
          ))}
        </div>

        {!allConfigured && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>⚠️ Falten variables:</strong> Configura-les a Vercel (Project Settings → Environment Variables) i fes un redeploy.
            </p>
          </div>
        )}

        {allConfigured && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg border border-green-200">
            <p className="text-sm text-green-900">
              <strong>✓ Configuració completa:</strong> Totes les variables estan configurades. Prova la connexió per verificar que funciona.
            </p>
          </div>
        )}
      </div>

      {/* Test de connexió */}
      {allConfigured && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
          <h2 className="text-sm font-semibold uppercase mb-3 text-slate-700">
            Provar connexió
          </h2>

          <button
            onClick={testConnection}
            disabled={testing}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {testing ? '⏳ Provant connexió...' : '🔌 Provar connexió IMAP'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              testResult.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {testResult.ok ? (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-700">Connexió exitosa!</p>
                    <p className="text-sm text-green-600 mt-1">
                      El servidor IMAP està configurat correctament i es pot connectar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold text-red-700">Error de connexió</p>
                    <p className="text-sm text-red-600 mt-1">
                      {testResult.error || 'No es pot connectar al servidor IMAP'}
                    </p>
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="text-xs text-red-700 font-semibold mb-2">Possibles causes:</p>
                      <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                        <li>Credencials incorrectes (usuari o contrasenya)</li>
                        <li>Servidor IMAP bloqueja les IPs de Vercel</li>
                        <li>Port incorrecte (hauria de ser 993 per SSL/TLS)</li>
                        <li>El servidor requereix una IP whitelist</li>
                        <li>Les variables d&apos;entorn no s&apos;han actualitzat després del redeploy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instruccions */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="text-sm font-semibold uppercase mb-3 text-slate-700">
          Com configurar-ho
        </h2>

        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <div>
              <p className="font-medium text-slate-700">Ves a Vercel Dashboard</p>
              <p className="text-xs text-slate-500 mt-1">
                Projecte → Settings → Environment Variables
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <div>
              <p className="font-medium text-slate-700">Afegeix les variables IMAP</p>
              <code className="mt-1 block rounded-md bg-slate-100 p-2 text-xs text-slate-700 font-mono">
                IMAP_HOST=mail.dondominio.com<br />
                IMAP_PORT=993<br />
                IMAP_USER=info@orbitaevents.com<br />
                IMAP_PASS=la-teva-contrasenya
              </code>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            <div>
              <p className="font-medium text-slate-700">Selecciona l&apos;entorn</p>
              <p className="text-xs text-slate-500 mt-1">
                Marca: Production, Preview i Development (o només els que necessitis)
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              4
            </span>
            <div>
              <p className="font-medium text-slate-700">Redeploy</p>
              <p className="text-xs text-slate-500 mt-1">
                Deployments → últim deployment → ⋯ → Redeploy
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              5
            </span>
            <div>
              <p className="font-medium text-slate-700">Prova la connexió</p>
              <p className="text-xs text-slate-500 mt-1">
                Refresca aquesta pàgina i clica el botó &quot;Provar connexió IMAP&quot;
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Nota sobre seguretat */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-sm font-semibold uppercase mb-2 text-blue-900">
          ℹ️ Nota de seguretat
        </h2>
        <p className="text-sm text-blue-700">
          Les credencials IMAP es guarden de forma segura a Vercel i no es mostren mai al navegador.
          Aquesta pàgina només indica si les variables estan configurades o no.
        </p>
      </div>
    </div>
  );
}
