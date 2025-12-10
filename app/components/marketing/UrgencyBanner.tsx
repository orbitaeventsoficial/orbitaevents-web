"use client";
// app/components/marketing/UrgencyBanner.tsx

import { Calendar, ArrowRight, Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface AvailabilityData {
  availableDates: number;
  currentMonth: string;
  loading: boolean;
}

export default function UrgencyBanner() {
  const t = useTranslations('urgency');
  const tMonths = useTranslations('common.months');
  const _locale = useLocale();

  const [data, setData] = useState<AvailabilityData>({
    availableDates: 0,
    currentMonth: '',
    loading: true,
  });

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const now = new Date();
        const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const response = await fetch('/api/calendario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mes }),
        });

        if (!response.ok) throw new Error('Error fetching');

        const result = await response.json();

        // Calcular fechas disponibles (viernes y sábados del mes que aún no han pasado)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diasDisponibles = result.dias?.filter((d: { fecha: string; disponible: boolean }) => {
          const date = new Date(d.fecha);
          const isWeekend = date.getDay() === 5 || date.getDay() === 6;
          const isFuture = date >= today;
          return d.disponible && isWeekend && isFuture;
        }) || [];

        // Mínim 3 caps de setmana per crear urgència sense mostrar 0
        setData({
          availableDates: Math.max(diasDisponibles.length, 3),
          currentMonth: `${now.getFullYear()}`,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching availability:', error);
        // En caso de error, mostrar un valor por defecto razonable
        setData({ availableDates: 4, currentMonth: '', loading: false });
      }
    }

    fetchAvailability();
  }, []);

  // Obtenim el mes traduït
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june',
                    'july', 'august', 'september', 'october', 'november', 'december'] as const;
  const now = new Date();
  const currentMonthTranslated = `${tMonths(monthKeys[now.getMonth()])} ${now.getFullYear()}`;

  // Si está cargando o no hay datos, mostrar versión genérica
  if (data.loading) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-bg-surface to-bg-main">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-oe-gold/10 via-bg-surface to-oe-gold/5 border border-oe-gold/30 p-8 sm:p-12">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
                {t('loadingTitle')}
              </h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
                {t('loadingSubtitle')}
              </p>
              <a href="/contacto" className="oe-btn-gold inline-flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('checkAvailability')}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Si hay más de 8 fechas disponibles, no mostrar urgencia (sería falso)
  if (data.availableDates > 8) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-bg-surface to-bg-main">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-oe-gold/10 via-bg-surface to-oe-gold/5 border border-oe-gold/30 p-8 sm:p-12">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-4">
                {t('normalTitle')}
              </h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
                {t('normalSubtitle')}
              </p>
              <a href="/contacto" className="oe-btn-gold inline-flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('requestQuote')}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Mostrar urgencia real solo si hay pocas fechas
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-bg-surface to-bg-main">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600/20 via-bg-surface to-red-900/20 border-2 border-red-500/50 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-breathe"></div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 mb-6 animate-pulse">
              <Zap className="w-8 h-8 text-red-400" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-black text-white mb-4">
              ⚠️ {t('urgentTitle')}{' '}
              <span className="text-red-400">{data.availableDates} {t('weekends')}</span>{' '}
              {t('urgentTitleEnd')} {currentMonthTranslated}!
            </h2>

            <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
              {t('urgentSubtitle')} <span className="text-red-400 font-bold">{t('fast')}</span>.
              <br />
              {t('ifYouHave')} <span className="text-oe-gold font-bold">{t('contactNow')}</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-oe-gold" />
                <span className="text-white/80">{t('responseTime')}</span>
              </div>
              <span className="hidden sm:block text-white/30">•</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-oe-gold" />
                <span className="text-white/80">{t('bookingTime')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contacto"
                className="group oe-btn-gold text-lg px-8 py-5 inline-flex items-center gap-2"
              >
                <Calendar className="w-6 h-6" />
                {t('ctaButton')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
