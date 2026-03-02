'use client';

import { useState, useCallback } from 'react';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder?: string;
  description?: string;
}

const COMPANY_FIELDS: FieldDef[] = [
  { key: 'company.name', label: 'Nom comercial', type: 'text', placeholder: 'Orbita Events' },
  { key: 'company.legalName', label: 'Nom legal', type: 'text', placeholder: 'Orbita Events S.L.' },
  { key: 'company.nif', label: 'NIF / CIF', type: 'text', placeholder: 'B12345678' },
  { key: 'company.address', label: 'Adreca fiscal', type: 'text', placeholder: "C/ Exemple, 1" },
  { key: 'company.city', label: 'Ciutat', type: 'text', placeholder: 'Barcelona' },
  { key: 'company.postalCode', label: 'Codi postal', type: 'text', placeholder: '08001' },
  { key: 'company.iban', label: 'IBAN', type: 'text', placeholder: 'ES00 0000 0000 0000 0000 0000', description: 'Apareix als contractes i factures' },
  { key: 'company.bankName', label: 'Nom del banc', type: 'text', placeholder: 'La Caixa' },
];

const HOLDED_API_FIELD: FieldDef = {
  key: 'holded.apiKey', label: 'API Key', type: 'password', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', description: "Obten-la des de Holded > Configuracio > API",
};

export default function CompanySettingsClient({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [testingHolded, setTestingHolded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const holdedEnabled = values['holded.enabled'] === 'true';

  const handleChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }, []);

  const toggleHolded = useCallback(() => {
    setValues((prev) => ({ ...prev, 'holded.enabled': prev['holded.enabled'] === 'true' ? 'false' : 'true' }));
    setMessage(null);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const settings = Object.entries(values).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Error desant');
      setMessage({ type: 'ok', text: 'Configuracio desada correctament' });
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage({ type: 'error', text: 'Error desant la configuracio' });
    } finally {
      setSaving(false);
    }
  }, [values]);

  const testHolded = useCallback(async () => {
    setTestingHolded(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/invoices?limit=1');
      if (res.ok) {
        setMessage({ type: 'ok', text: 'Connexio amb Holded funciona correctament' });
      } else {
        setMessage({ type: 'error', text: "No s'ha pogut connectar amb Holded" });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de connexio' });
    } finally {
      setTestingHolded(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Dades Empresa */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
            <span className="text-lg">🏢</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Dades fiscals</h2>
            <p className="text-sm text-white/50">Apareixen als contractes, factures i pressupostos</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPANY_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
              <input
                type="text"
                value={values[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm transition-colors focus:border-cyan-500/40 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
              {field.description && (
                <p className="mt-1 text-[11px] text-white/35">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Holded */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Integracio Holded</h2>
            <p className="text-sm text-white/50">Sincronitza factures automaticament amb Holded</p>
          </div>
        </div>

        {/* Toggle switch */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-medium">Sincronitzacio activa</p>
            <p className="text-xs text-white/40 mt-0.5">
              {holdedEnabled ? 'Les factures es sincronitzen automaticament' : 'La sincronitzacio esta desactivada'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={holdedEnabled}
            onClick={toggleHolded}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
              holdedEnabled ? 'bg-emerald-500' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                holdedEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">{HOLDED_API_FIELD.label}</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={values[HOLDED_API_FIELD.key] || ''}
              onChange={(e) => handleChange(HOLDED_API_FIELD.key, e.target.value)}
              placeholder={HOLDED_API_FIELD.placeholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 pr-20 text-sm font-mono transition-colors focus:border-cyan-500/40 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              {showApiKey ? 'Amagar' : 'Mostrar'}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-white/35">{HOLDED_API_FIELD.description}</p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={testHolded}
            disabled={testingHolded || !values['holded.apiKey']}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingHolded ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
                Provant...
              </>
            ) : (
              'Provar connexio'
            )}
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Desant...
            </>
          ) : (
            'Desar configuracio'
          )}
        </button>
        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${
            message.type === 'ok'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <span>{message.type === 'ok' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
