'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  secure: boolean;
  configured: boolean;
  source: 'env' | 'db' | 'none';
}

interface ConnectionResult {
  ok: boolean;
  error?: string;
}

export default function ImapSettingsClient() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ImapConfig | null>(null);
  const [connection, setConnection] = useState<ConnectionResult | null>(null);

  // Form state
  const [host, setHost] = useState('');
  const [port, setPort] = useState('993');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inbox/settings');
      if (!res.ok) throw new Error('Error carregant config');
      const data = await res.json();
      setConfig(data.config);
      setConnection(data.connection);

      // Pre-fill form with existing values
      if (data.config) {
        setHost(data.config.host || '');
        setPort(String(data.config.port || 993));
        setUser(data.config.user || '');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const testConnection = async () => {
    if (!host || !user || !pass) {
      toast.error('Cal omplir host, usuari i contrasenya');
      return;
    }
    setTesting(true);
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, pass, testOnly: true }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Connexió IMAP exitosa!');
        setConnection({ ok: true });
      } else {
        toast.error(data.error || 'Error de connexió');
        setConnection({ ok: false, error: data.error });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!host || !user || !pass) {
      toast.error('Cal omplir host, usuari i contrasenya');
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, pass }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Configuració IMAP guardada');
        if (data.connection?.ok) {
          setConnection({ ok: true });
        } else {
          setConnection({ ok: false, error: data.connection?.error });
        }
        setShowForm(false);
        await loadConfig();
      } else {
        toast.error(data.error || 'Error guardant');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant configuració...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estat de connexió */}
      <div className={`rounded-2xl border p-5 ${
        connection?.ok
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : config?.configured
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-amber-500/30 bg-amber-500/5'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-4 w-4 rounded-full ${
              connection?.ok ? 'bg-emerald-400' : config?.configured ? 'bg-rose-400' : 'bg-amber-400'
            }`} />
            <div>
              <h2 className="font-semibold">
                {connection?.ok
                  ? 'IMAP connectat i operatiu'
                  : config?.configured
                    ? 'IMAP configurat però amb error'
                    : 'IMAP no configurat'}
              </h2>
              {config?.source === 'env' && (
                <p className="text-xs text-white/50 mt-0.5">Font: variables d&apos;entorn (Railway)</p>
              )}
              {config?.source === 'db' && (
                <p className="text-xs text-white/50 mt-0.5">Font: base de dades (configurat des de l&apos;admin)</p>
              )}
            </div>
          </div>
          {connection?.ok && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              ONLINE
            </span>
          )}
        </div>
        {connection && !connection.ok && connection.error && (
          <p className="mt-2 text-sm text-rose-400">{connection.error}</p>
        )}
      </div>

      {/* Config actual */}
      {config?.configured && (
        <div className="rounded-2xl border p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3">Configuració actual</h3>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/50">Servidor</span>
              <span className="font-mono">{config.host}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/50">Port</span>
              <span className="font-mono">{config.port}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/50">Usuari</span>
              <span className="font-mono">{config.user}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/50">SSL/TLS</span>
              <span>{config.secure ? 'Sí (port 993)' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Contrasenya</span>
              <span>••••••••</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulari de configuració */}
      {(!config?.configured || showForm) ? (
        <div className="rounded-2xl border p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
            {config?.configured ? 'Modificar configuració' : 'Configurar connexió IMAP'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="imap-host" className="block text-xs font-medium mb-1">Servidor IMAP</label>
              <input
                id="imap-host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="imap.dondominio.com"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="imap-port" className="block text-xs font-medium mb-1">Port</label>
              <input
                id="imap-port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="993"
                min={1}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="imap-user" className="block text-xs font-medium mb-1">Usuari (email)</label>
              <input
                id="imap-user"
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="info@orbitaevents.com"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label htmlFor="imap-pass" className="block text-xs font-medium mb-1">Contrasenya</label>
              <input
                id="imap-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={testConnection}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:bg-white/10 disabled:opacity-50 active:scale-[0.98]"
            >
              {testing ? 'Provant...' : 'Provar connexió'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveConfig}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? 'Guardant...' : 'Guardar i connectar'}
            </button>
            {showForm && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center rounded-xl border px-3 py-2 text-sm transition-all active:scale-[0.98]"
              >
                Cancel·lar
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:bg-white/10 active:scale-[0.98]"
        >
          Modificar configuració
        </button>
      )}

      {/* Com funciona */}
      <div className="rounded-2xl border p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-2">Com funciona</h3>
        <ul className="space-y-1.5 text-sm text-white/70">
          <li>• La safata llegeix correus directament del servidor IMAP (DonDominio).</li>
          <li>• Només es mostren correus enviats o rebuts per <strong className="text-white/90">orbitaevents.com</strong>.</li>
          <li>• Les credencials es guarden xifrades a la base de dades.</li>
          <li>• Si tens variables d&apos;entorn configurades a Railway, tenen prioritat.</li>
        </ul>
      </div>
    </div>
  );
}
