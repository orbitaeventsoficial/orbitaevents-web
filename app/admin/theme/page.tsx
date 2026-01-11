'use client';

import { useEffect, useState } from 'react';
import { log } from '@/lib/logger';

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

const DEFAULT_COLORS: ThemeColors = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  accent: '#f43f5e',       // rose-500
  background: '#ffffff',   // white
  text: '#0f172a',         // slate-900
  textLight: '#64748b',    // slate-500
  border: '#e2e8f0',       // slate-200
  success: '#10b981',      // green-500
  warning: '#f59e0b',      // amber-500
  error: '#ef4444',        // red-500
};

const COLOR_PRESETS = [
  {
    name: 'Órbita Original (Naranja)',
    colors: DEFAULT_COLORS,
  },
  {
    name: 'Azul Profesional',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#0f172a',
      textLight: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    name: 'Rosa Elegante',
    colors: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#a855f7',
      background: '#ffffff',
      text: '#0f172a',
      textLight: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    name: 'Verde Fresco',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#14b8a6',
      background: '#ffffff',
      text: '#0f172a',
      textLight: '#64748b',
      border: '#e2e8f0',
      success: '#059669',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    name: 'Modo Oscuro',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#f43f5e',
      background: '#0f172a',
      text: '#f1f5f9',
      textLight: '#94a3b8',
      border: '#334155',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
];

export default function ThemePage() {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const res = await fetch('/api/admin/theme');
      const data = await res.json();
      if (data.ok && data.colors) {
        setColors(data.colors);
      }
    } catch (error) {
      log.error('Error cargando tema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          colors,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Tema guardado correctamente');
        await loadTheme();
      } else {
        alert(data.error || 'Error guardando tema');
      }
    } catch (error) {
      log.error('Error guardando tema:', error);
      alert('Error guardando tema');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Resetear al tema por defecto (Órbita Original)?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Tema reseteado al predeterminado');
        await loadTheme();
      } else {
        alert(data.error || 'Error reseteando tema');
      }
    } catch (error) {
      log.error('Error reseteando tema:', error);
      alert('Error reseteando tema');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (presetColors: ThemeColors) => {
    setColors(presetColors);
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors({ ...colors, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          Theme Manager
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Personaliza los colores del sitio web
        </p>
      </header>

      {/* Info Alert */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Importante:</strong> Los cambios de tema afectarán a todo el sitio público.
          Asegúrate de probar los colores antes de guardar.
        </p>
      </div>

      {/* Actions */}
      <section className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm disabled:opacity-50"
        >
          💾 Guardar Cambios
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-stone-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-300 disabled:opacity-50"
        >
          🔄 Resetear a Predeterminado
        </button>
      </section>

      {/* Presets */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Temas Predefinidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(preset.colors)}
              className="rounded-lg border border-stone-200 bg-white p-4 text-left hover:border-orange-300 hover:shadow-md transition-all"
            >
              <h3 className="font-medium text-slate-700 mb-3">{preset.name}</h3>
              <div className="flex gap-1.5">
                <div
                  className="w-8 h-8 rounded-md shadow-sm"
                  style={{ backgroundColor: preset.colors.primary }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded-md shadow-sm"
                  style={{ backgroundColor: preset.colors.secondary }}
                  title="Secondary"
                />
                <div
                  className="w-8 h-8 rounded-md shadow-sm"
                  style={{ backgroundColor: preset.colors.accent }}
                  title="Accent"
                />
                <div
                  className="w-8 h-8 rounded-md shadow-sm border border-stone-200"
                  style={{ backgroundColor: preset.colors.background }}
                  title="Background"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Color Editor */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Editor de Colores</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color Primario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.primary}
                onChange={(e) => updateColor('primary', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => updateColor('primary', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.secondary}
                onChange={(e) => updateColor('secondary', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => updateColor('secondary', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Acento
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.accent}
                onChange={(e) => updateColor('accent', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => updateColor('accent', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Fondo
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.background}
                onChange={(e) => updateColor('background', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.background}
                  onChange={(e) => updateColor('background', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Texto
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.text}
                onChange={(e) => updateColor('text', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.text}
                  onChange={(e) => updateColor('text', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Text Light Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Texto Secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.textLight}
                onChange={(e) => updateColor('textLight', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.textLight}
                  onChange={(e) => updateColor('textLight', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Bordes
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.border}
                onChange={(e) => updateColor('border', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.border}
                  onChange={(e) => updateColor('border', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Success Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Éxito
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.success}
                onChange={(e) => updateColor('success', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.success}
                  onChange={(e) => updateColor('success', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Warning Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Advertencia
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.warning}
                onChange={(e) => updateColor('warning', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.warning}
                  onChange={(e) => updateColor('warning', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Error Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Color de Error
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.error}
                onChange={(e) => updateColor('error', e.target.value)}
                className="w-16 h-12 rounded-md border border-stone-300 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={colors.error}
                  onChange={(e) => updateColor('error', e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Vista Previa</h2>
        <div
          className="rounded-lg p-8 shadow-md"
          style={{ backgroundColor: colors.background, borderColor: colors.border }}
        >
          <h3
            className="text-2xl font-bold mb-4"
            style={{ color: colors.text }}
          >
            Órbita Events
          </h3>
          <p
            className="mb-6"
            style={{ color: colors.textLight }}
          >
            Este es un ejemplo de cómo se verán los textos en tu sitio web con los colores seleccionados.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="px-6 py-2.5 rounded-md font-medium text-white shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              Botón Primario
            </button>
            <button
              className="px-6 py-2.5 rounded-md font-medium text-white shadow-sm"
              style={{ backgroundColor: colors.secondary }}
            >
              Botón Secundario
            </button>
            <button
              className="px-6 py-2.5 rounded-md font-medium text-white shadow-sm"
              style={{ backgroundColor: colors.accent }}
            >
              Botón Acento
            </button>
          </div>
          <div className="mt-6 flex gap-3">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: colors.success }}
            >
              ✓ Éxito
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: colors.warning }}
            >
              ⚠ Advertencia
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: colors.error }}
            >
              ✕ Error
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
