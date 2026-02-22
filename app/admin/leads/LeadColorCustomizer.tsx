'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_BASE_COLORS, PRIORITY_COLOR_OPTIONS, STATUS_COLOR_OPTIONS, type LeadColorOption } from './colorTheme';

const STORAGE_KEY = 'orbita:admin:leads:colors:v1';

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '').trim();
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return [r, g, b];
}

function applyTone(target: CSSStyleDeclaration, option: LeadColorOption, baseColor: string) {
  const [r, g, b] = hexToRgb(baseColor);
  target.setProperty(option.baseVar, baseColor);
  target.setProperty(option.bgVar, `rgba(${r}, ${g}, ${b}, 0.22)`);
  target.setProperty(option.borderVar, `rgba(${r}, ${g}, ${b}, 0.58)`);
  target.setProperty(option.textVar, `rgb(${r}, ${g}, ${b})`);
}

function getRootStyle() {
  const root = document.getElementById('leads-theme-root');
  return root?.style ?? document.documentElement.style;
}

export default function LeadColorCustomizer() {
  const [colors, setColors] = useState<Record<string, string>>(DEFAULT_BASE_COLORS);
  const allOptions = useMemo(() => [...STATUS_COLOR_OPTIONS, ...PRIORITY_COLOR_OPTIONS], []);

  useEffect(() => {
    const next = { ...DEFAULT_BASE_COLORS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string' && isHexColor(value) && key in next) {
            next[key] = value;
          }
        }
      }
    } catch {
      // Ignore invalid persisted payloads.
    }

    setColors(next);
    const style = getRootStyle();
    for (const option of allOptions) {
      applyTone(style, option, next[option.key] || DEFAULT_BASE_COLORS[option.key]);
    }
  }, [allOptions]);

  const setColor = (key: string, value: string) => {
    if (!isHexColor(value)) return;
    const updated = { ...colors, [key]: value };
    setColors(updated);

    const option = allOptions.find((item) => item.key === key);
    if (option) applyTone(getRootStyle(), option, value);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetColors = () => {
    setColors(DEFAULT_BASE_COLORS);
    const style = getRootStyle();
    for (const option of allOptions) {
      applyTone(style, option, DEFAULT_BASE_COLORS[option.key]);
    }
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <details className="rounded-2xl border p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Personalitzar colors d&apos;estat i prioritat
      </summary>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide">Estats</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STATUS_COLOR_OPTIONS.map((option) => (
              <label key={option.key} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${option.chipClass}`}>
                <span>{option.label}</span>
                <input
                  type="color"
                  value={colors[option.key] || DEFAULT_BASE_COLORS[option.key]}
                  onChange={(event) => setColor(option.key, event.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                  aria-label={`Color per ${option.label}`}
                />
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide">Prioritats</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PRIORITY_COLOR_OPTIONS.map((option) => (
              <label key={option.key} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${option.chipClass}`}>
                <span>{option.label}</span>
                <input
                  type="color"
                  value={colors[option.key] || DEFAULT_BASE_COLORS[option.key]}
                  onChange={(event) => setColor(option.key, event.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-white/15 bg-transparent"
                  aria-label={`Color per ${option.label}`}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetColors}
            className="rounded-lg border px-3 py-1.5 text-xs"
          >
            Restablir colors per defecte
          </button>
        </div>
      </div>
    </details>
  );
}

