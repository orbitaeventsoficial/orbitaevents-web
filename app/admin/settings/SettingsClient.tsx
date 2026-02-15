'use client';

import { useMemo, useState } from 'react';

type Setting = {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category: string;
  label?: string | null;
  description?: string | null;
  updatedAt: string;
};

type CategoryConfig = Record<string, { label: string; icon: string; description: string }>;

const TYPE_LABELS: Record<Setting['type'], string> = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
};

// Keys que contenen dades sensibles que s\'han d'amagar
const SENSITIVE_KEYS = ['refreshToken', 'accessToken', 'secret', 'password', 'apiKey'];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some(sensitive =>
    key.toLowerCase().includes(sensitive.toLowerCase())
  );
}

function formatDisplay(setting: Setting): string {
  // Amagar valors sensibles
  if (isSensitiveKey(setting.key) && setting.value) {
    return '••••••••••••••••';
  }

  if (setting.type === 'NUMBER') {
    const num = Number(setting.value);
    if (Number.isNaN(num)) return setting.value;
    // No aplicar format de milers per a anys (valors entre 1900 i 2100)
    if (num >= 1900 && num <= 2100) {
      return String(num);
    }
    return num.toLocaleString('ca-ES');
  }
  if (setting.type === 'BOOLEAN') {
    return setting.value === 'true' ? 'Si' : 'No';
  }
  return setting.value;
}

function coerceValue(type: Setting['type'], raw: string): string | number | boolean {
  if (type === 'NUMBER') {
    const num = Number(raw.replace(',', '.'));
    return Number.isNaN(num) ? 0 : num;
  }
  if (type === 'BOOLEAN') {
    return raw === 'true';
  }
  if (type === 'JSON') {
    return JSON.parse(raw);
  }
  return raw;
}

export default function SettingsClient({
  groupedSettings,
  categoryConfig,
}: {
  groupedSettings: Record<string, Setting[]>;
  categoryConfig: CategoryConfig;
}) {
  const [settings, setSettings] = useState(groupedSettings);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsFlat = useMemo(
    () =>
      Object.values(settings).flat().reduce<Record<string, Setting>>((acc, s) => {
        acc[s.key] = s;
        return acc;
      }, {}),
    [settings]
  );

  const startEdit = (setting: Setting) => {
    setError(null);
    setEditingKey(setting.key);
    setDraftValue(setting.value ?? '');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraftValue('');
    setError(null);
  };

  const saveSetting = async (setting: Setting) => {
    setError(null);
    setSavingKey(setting.key);
    try {
      let value: string | number | boolean;
      try {
        value = coerceValue(setting.type, draftValue);
      } catch {
        setError('JSON invalid');
        setSavingKey(null);
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [{ key: setting.key, value }],
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Error guardant configuracio');
      }

      setSettings((prev) => {
        const next = { ...prev };
        const list = next[setting.category] || [];
        next[setting.category] = list.map((item) =>
          item.key === setting.key
            ? { ...item, value: String(value), updatedAt: new Date().toISOString() }
            : item
        );
        return next;
      });

      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardant configuracio');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300" role="alert">
          {error}
        </div>
      )}

      {Object.entries(settings).map(([category, categorySettings]) => {
        const config = categoryConfig[category] || {
          label: category,
          icon: '??',
          description: '',
        };

        return (
          <section
            key={category}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden"
          >
            <div className="bg-slate-700/30 border-b border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <h2 className="font-semibold text-slate-100">{config.label}</h2>
                  <p className="text-sm text-slate-400">{config.description}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-700/30">
              {categorySettings.map((setting) => {
                const isEditing = editingKey === setting.key;
                const isSaving = savingKey === setting.key;
                const current = settingsFlat[setting.key];

                return (
                  <div
                    key={setting.id}
                    className="p-4 hover:bg-slate-700/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                            {setting.key}
                          </code>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              setting.type === 'NUMBER'
                                ? 'bg-blue-500/20 text-blue-300'
                                : setting.type === 'BOOLEAN'
                                ? 'bg-purple-500/20 text-purple-300'
                                : setting.type === 'JSON'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {TYPE_LABELS[setting.type]}
                          </span>
                        </div>
                        {setting.label && (
                          <p className="mt-1 font-medium text-slate-200">{setting.label}</p>
                        )}
                        {setting.description && (
                          <p className="text-sm text-slate-400">{setting.description}</p>
                        )}
                      </div>

                      <div className="text-right">
                        {isEditing ? (
                          <div className="space-y-2">
                            {setting.type === 'BOOLEAN' ? (
                              <select
                                className="rounded-lg border border-slate-600/50 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                value={draftValue || 'false'}
                                onChange={(e) => setDraftValue(e.target.value)}
                              >
                                <option value="true">Si</option>
                                <option value="false">No</option>
                              </select>
                            ) : setting.type === 'JSON' ? (
                              <textarea
                                className="rounded-lg border border-slate-600/50 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-100 w-64 h-24 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                value={draftValue}
                                onChange={(e) => setDraftValue(e.target.value)}
                              />
                            ) : (
                              <input
                                className="rounded-lg border border-slate-600/50 bg-slate-800/80 px-3 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                type={setting.type === 'NUMBER' ? 'number' : 'text'}
                                value={draftValue}
                                onChange={(e) => setDraftValue(e.target.value)}
                              />
                            )}

                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                                onClick={cancelEdit}
                                disabled={isSaving}
                                type="button"
                              >
                                Cancel·lar
                              </button>
                              <button
                                className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-colors"
                                onClick={() => saveSetting(setting)}
                                disabled={isSaving}
                                type="button"
                                aria-busy={isSaving}
                              >
                                {isSaving ? 'Guardant...' : 'Desar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-semibold text-slate-100">
                              {formatDisplay(current)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Actualitzat:{' '}
                              {new Date(current.updatedAt).toLocaleDateString('ca-ES')}
                            </p>
                            <button
                              className="mt-2 text-xs px-3 py-1.5 rounded-lg border border-slate-600/50 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                              onClick={() => startEdit(current)}
                              type="button"
                            >
                              Editar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}


