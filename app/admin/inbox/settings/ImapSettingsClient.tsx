// app/admin/inbox/settings/ImapSettingsClient.tsx
// Canvi #802 — extirpació ap-*/admin-tone-*, reconstrucció ix__settings* classes
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
      <div className="ix__settings-loading" role="status">
        <span className="ix__settings-spinner" />
        Carregant configuració...
      </div>
    );
  }

  const connClass = connection?.ok
    ? 'ix__connstat is-ok'
    : config?.configured
      ? 'ix__connstat is-error'
      : 'ix__connstat is-pending';

  const connTitle = connection?.ok
    ? 'IMAP connectat i operatiu'
    : config?.configured
      ? 'IMAP configurat però amb error'
      : 'IMAP no configurat';

  const sourceLabel =
    config?.source === 'env' ? 'Variables Railway' :
    config?.source === 'db' ? 'Configurat des de l\'admin' :
    null;

  return (
    <>
      {/* Estat de connexió */}
      <div className={connClass}>
        <div className="ix__connstat-header">
          <div className="ix__connstat-left">
            <span className="ix__connstat-dot" />
            <div>
              <p className="ix__connstat-title">{connTitle}</p>
              {sourceLabel && <p className="ix__connstat-source">{sourceLabel}</p>}
            </div>
          </div>
          {connection?.ok && <span className="ix__connstat-badge">ONLINE</span>}
        </div>
        {connection && !connection.ok && connection.error && (
          <p className="ix__connstat-error">{connection.error}</p>
        )}
      </div>

      {/* Config actual */}
      {config?.configured && (
        <div className="ix__configcard">
          <p className="ix__configcard-title">Configuració actual</p>
          <div className="ix__configrow">
            <span className="ix__configlabel">Servidor</span>
            <span className="ix__configval">{config.host}</span>
          </div>
          <div className="ix__configrow">
            <span className="ix__configlabel">Port</span>
            <span className="ix__configval">{config.port}</span>
          </div>
          <div className="ix__configrow">
            <span className="ix__configlabel">Usuari</span>
            <span className="ix__configval">{config.user}</span>
          </div>
          <div className="ix__configrow">
            <span className="ix__configlabel">SSL/TLS</span>
            <span className="ix__configval">{config.secure ? 'Sí (port 993)' : 'No'}</span>
          </div>
          <div className="ix__configrow">
            <span className="ix__configlabel">Contrasenya</span>
            <span className="ix__configval">••••••••</span>
          </div>
        </div>
      )}

      {/* Formulari de configuració */}
      {!config?.configured || showForm ? (
        <div className="ix__formcard">
          <p className="ix__formcard-title">
            {config?.configured ? 'Modificar configuració' : 'Configurar connexió IMAP'}
          </p>
          <div className="ix__formgrid">
            <div className="ix__formfield">
              <label htmlFor="imap-host" className="ix__formlabel">Servidor IMAP</label>
              <input
                id="imap-host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="imap.dondominio.com"
                className="ix__forminput"
              />
            </div>
            <div className="ix__formfield">
              <label htmlFor="imap-port" className="ix__formlabel">Port</label>
              <input
                id="imap-port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="993"
                min={1}
                className="ix__forminput"
              />
            </div>
            <div className="ix__formfield">
              <label htmlFor="imap-user" className="ix__formlabel">Usuari (email)</label>
              <input
                id="imap-user"
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="info@orbitaevents.com"
                className="ix__forminput"
              />
            </div>
            <div className="ix__formfield">
              <label htmlFor="imap-pass" className="ix__formlabel">Contrasenya</label>
              <input
                id="imap-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="ix__forminput"
              />
            </div>
          </div>
          <div className="ix__formactions">
            <button
              type="button"
              disabled={testing}
              onClick={testConnection}
              className="ix__settingsbtn"
            >
              {testing ? 'Provant...' : 'Provar connexió'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveConfig}
              className="ix__settingsbtn is-primary"
            >
              {saving ? 'Desant...' : 'Desa i connecta'}
            </button>
            {showForm && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ix__settingsbtn"
              >
                Cancel·lar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="ix__formactions">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="ix__settingsbtn"
          >
            Modificar configuració
          </button>
          {config?.source === 'db' && (
            <button
              type="button"
              onClick={deleteConfig}
              className="ix__settingsbtn is-danger"
            >
              Eliminar configuració
            </button>
          )}
        </div>
      )}

      {/* Firma de mail */}
      <div className="ix__formcard">
        <p className="ix__formcard-title">Firma de mail</p>
        <p className="ix__formcard-hint">
          Text que apareix al peu de tots els emails enviats des de l&apos;admin. Si és buit, s&apos;usa la firma per defecte (nom, telèfon, web).
        </p>
        <div className="ix__formfield ix__formfield--signature">
          <label htmlFor="email-signature" className="ix__formlabel">Text de la firma</label>
          <textarea
            id="email-signature"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder={`Òrbita Events\n+34 XXX XXX XXX · info@orbitaevents.com\nwww.orbitaevents.com`}
            rows={5}
            className="ix__forminput ix__forminput--textarea"
          />
        </div>
        <div className="ix__formactions">
          <button
            type="button"
            disabled={savingSignature}
            onClick={saveSignature}
            className="ix__settingsbtn is-primary"
          >
            {savingSignature ? 'Desant...' : 'Desar firma'}
          </button>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />

      {/* Com funciona */}
      <div className="ix__howto">
        <p className="ix__howto-title">Com funciona</p>
        <ul className="ix__howto-list">
          <li className="ix__howto-item">• La safata llegeix correus directament del servidor IMAP (DonDominio).</li>
          <li className="ix__howto-item">• Les credencials es guarden xifrades a la base de dades.</li>
          <li className="ix__howto-item">• Si tens variables d&apos;entorn configurades a Railway, tenen prioritat.</li>
        </ul>
      </div>
    </>
  );
}
