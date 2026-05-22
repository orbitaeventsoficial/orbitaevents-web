'use client';

import { useState, useEffect } from 'react';
import { ADMIN_WEATHER_DEFAULT_EMOJI, ADMIN_WEATHER_EMOJI, ADMIN_WEATHER_EMOJI_CA } from '@/lib/constants/admin';
import { formatWeekdayDateShort } from '@/lib/constants';
import { log } from '@/lib/logger';
import type { WeatherForecast } from '@/lib/services/weatherService';

function getWeatherEmoji(description: string): string {
  // Intentem trobar la descripció que coincideixi amb les claus del mapping
  for (const [key, emoji] of Object.entries(ADMIN_WEATHER_EMOJI)) {
    if (description.toLowerCase().includes(key.toLowerCase())) {
      return emoji;
    }
  }
  const lower = description.toLowerCase();
  for (const [key, emoji] of Object.entries(ADMIN_WEATHER_EMOJI_CA)) {
    if (lower.includes(key)) {
      return emoji;
    }
  }
  return ADMIN_WEATHER_DEFAULT_EMOJI;
}

function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Avui';
  if (diffDays === 1) return 'Demà';

  return formatWeekdayDateShort(d);
}

export default function WeatherWidget() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadError(null);
        const res = await fetch('/api/admin/weather');
        if (!res.ok) throw new Error("No s'ha pogut carregar el temps dels pròxims events");
        const data = await res.json();
        if (!cancelled && data.ok && Array.isArray(data.forecasts)) {
          setForecasts(data.forecasts);
        }
      } catch (error) {
        log.error('Error carregant previsions meteorològiques', error);
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "No s'ha pogut carregar el temps dels pròxims events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  if (loadError || forecasts.length === 0) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
        Temps pròxims events
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {forecasts.map((f) => (
          <div
            key={f.bookingId}
            className="ap-card flex-shrink-0 rounded-xl p-3 min-w-[160px] max-w-[200px] transition-colors hover:admin-tone-bg-neutral"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl leading-none">{getWeatherEmoji(f.description)}</span>
              <span className="text-xl font-bold font-mono">
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
