'use client';

import { useState, useEffect } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: 'Color Primari',
  secondary: 'Color Secundari',
  accent: 'Color d\'Accent',
  background: 'Color de Fons',
  text: 'Color de Text',
  textLight: 'Text Secundari',
  border: 'Color de Bordes',
  success: 'Color d\'Èxit',
  warning: 'Color d\'Avís',
  error: 'Color d\'Error',
};

const PRESET_THEMES: Record<string, ThemeColors> = {
  default: {
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#f43f5e',
    background: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#8b5cf6',
    background: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  green: {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#06b6d4',
    background: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

export default function ThemePage() {
  const [colors, setColors] = useState<ThemeColors | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      const res = await fetch('/api/admin/theme');
      const data = await res.json();
      if (data.ok) {
        setColors(data.colors);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTheme() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', colors }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Tema guardat correctament!');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Error guardant el tema');
    } finally {
      setSaving(false);
    }
  }

  async function resetTheme() {
    if (!confirm('Resetar al tema per defecte?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();
      if (data.ok) {
        setColors(data.colors);
        alert('Tema resetejat!');
      }
    } catch (error) {
      console.error('Error resetting theme:', error);
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(presetKey: string) {
    if (confirm(`Aplicar tema ${presetKey}?`)) {
      setColors(PRESET_THEMES[presetKey]);
    }
  }

  function updateColor(key: keyof ThemeColors, value: string) {
    if (colors) {
      setColors({ ...colors, [key]: value });
    }
  }

  if (loading || !colors) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          🎨 Personalitzar Tema
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalitza la paleta de colors del lloc web
        </p>
      </header>

      {/* Preset Themes */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Temes Predefinits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(PRESET_THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="p-4 border-2 border-stone-200 rounded-lg hover:border-amber-500 transition-colors"
            >
              <div className="font-medium text-slate-700 mb-2 capitalize">{key}</div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.primary }} />
                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.secondary }} />
                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.accent }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Editor */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="bg-stone-100 border border-stone-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {COLOR_LABELS[key as keyof ThemeColors]}
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-lg font-mono text-sm"
                  pattern="^#[A-Fa-f0-9]{6}$"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Vista Prèvia</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: colors.primary }}>
              Botó Primari
            </div>
            <div className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: colors.secondary }}>
              Botó Secundari
            </div>
            <div className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: colors.accent }}>
              Botó Accent
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: colors.success }}>
              ✓ Èxit
            </div>
            <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: colors.warning }}>
              ⚠ Avís
            </div>
            <div className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: colors.error }}>
              ✕ Error
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={saveTheme}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardant...' : '💾 Guardar Tema'}
        </button>
        <button
          onClick={resetTheme}
          disabled={saving}
          className="px-6 py-3 bg-stone-100 border border-stone-200 text-slate-700 rounded-lg font-medium hover:bg-stone-200 disabled:opacity-50"
        >
          🔄 Resetar
        </button>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Nota Important</h3>
        <p className="text-sm text-amber-700">
          Els canvis de tema s&apos;aplicaran després de refrescar la pàgina. Alguns components poden requerir un redeploy per veure els canvis.
        </p>
      </div>
    </div>
  );
}
