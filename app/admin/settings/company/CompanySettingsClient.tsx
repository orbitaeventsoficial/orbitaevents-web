'use client';

import { useState, useCallback } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

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
  { key: 'company.address', label: 'Adreca fiscal', type: 'text', placeholder: 'C/ Exemple, 1' },
  { key: 'company.city', label: 'Ciutat', type: 'text', placeholder: 'Barcelona' },
  { key: 'company.postalCode', label: 'Codi postal', type: 'text', placeholder: '08001' },
  { key: 'company.iban', label: 'IBAN', type: 'text', placeholder: 'ES00 0000 0000 0000 0000 0000', description: 'Apareix als contractes i factures' },
  { key: 'company.bankName', label: 'Nom del banc', type: 'text', placeholder: 'La Caixa' },
];

const HOLDED_API_FIELD: FieldDef = {
  key: 'holded.apiKey',
  label: 'API Key',
  type: 'password',
  placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  description: 'Obten-la des de Holded > Configuracio > API',
};

const INPUT = 'ap-input';

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
      const res = await fetchWithCsrf('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Error desant');
      setMessage({ type: 'ok', text: 'Configuracio desada correctament' });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error desant la configuracio' });
    } finally {
      setSaving(false);
    }
  }, [values]);

  const testHolded = useCallback(async () => {
    setTestingHolded(true);
    setMessage(null);
    try {
      const res = await fetchWithCsrf('/api/admin/invoices?limit=1');
      if (res.ok) {
        setMessage({ type: 'ok', text: 'Connexio amb Holded funciona correctament' });
      } else {
        setMessage({ type: 'error', text: "No s'ha pogut connectar amb Holded" });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error de connexio' });
    } finally {
      setTestingHolded(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      <section className="ap-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border">🏢</div>
          <div>
            <h2 className="ap-h2">Dades fiscals</h2>
            <p className="text-sm">Apareixen als contractes, factures i pressupostos</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPANY_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-medium">{field.label}</label>
              <input
                type="text"
                value={values[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={INPUT}
              />
              {field.description && <p className="mt-1 text-xs">{field.description}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="ap-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border">📊</div>
          <div>
            <h2 className="ap-h2">Integracio Holded</h2>
            <p className="text-sm">Sincronitza factures automaticament amb Holded</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Sincronitzacio activa</p>
            <p className="mt-0.5 text-xs">
              {holdedEnabled ? 'Les factures es sincronitzen automaticament' : 'La sincronitzacio esta desactivada'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={holdedEnabled}
            onClick={toggleHolded}
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
              holdedEnabled ? 'admin-tone-bg-success admin-tone-border-success' : 'admin-tone-idle'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-[var(--o-admin-light)] shadow-sm transition-transform duration-200 ${
                holdedEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">{HOLDED_API_FIELD.label}</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={values[HOLDED_API_FIELD.key] || ''}
              onChange={(e) => handleChange(HOLDED_API_FIELD.key, e.target.value)}
              placeholder={HOLDED_API_FIELD.placeholder}
              className="ap-input pr-20 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs transition-colors admin-tone-idle"
            >
              {showApiKey ? 'Amagar' : 'Mostrar'}
            </button>
          </div>
          <p className="mt-1 text-xs">{HOLDED_API_FIELD.description}</p>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={testHolded}
            disabled={testingHolded || !values['holded.apiKey']}
            className="ap-btn ap-btn--secondary disabled:opacity-50"
          >
            {testingHolded ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Provant...
              </>
            ) : (
              'Provar connexio'
            )}
          </button>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="button" onClick={save} disabled={saving} className="ap-btn ap-btn--primary disabled:opacity-50">
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Desant...
            </>
          ) : (
            'Desar configuracio'
          )}
        </button>
        {message && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm ${
              message.type === 'ok'
                ? 'admin-tone-soft-success admin-tone-border-success admin-tone-text-success'
                : 'admin-tone-soft-danger admin-tone-border-danger admin-tone-text-danger'
            }`}
          >
            <span>{message.type === 'ok' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
