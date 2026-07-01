'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

type Category = 'leads' | 'reports' | 'urgent';

interface Recipient {
  email: string;
  label: string;
  categories: Category[];
  active: boolean;
}

const CATEGORY_LABELS: Record<Category, { title: string; hint: string }> = {
  leads: { title: 'Leads', hint: 'Nou contacte del formulari web' },
  reports: { title: 'Informes', hint: 'Resum diari, setmanal i executiu' },
  urgent: { title: 'Urgents', hint: 'Follow-ups crítics i alertes' },
};

const ALL_CATEGORIES: Category[] = ['leads', 'reports', 'urgent'];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RecipientsManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const loadRecipients = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/admin/settings/notification-recipients');
      const data = await res.json();
      if (data?.ok && Array.isArray(data.recipients)) {
        setRecipients(data.recipients);
      }
    } catch (error) {
      log.error('Error loading notification recipients', error);
      setStatus({ kind: 'error', message: 'No s\'ha pogut carregar la llista' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const markDirty = () => {
    setDirty(true);
    setStatus(null);
  };

  const toggleCategory = (email: string, category: Category) => {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.email !== email) return r;
        const has = r.categories.includes(category);
        return {
          ...r,
          categories: has ? r.categories.filter((c) => c !== category) : [...r.categories, category],
        };
      })
    );
    markDirty();
  };

  const toggleActive = (email: string) => {
    setRecipients((prev) => prev.map((r) => (r.email === email ? { ...r, active: !r.active } : r)));
    markDirty();
  };

  const updateLabel = (email: string, label: string) => {
    setRecipients((prev) => prev.map((r) => (r.email === email ? { ...r, label } : r)));
    markDirty();
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
    markDirty();
  };

  const addRecipient = () => {
    const email = newEmail.trim().toLowerCase();
    const label = newLabel.trim();
    if (!isValidEmail(email)) {
      setStatus({ kind: 'error', message: 'L\'email no és vàlid' });
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      setStatus({ kind: 'error', message: 'Aquest email ja és a la llista' });
      return;
    }
    setRecipients((prev) => [
      ...prev,
      { email, label, categories: [...ALL_CATEGORIES], active: true },
    ]);
    setNewEmail('');
    setNewLabel('');
    markDirty();
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetchWithCsrf('/api/admin/settings/notification-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Error desant');
      setRecipients(data.recipients);
      setDirty(false);
      setStatus({ kind: 'ok', message: 'Destinataris desats correctament' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Error desconegut',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="ap-card p-6 shadow-sm">
        <h2 className="mb-4 ap-h2">📬 Destinataris de notificacions</h2>
        <p className="text-sm text-[var(--t2)]">Carregant…</p>
      </section>
    );
  }

  return (
    <section className="ap-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="ap-h2">📬 Destinataris de notificacions</h2>
          <p className="text-sm text-[var(--t2)]">
            Gestiona quins correus reben cada tipus de notificació. Els canvis sobreescriuen el fallback de Railway.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="ap-btn ap-btn--primary disabled:opacity-50"
        >
          {saving ? 'Desant…' : dirty ? 'Desar canvis' : 'Desat'}
        </button>
      </div>

      {status && (
        <div
          className={`mb-4 ap-card p-3 text-sm ${
            status.kind === 'ok'
              ? 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
              : 'admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger'
          }`}
          role={status.kind === 'ok' ? 'status' : 'alert'}
        >
          {status.message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left">
              <th scope="col" className="px-2 py-2 font-medium">Email</th>
              <th scope="col" className="px-2 py-2 font-medium">Etiqueta</th>
              {ALL_CATEGORIES.map((c) => (
                <th key={c} scope="col" className="px-2 py-2 text-center font-medium" title={CATEGORY_LABELS[c].hint}>
                  {CATEGORY_LABELS[c].title}
                </th>
              ))}
              <th scope="col" className="px-2 py-2 text-center font-medium">Actiu</th>
              <th scope="col" className="px-2 py-2 text-center font-medium" aria-label="Accions" />
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 && (
              <tr>
                <td colSpan={ALL_CATEGORIES.length + 4} className="px-2 py-4 text-center text-[var(--t2)]">
                  No hi ha destinataris. Afegeix-ne almenys un per rebre notificacions.
                </td>
              </tr>
            )}
            {recipients.map((r) => (
              <tr key={r.email} className="border-b border-[var(--line)]">
                <td className="px-2 py-2 font-mono text-xs">{r.email}</td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={r.label}
                    onChange={(e) => updateLabel(r.email, e.target.value)}
                    placeholder="p. ex. Info oficial"
                    className="w-full rounded border border-[var(--line)] bg-[var(--raised)] px-2 py-1 text-sm"
                  />
                </td>
                {ALL_CATEGORIES.map((c) => (
                  <td key={c} className="px-2 py-2 text-center">
                    <label className="inline-flex cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={r.categories.includes(c)}
                        onChange={() => toggleCategory(r.email, c)}
                        className="h-4 w-4 cursor-pointer"
                        aria-label={`${CATEGORY_LABELS[c].title} per ${r.email}`}
                      />
                    </label>
                  </td>
                ))}
                <td className="px-2 py-2 text-center">
                  <label className="inline-flex cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={() => toggleActive(r.email)}
                      className="h-4 w-4 cursor-pointer"
                      aria-label={`Actiu per ${r.email}`}
                    />
                  </label>
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRecipient(r.email)}
                    className="text-xs admin-tone-text-danger hover:admin-tone-text-danger"
                    aria-label={`Eliminar ${r.email}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <h3 className="mb-2 text-sm font-medium">Afegir destinatari</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 min-w-[200px] flex-col gap-1">
            <span className="text-xs uppercase text-[var(--t2)]">Email</span>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nou@example.com"
              className="rounded border border-[var(--line)] bg-[var(--raised)] px-2 py-2 text-sm"
            />
          </label>
          <label className="flex flex-1 min-w-[180px] flex-col gap-1">
            <span className="text-xs uppercase text-[var(--t2)]">Etiqueta (opcional)</span>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="p. ex. Comercial"
              className="rounded border border-[var(--line)] bg-[var(--raised)] px-2 py-2 text-sm"
            />
          </label>
          <button type="button" onClick={addRecipient} className="ap-btn ap-btn--primary">
            Afegir
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--t2)]">
          Nou destinatari es crea amb totes les categories activades. Desa els canvis perquè tinguin efecte.
        </p>
      </div>
    </section>
  );
}
