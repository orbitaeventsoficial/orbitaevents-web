'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../components/ToastProvider';
import { EditorControlStrip } from '../../components/EditorControlStrip';
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
      const res = await fetchWithCsrf('/api/admin/inbox/settings');
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
      console.error('Error carregant configuració IMAP', err);
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
        toast.success('Connexió IMAP correcta!');
        setConnection({ ok: true });
      } else {
        toast.error(data.error || 'Error de connexió');
        setConnection({ ok: false, error: data.error });
      }
    } catch (err) {
      console.error('Error provant connexió IMAP', err);
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
        toast.success('Configuració IMAP desada');
        if (data.connection?.ok) {
          setConnection({ ok: true });
        } else {
          setConnection({ ok: false, error: data.connection?.error });
        }
        setShowForm(false);
        await loadConfig();
      } else {
        toast.error(data.error || 'Error desant');
      }
    } catch (err) {
      console.error('Error desant configuració IMAP', err);
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

  const connectionTone = connection?.ok
    ? 'ap-card ap-card--success'
    : config?.configured
      ? 'ap-card ap-card--danger'
      : 'ap-card ap-card--warning';

  const connectionDot = connection?.ok
    ? 'admin-tone-bg-success'
    : config?.configured
      ? 'admin-tone-bg-danger'
      : 'admin-tone-bg-warning';
  const sourceLabel =
    config?.source === 'env'
      ? 'Railway'
      : config?.source === 'db'
        ? 'Admin'
        : 'Sense config';
  const setupModeLabel = config?.configured
    ? showForm
      ? 'Editant'
      : 'Actiu'
    : 'Pendent';
  const weakestLink = connection?.ok
    ? null
    : config?.configured
      ? 'Les credencials existeixen però la connexió IMAP no és operativa.'
      : 'La safata encara no té credencials mínimes per llegir correus.';
  const sourceNote =
    config?.source === 'env'
      ? 'Railway té prioritat sobre qualsevol valor desat des de l’admin.'
      : config?.source === 'db'
        ? 'La configuració actual viu a base de dades i es pot actualitzar des d’aquesta pantalla.'
        : 'Encara no hi ha cap font activa per a la safata IMAP.';
  const actionTitle = !config?.configured
    ? 'Completar la configuració mínima de la safata'
    : connection?.ok
      ? 'Mantenir la cadena estable i tornar a operativa'
      : 'Regularitzar la connexió abans de confiar en la safata';
  const actionDescription = !config?.configured
    ? 'Sense host, usuari i contrasenya no hi ha importació real de correus cap a l’Inbox.'
    : connection?.ok
      ? 'La base és bona: el següent pas útil és tornar a la safata o revisar integracions si vols ampliar la cadena.'
      : 'Abans d’obrir més automatismes o seguiments, cal validar credencials i provar connexió amb el servidor IMAP.';

  return (
    <div className="space-y-4">
      <EditorControlStrip
        overview={{
          eyebrow: 'Cobertura',
          title: 'Quin estat té ara mateix la safata IMAP',
          tone: connection?.ok ? 'success' : config?.configured ? 'warning' : 'default',
          stats: [
            { label: 'Connexió', value: connection?.ok ? 'OK' : config?.configured ? 'Error' : 'Pendent', tone: connection?.ok ? 'success' : 'warning' },
            { label: 'Font', value: sourceLabel, hint: config?.configured ? 'credencial principal' : 'sense origen actiu' },
            { label: 'Sessió', value: setupModeLabel, tone: showForm ? 'warning' : config?.configured ? 'success' : 'default' },
          ],
        }}
        status={{
          eyebrow: 'Estat',
          title: 'Què convé revisar abans de tocar correus',
          tone: connection?.ok ? 'info' : config?.configured ? 'warning' : 'default',
          items: [
            weakestLink ?? 'La safata pot llegir correus i la connexió IMAP està operativa.',
            sourceNote,
            connection?.ok
              ? 'La configuració actual respon correctament al test de connexió.'
              : connection?.error
                ? `Últim error detectat: ${connection.error}`
                : 'Encara no hi ha cap test de connexió operatiu amb aquesta configuració.',
          ],
        }}
        action={{
          eyebrow: 'Acció principal',
          title: actionTitle,
          description: actionDescription,
          tone: connection?.ok ? 'success' : 'warning',
          primaryAction: {
            href: connection?.ok ? '/admin/inbox' : '/admin/settings/integrations',
            label: connection?.ok ? 'Tornar a la safata' : 'Veure integracions',
          },
          secondaryAction: { href: '/admin/settings', label: 'Configuració' },
          secondaryPills: [
            config?.configured ? 'Credencials presents' : 'Sense credencials',
            config?.secure === false ? 'Sense SSL/TLS' : 'SSL/TLS',
          ],
        }}
      />

      {/* Estat de connexió */}
      <div className={`${connectionTone} rounded-2xl border p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`h-4 w-4 rounded-full ${connectionDot}`} />
            <div>
              <h2 className="font-semibold">
                {connection?.ok
                  ? 'IMAP connectat i operatiu'
                  : config?.configured
                    ? 'IMAP configurat pero amb error'
                    : 'IMAP no configurat'}
              </h2>
              {config?.source === 'env' && (
                <p className="mt-0.5 text-xs text-white/50">Font: variables d&apos;entorn (Railway)</p>
              )}
              {config?.source === 'db' && (
                <p className="mt-0.5 text-xs text-white/50">Font: base de dades (configurat des de l&apos;admin)</p>
              )}
            </div>
          </div>
          {connection?.ok && <span className="ap-badge ap-badge--success">ONLINE</span>}
        </div>
        {connection && !connection.ok && connection.error && (
          <p className="mt-2 text-sm admin-tone-text-danger">{connection.error}</p>
        )}
      </div>

      {/* Config actual */}
      {config?.configured && (
        <div className="rounded-2xl border p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">Configuració actual</h3>
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
              <span>{config.secure ? 'Si (port 993)' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Contrasenya</span>
              <span>........</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulari de configuració */}
      {!config?.configured || showForm ? (
        <div className="rounded-2xl border p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">
            {config?.configured ? 'Modificar configuració' : 'Configurar connexió IMAP'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="imap-host" className="mb-1 block text-xs font-medium">
                Servidor IMAP
              </label>
              <input
                id="imap-host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="imap.dondominio.com"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="imap-port" className="mb-1 block text-xs font-medium">
                Port
              </label>
              <input
                id="imap-port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="993"
                min={1}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="imap-user" className="mb-1 block text-xs font-medium">
                Usuari (email)
              </label>
              <input
                id="imap-user"
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="info@orbitaevents.com"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="imap-pass" className="mb-1 block text-xs font-medium">
                Contrasenya
              </label>
              <input
                id="imap-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="........"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
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
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? 'Desant...' : 'Desa i connecta'}
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
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Com funciona</h3>
        <ul className="space-y-1.5 text-sm text-white/70">
          <li>• La safata llegeix correus directament del servidor IMAP (DonDominio).</li>
          <li>• La safata mostra tots els correus disponibles al compte IMAP configurat.</li>
          <li>• Les credencials es guarden xifrades a la base de dades.</li>
          <li>• Si tens variables d&apos;entorn configurades a Railway, tenen prioritat.</li>
        </ul>
      </div>
    </div>
  );
}
