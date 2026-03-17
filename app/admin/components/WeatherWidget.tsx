'use client';

import { useState, useEffect } from 'react';
import type { WeatherForecast } from '@/lib/services/weatherService';

// ─── Mapping icona OpenWeatherMap → emoji ───────────────────────────

const WEATHER_EMOJI: Record<string, string> = {
  Clear: '\u2600\uFE0F',       // ☀️
  Clouds: '\u2601\uFE0F',      // ☁️
  Rain: '\uD83C\uDF27\uFE0F',  // 🌧️
  Drizzle: '\uD83C\uDF26\uFE0F', // 🌦️
  Thunderstorm: '\u26C8\uFE0F', // ⛈️
  Snow: '\u2744\uFE0F',         // ❄️
};
const DEFAULT_EMOJI = '\uD83C\uDF24\uFE0F'; // 🌤️

function getWeatherEmoji(description: string): string {
  // Intentem trobar la descripció que coincideixi amb les claus del mapping
  for (const [key, emoji] of Object.entries(WEATHER_EMOJI)) {
    if (description.toLowerCase().includes(key.toLowerCase())) {
      return emoji;
    }
  }
  // Mapping per les descripcions en català
  const catMap: Record<string, string> = {
    'cel serè': '\u2600\uFE0F',
    'ennuvolat': '\u2601\uFE0F',
    'pluja': '\uD83C\uDF27\uFE0F',
    'plugim': '\uD83C\uDF26\uFE0F',
    'tempesta': '\u26C8\uFE0F',
    'neu': '\u2744\uFE0F',
    'boira': '\uD83C\uDF2B\uFE0F',
  };
  const lower = description.toLowerCase();
  for (const [key, emoji] of Object.entries(catMap)) {
    if (lower.includes(key)) {
      return emoji;
    }
  }
  return DEFAULT_EMOJI;
}

function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Avui';
  if (diffDays === 1) return 'Demà';

  return d.toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function WeatherWidget() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/admin/weather');
        if (!res.ok) throw new Error('Resposta no vàlida');
        const data = await res.json();
        if (!cancelled && data.ok && Array.isArray(data.forecasts)) {
          setForecasts(data.forecasts);
        }
      } catch {
        console.error('Error carregant previsions meteorològiques');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // No mostrar res si està carregant o no hi ha previsions
  if (loading || forecasts.length === 0) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
        Temps pròxims events
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {forecasts.map((f) => (
          <div
            key={f.bookingId}
            className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-3 min-w-[160px] max-w-[200px] hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl leading-none">{getWeatherEmoji(f.description)}</span>
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                {f.temp}°
              </span>
            </div>
            <p className="text-xs font-medium text-white/70 truncate">{f.description}</p>
            {f.rainProbability > 0 && (
              <p className="text-xs text-cyan-400/80 mt-0.5">
                {'\uD83D\uDCA7'} {f.rainProbability}% pluja
              </p>
            )}
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-xs font-medium text-white/80 truncate">{f.clientName}</p>
              <p className="text-[11px] text-white/40 truncate">{f.location}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{formatShortDate(f.eventDate)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
