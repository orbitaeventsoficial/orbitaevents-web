'use client';

/**
 * CODIS DE DESCOMPTE - Gestió de codis promocionals
 * Creació, llistat, activació/desactivació
 * No acumulable amb descomptes web (per defecte)
 */

import { useCallback, useEffect, useState } from 'react';

type DiscountCode = {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  description: string | null;
  validFrom: string;
  validUntil: string;
  maxUses: number | null;
  currentUses: number;
  minOrderValue: number | null;
  isAccumulative: boolean;
  sourceType: string | null;
  isActive: boolean;
  createdAt: string;
};

type Stats = {
  total: number;
  active: number;
  expired: number;
  totalUses: number;
};

type FormData = {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  description: string;
  validUntil: string;
  maxUses: string;
  minOrderValue: string;
  isAccumulative: boolean;
};

const INITIAL_FORM: FormData = {
  code: '',
  type: 'PERCENTAGE',
  value: '10',
  description: '',
  validUntil: '',
  maxUses: '',
  minOrderValue: '',
  isAccumulative: false,
};

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discount-codes');
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
        setStats(data.stats || null);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.code || !form.value || !form.validUntil) {
      setError('Codi, valor i data de caducitat són obligatoris');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = {
        code: form.code.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        description: form.description.trim() || undefined,
        validUntil: form.validUntil,
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : undefined,
        isAccumulative: form.isAccumulative,
      };

      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error creant codi');
      }

      setSuccessMsg(`Codi "${form.code.toUpperCase()}" creat correctament`);
      setForm(INITIAL_FORM);
      setShowForm(false);
      loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/discount-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _action: 'toggle', id, isActive: !active }),
      });
      loadCodes();
    } catch {
      // Silent
    }
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
            Codis de descompte
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestiona codis promocionals per a reserves
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
        >
          {showForm ? 'Tancar' : '+ Nou codi'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase">Total codis</p>
            <p className="mt-2 text-3xl font-bold text-slate-100">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs font-medium text-emerald-400 uppercase">Actius</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <p className="text-xs font-medium text-rose-400 uppercase">Caducats</p>
            <p className="mt-2 text-3xl font-bold text-rose-300">{stats.expired}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-medium text-amber-400 uppercase">Usos totals</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{stats.totalUses}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-emerald-200 text-sm">{successMsg}</p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Nou codi de descompte</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-400">Codi *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="BODA2026"
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Tipus</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('type', 'PERCENTAGE')}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                    form.type === 'PERCENTAGE'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Percentatge %
                </button>
                <button
                  type="button"
                  onClick={() => updateField('type', 'FIXED_AMOUNT')}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${
                    form.type === 'FIXED_AMOUNT'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Import fix
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">
                Valor * {form.type === 'PERCENTAGE' ? '(%)' : '(€)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => updateField('value', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-400">Vàlid fins *</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => updateField('validUntil', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Usos màxims</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => updateField('maxUses', e.target.value)}
                placeholder="Il·limitat"
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Comanda mínima (€)</label>
              <input
                type="number"
                value={form.minOrderValue}
                onChange={(e) => updateField('minOrderValue', e.target.value)}
                placeholder="Sense mínim"
                className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Descripció</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descripció interna del codi..."
              className="mt-1 w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAccumulative}
                onChange={(e) => updateField('isAccumulative', e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Acumulable amb descomptes web</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting || !form.code || !form.value || !form.validUntil}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creant...' : 'Crear codi'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-600/50 transition-colors"
            >
              Cancel·lar
            </button>
          </div>
        </div>
      )}

      {/* Codes table */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Codi</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Tipus</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Valor</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Vàlid fins</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Usos</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Acumulable</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {codes.map((c) => {
                const expired = isExpired(c.validUntil);
                const maxReached = c.maxUses != null && c.currentUses >= c.maxUses;
                return (
                  <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-slate-700/50 text-cyan-300 px-2 py-1 rounded">
                        {c.code}
                      </code>
                      {c.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{c.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {c.type === 'PERCENTAGE' ? 'Percentatge' : 'Import fix'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : `${c.value}€`}
                    </td>
                    <td className={`px-4 py-3 ${expired ? 'text-rose-400' : 'text-slate-300'}`}>
                      {new Date(c.validUntil).toLocaleDateString('ca-ES')}
                      {expired && <span className="block text-[10px]">Caducat</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {c.currentUses}{c.maxUses ? ` / ${c.maxUses}` : ''}
                      {maxReached && <span className="block text-[10px] text-rose-400">Exhaurit</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.isActive && !expired && !maxReached
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {c.isActive && !expired && !maxReached ? 'Actiu' : 'Inactiu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {c.isAccumulative ? 'Sí' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(c.id, c.isActive)}
                        className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
                      >
                        {c.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {codes.length === 0 && (
          <div className="p-12 text-center">
            <span className="text-4xl">🎟️</span>
            <p className="mt-4 text-slate-300">No hi ha codis de descompte</p>
            <p className="text-sm text-slate-500">Crea el primer codi per oferir promocions</p>
          </div>
        )}
      </div>
    </div>
  );
}
