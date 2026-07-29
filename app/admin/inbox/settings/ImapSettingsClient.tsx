// app/admin/inbox/settings/ImapSettingsClient.tsx
// 100% canònic — .ap-card/.ap-btn/.ap-badge/.ap-inline-alert/.adm-input (eradicació classes pròpies d'òrgan)
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
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

const labelClass = 'text-xs font-bold uppercase tracking-[0.1em] text-[var(--t2)]';
const cardTitleClass = 'text-xs font-bold uppercase tracking-[0.08em] text-[var(--t3)]';

export default function ImapSettingsClient() {
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ImapConfig | null>(null);
  const [connection, setConnection] = useState<ConnectionResult | null>(null);

  const [host, setHost] = useState('');
  const [port, setPort] = useState('993');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  /* Firma */
  const [signature, setSignature] = useState('');
  const [savingSignature, setSavingSignature] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/settings');
      if (!res.ok) throw new Error('Error carregant config');
      const data = await res.json() as {
        config: ImapConfig | null;
        connection: ConnectionResult | null;
        signature?: string;
      };
      setConfig(data.config);
      setConnection(data.connection);
      setSignature(data.signature ?? '');
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

  const saveSignature = async () => {
    setSavingSignature(true);
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success('Firma desada');
      } else {
        toast.error(data.error || 'Error desant la firma');
      }
    } catch (err) {
      console.error('Error desant firma', err);
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSavingSignature(false);
    }
  };

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

  const deleteConfig = async () => {
    const ok = await confirm({
      title: 'Eliminar configuració IMAP',
      message: "S'eliminarà el compte configurat. La safata quedarà sense connexió fins que es torni a configurar.",
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    try {
      const res = await fetchWithCsrf('/api/admin/inbox/settings', { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        toast.success('Configuració IMAP eliminada');
        setConfig(null);
        setConnection(null);
        setHost('');
        setPort('993');
        setUser('');
        setPass('');
        setShowForm(false);
      } else {
        toast.error(data.error || 'Error eliminant');
      }
    } catch (err) {
      console.error('Error eliminant configuració IMAP', err);
      toast.error(err instanceof Error ? err.message : 'Error');
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
        setConnection(data.connection?.ok ? { ok: true } : { ok: false, error: data.connection?.error });
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
      <div className="ap-card">
        <div className="ap-card-body flex items-center gap-2.5 text-sm text-[var(--t2)]" role="status">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--line2)] border-t-[var(--gold)]" />
          Carregant configuració...
        </div>
      </div>
    );
  }

  const alertVariant = connection?.ok
    ? 'success'
    : config?.configured
      ? 'danger'
      : 'warning';

  const dotClass = connection?.ok
    ? 'bg-[var(--at-green)]'
    : config?.configured
      ? 'bg-[var(--at-red)]'
      : 'bg-[var(--at-orange)]';

  const connTitle = connection?.ok
    ? 'IMAP connectat i operatiu'
    : config?.configured
      ? 'IMAP configurat però amb error'
      : 'IMAP no configurat';

  const sourceLabel =
    config?.source === 'env' ? 'Variables Railway' :
    config?.source === 'db' ? 'Configurat des de l\'admin' :
    null;

  const configRows: [string, string][] = config?.configured
    ? [
        ['Servidor', config.host],
        ['Port', String(config.port)],
        ['Usuari', config.user],
        ['SSL/TLS', config.secure ? 'Sí (port 993)' : 'No'],
        ['Contrasenya', '••••••••'],
      ]
    : [];

  return (
    <>
      {/* Estat de connexió */}
      <div className={`ap-inline-alert ap-inline-alert--${alertVariant}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
            <div>
              <p className="font-semibold text-[var(--t)]">{connTitle}</p>
              {sourceLabel && <p className="mt-0.5 text-xs text-[var(--t3)]">{sourceLabel}</p>}
            </div>
          </div>
          {connection?.ok && <span className="ap-badge ap-badge--success">ONLINE</span>}
        </div>
        {connection && !connection.ok && connection.error && (
          <p className="mt-2.5 text-[var(--t)]">{connection.error}</p>
        )}
      </div>

      {/* Config actual */}
      {config?.configured && (
        <section className="ap-card">
          <div className="ap-card-body">
            <p className={cardTitleClass}>Configuració actual</p>
            <div className="mt-3.5 grid gap-2.5">
              {configRows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-[var(--line2)] pb-2.5 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-[var(--t3)]">{label}</span>
                  <span className="font-mono text-[var(--t)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Formulari de configuració */}
      {!config?.configured || showForm ? (
        <section className="ap-card">
          <div className="ap-card-body">
            <p className={cardTitleClass}>
              {config?.configured ? 'Modificar configuració' : 'Configurar connexió IMAP'}
            </p>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="imap-host" className={labelClass}>Servidor IMAP</label>
                <input
                  id="imap-host"
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="imap.dondominio.com"
                  className="adm-input"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="imap-port" className={labelClass}>Port</label>
                <input
                  id="imap-port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="993"
                  min={1}
                  className="adm-input"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="imap-user" className={labelClass}>Usuari (email)</label>
                <input
                  id="imap-user"
                  type="email"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="info@orbitaevents.com"
                  className="adm-input"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="imap-pass" className={labelClass}>Contrasenya</label>
                <input
                  id="imap-pass"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="adm-input"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={testing}
                onClick={testConnection}
                className="ap-btn ap-btn--secondary"
              >
                {testing ? 'Provant...' : 'Provar connexió'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveConfig}
                className="ap-btn ap-btn--primary"
              >
                {saving ? 'Desant...' : 'Desa i connecta'}
              </button>
              {showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="ap-btn ap-btn--secondary"
                >
                  Cancel·lar
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="ap-btn ap-btn--secondary"
          >
            Modificar configuració
          </button>
          {config?.source === 'db' && (
            <button
              type="button"
              onClick={deleteConfig}
              className="ap-btn ap-btn--danger"
            >
              Eliminar configuració
            </button>
          )}
        </div>
      )}

      {/* Firma de mail */}
      <section className="ap-card">
        <div className="ap-card-body">
          <p className={cardTitleClass}>Firma de mail</p>
          <p className="mt-2 text-xs text-[var(--t3)]">
            Text que apareix al peu de tots els emails enviats des de l&apos;admin. Si és buit, s&apos;usa la firma per defecte (nom, telèfon, web).
          </p>
          <div className="mt-3.5 grid gap-1.5">
            <label htmlFor="email-signature" className={labelClass}>Text de la firma</label>
            <textarea
              id="email-signature"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder={`Òrbita Events\n+34 XXX XXX XXX · info@orbitaevents.com\nwww.orbitaevents.com`}
              rows={5}
              className="adm-input adm-input--textarea"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={savingSignature}
              onClick={saveSignature}
              className="ap-btn ap-btn--primary"
            >
              {savingSignature ? 'Desant...' : 'Desar firma'}
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog {...dialogProps} />

      {/* Com funciona */}
      <section className="ap-card">
        <div className="ap-card-body">
          <p className={cardTitleClass}>Com funciona</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--t2)]">
            <li>• La safata llegeix correus directament del servidor IMAP (DonDominio).</li>
            <li>• Les credencials es guarden xifrades a la base de dades.</li>
            <li>• Si tens variables d&apos;entorn configurades a Railway, tenen prioritat.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
