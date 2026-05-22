"use client";

import { useState, useEffect } from 'react';

type CountdownLocale = 'ca' | 'es' | 'en';

const LABELS: Record<CountdownLocale, { days: string; hours: string; mins: string }> = {
  ca: { days: 'dies', hours: 'hores', mins: 'minuts' },
  es: { days: 'días', hours: 'horas', mins: 'minutos' },
  en: { days: 'days', hours: 'hours', mins: 'minutes' },
};

function getCountdown(targetMs: number) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  const totalMins = Math.floor(diff / 60_000);
  return {
    days: Math.floor(totalMins / 1440),
    hours: Math.floor((totalMins % 1440) / 60),
    mins: totalMins % 60,
  };
}

export default function CountdownTimer({
  eventDateIso,
  locale,
  accentHex,
}: {
  eventDateIso: string;
  locale: CountdownLocale;
  accentHex: string;
}) {
  const targetMs = new Date(eventDateIso).getTime();
  const [countdown, setCountdown] = useState<{ days: number; hours: number; mins: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCountdown(getCountdown(targetMs));
    const id = setInterval(() => setCountdown(getCountdown(targetMs)), 60_000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (!mounted || !countdown) return null;

  const l = LABELS[locale] ?? LABELS.ca;

  return (
    <div className="flex items-end gap-6 sm:gap-8" suppressHydrationWarning>
      {[
        { value: countdown.days, label: l.days },
        { value: countdown.hours, label: l.hours },
        { value: countdown.mins, label: l.mins },
      ].map(({ value, label }, i) => (
        <div key={label} className="flex items-end gap-1.5">
          {i > 0 && <span className="text-2xl text-white/20 mb-2 select-none" aria-hidden="true">·</span>}
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight leading-none" style={{ color: accentHex }}>
              {value}
            </div>
            <div className="text-xs text-white/35 uppercase tracking-widest mt-1.5">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
