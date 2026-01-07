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

function formatDisplay(setting: Setting): string {
  if (setting.type === 'NUMBER') {
    const num = Number(setting.value);
    if (Number.isNaN(num)) return setting.value;
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div>
                  <h2 className="font-semibold text-slate-700">{config.label}</h2>
                  <p className="text-sm text-slate-500">{config.description}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {categorySettings.map((setting) => {
                const isEditing = editingKey === setting.key;
                const isSaving = savingKey === setting.key;
                const current = settingsFlat[setting.key];

                return (
                  <div
                    key={setting.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded">
                            {setting.key}
                          </code>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              setting.type === 'NUMBER'
                                ? 'bg-blue-100 text-blue-700'
                                : setting.type === 'BOOLEAN'
                                ? 'bg-purple-100 text-purple-700'
                                : setting.type === 'JSON'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-stone-100 text-slate-600'
                            }`}
                          >
                            {TYPE_LABELS[setting.type]}
                          </span>
                        </div>
                        {setting.label && (
                          <p className="mt-1 font-medium text-slate-700">{setting.label}</p>
                        )}
                        {setting.description && (
                          <p className="text-sm text-slate-500">{setting.description}</p>
                        )}
                      </div>

                      <div className="text-right">
                        {isEditing ? (
                          <div className="space-y-2">
                            {setting.type === 'BOOLEAN' ? (
                              <select
                                className="border rounded px-2 py-1 text-sm"
                                value={draftValue || 'false'}
                                onChange={(e) => setDraftValue(e.target.value)}
                              >
                                <option value="true">Si</option>
                                <option value="false">No</option>
                              </select>
                            ) : setting.type === 'JSON' ? (
                              <textarea
                                className="border rounded px-2 py-1 text-sm w-64 h-24"
                                value={draftValue}
                                onChange={(e) => setDraftValue(e.target.value)}
                              />
                            ) : (
                              <input
                                className="border rounded px-2 py-1 text-sm"
                                type={setting.type === 'NUMBER' ? 'number' : 'text'}
                                value={draftValue}
                                onChange={(e) => setDraftValue(e.target.value)}
                              />
                            )}

                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="text-xs px-2 py-1 rounded border border-stone-200"
                                onClick={cancelEdit}
                                disabled={isSaving}
                              >
                                Cancelar
                              </button>
                              <button
                                className="text-xs px-2 py-1 rounded bg-amber-500 text-white"
                                onClick={() => saveSetting(setting)}
                                disabled={isSaving}
                              >
                                {isSaving ? 'Guardant...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg font-semibold text-slate-700">
                              {formatDisplay(current)}
                            </p>
                            <p className="text-xs text-slate-400">
                              Actualitzat:{' '}
                              {new Date(current.updatedAt).toLocaleDateString('ca-ES')}
                            </p>
                            <button
                              className="mt-2 text-xs px-2 py-1 rounded border border-stone-200 hover:bg-stone-100"
                              onClick={() => startEdit(current)}
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
