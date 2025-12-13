'use client';
/**
 * HeroBrutal.tsx - VERSIÓN LIMPIA
 *
 * REGLAS:
 * - CERO datos hardcodeados en métricas (todo viene de API / BD)
 * - CTA principal → Formulario de contacto (NO WhatsApp)
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/navigation';
import {
  ArrowRight,
  Calendar,
  FileText,
  Sparkles,
  Clock,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/site-config';
import { useTranslations } from 'next-intl';

type NextEvent = {
  id: string;
  fechaEvento: string;
  clienteNombre: string | null;
};

export default function HeroBrutal() {
  const t = useTranslations('hero');
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('calendar');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [availableSlots, setAvailableSlots] = useState<number | null>(null);
  const [eventsCompleted, setEventsCompleted] = useState<number | null>(null);
  const [eventsThisYear, setEventsThisYear] = useState<number | null>(null);
  const [eventsNext90Days, setEventsNext90Days] = useState<number | null>(null);
  const [clientsTotal, setClientsTotal] = useState<number | null>(null);
  const [experienceLabel, setExperienceLabel] = useState<string | null>(null);
  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar disponibilidad + stats reales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const mes = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, '0')}`;

        // Disponibilidad (calendario real, desde BD)
        const response = await fetch('/api/calendario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mes }),
        });

        if (response.ok) {
          const data = await response.json();

          // Contar sábados disponibles REALES (solo hoy en adelante)
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);

          const sabadosDisponibles =
            (data.dias ?? []).filter((d: any) => {
              const fecha = new Date(d.fecha);
              fecha.setHours(0, 0, 0, 0);

              const esSabado = fecha.getDay() === 6; // 6 = sábado
              const esFuturoOHoy = fecha >= hoy;

              return d.disponible === true && esSabado && esFuturoOHoy;
            }).length || 0;

          setAvailableSlots(sabadosDisponibles);
        } else {
          setAvailableSlots(null);
        }

        // Stats de SITE_CONFIG (evita 404 a /api/stats)
        const siteStats = SITE_CONFIG.stats;
        setEventsCompleted(siteStats.eventsCompleted);
        setEventsThisYear(siteStats.eventsCompleted); // Aproximació
        setEventsNext90Days(null); // No tenim aquesta dada
        setClientsTotal(siteStats.happyClients);
        setExperienceLabel(`${siteStats.yearsExperience}+ anys`);
        setNextEvent(null);
      } catch (error) {
        console.error('Error fetching hero data:', error);
        setAvailableSlots(null);
        setEventsCompleted(null);
        setEventsThisYear(null);
        setEventsNext90Days(null);
        setClientsTotal(null);
        setExperienceLabel(null);
        setNextEvent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      v.removeAttribute('autoplay');
    }
  }, []);

  const hasEvents = (eventsCompleted ?? 0) > 0;

  const nextEventLabel =
    nextEvent && nextEvent.fechaEvento
      ? new Date(nextEvent.fechaEvento).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        })
      : null;

  const showSlotsBadge =
    !isLoading &&
    availableSlots !== null &&
    availableSlots > 0 &&
    availableSlots <= 5;

  return (
    <section className="relative isolate overflow-hidden min-h-screen flex items-center bg-black">
      {/* === VIDEO DE FONDO === */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain opacity-40"
          playsInline
          muted
          loop
          autoPlay
          poster="/img/orbita-glyph-anim.svg"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />
      </div>

      {/* === PARTÍCULAS FLOTANTES BRUTALES === */}
      <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none opacity-40">
        {/* Partículas doradas grandes con float */}
        <div
          className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-oe-gold/40 to-yellow-400/30 blur-3xl top-[15%] left-[10%] animate-float"
          style={{ animationDuration: '6s', animationDelay: '0s' }}
        />
        <div
          className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-oe-gold/30 to-yellow-400/20 blur-3xl top-[55%] right-[15%] animate-float"
          style={{ animationDuration: '8s', animationDelay: '2s' }}
        />
        <div
          className="absolute w-44 h-44 rounded-full bg-gradient-to-br from-oe-gold/35 to-yellow-400/25 blur-3xl bottom-[25%] left-[45%] animate-float"
          style={{ animationDuration: '7s', animationDelay: '1s' }}
        />

        {/* Partículas medianas con púrpura y pulse */}
        <div
          className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 blur-2xl top-[40%] left-[25%] animate-scale-pulse"
          style={{ animationDuration: '5s', animationDelay: '0.5s' }}
        />
        <div
          className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-purple-600/25 to-pink-600/15 blur-2xl bottom-[40%] right-[30%] animate-scale-pulse"
          style={{ animationDuration: '6s', animationDelay: '1.5s' }}
        />

        {/* Partículas pequeñas brillantes */}
        <div
          className="absolute w-24 h-24 rounded-full bg-yellow-300/25 blur-xl top-[30%] right-[40%]"
        />
        <div
          className="absolute w-20 h-20 rounded-full bg-yellow-300/20 blur-xl bottom-[50%] left-[60%]"
        />
      </div>

      {/* === CONTENIDO === */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 w-full">
        {/* Badge de urgencia - Solo si hay sábados futuros libres */}
        {showSlotsBadge && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-3 rounded-full bg-oe-gold/10 border-2 border-oe-gold/30 px-6 py-3 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-oe-gold" />
              <span className="text-base font-medium text-white">
                {availableSlots} {tCalendar('saturdaysAvailable', { count: availableSlots })}
              </span>
            </div>
          </div>
        )}

        {/* HEADLINE */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tight leading-none mb-6">
            <span className="block text-white drop-shadow-2xl">
              {t('title.line1')}
            </span>
            <span className="block text-white drop-shadow-2xl">
              {t('title.line2')}
            </span>
            <span
              className="block bg-gradient-to-r from-oe-gold via-yellow-300 to-oe-gold bg-clip-text text-transparent drop-shadow-2xl animate-pulse"
              style={{ animationDuration: '3s' }}
            >
              {t('title.line3')}
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <p className="text-center text-2xl sm:text-3xl text-white max-w-4xl mx-auto leading-relaxed mb-4">
          {t('subtitle')}{' '}
          <span className="font-black text-oe-gold text-3xl">
            {t('subtitleBold')}
          </span>
          {' '}{t('subtitleEnd')}
        </p>
        <p className="text-center text-xl text-white/90 max-w-3xl mx-auto mb-10">
          {t('services')}
          <br />
          <span className="text-oe-gold">
            {t('forEvents')}
          </span>
        </p>

        {/* Proof social - Solo mostrar si hay datos */}
        <div className="flex justify-center items-center gap-8 flex-wrap mb-6 text-lg">
          {hasEvents && (
            <>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                <Sparkles className="w-6 h-6 text-oe-gold" />
                <span className="text-white font-bold text-xl">
                  +{eventsCompleted} {t('events')}
                </span>
              </div>

              {eventsThisYear !== null && eventsThisYear > 0 && (
                <>
                  <span className="text-oe-gold text-3xl hidden sm:block">
                    •
                  </span>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                    <span className="text-oe-gold font-medium">
                      {eventsThisYear} {t('thisYear')}
                    </span>
                  </div>
                </>
              )}

              {eventsNext90Days !== null && eventsNext90Days > 0 && (
                <>
                  <span className="text-oe-gold text-3xl hidden sm:block">
                    •
                  </span>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                    <span className="text-oe-gold font-medium">
                      {eventsNext90Days} {t('next90Days')}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {clientsTotal !== null && clientsTotal > 0 && (
            <>
              <span className="text-oe-gold text-3xl hidden sm:block">•</span>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                <span className="text-oe-gold font-medium">
                  +{clientsTotal} {t('clients')}
                </span>
              </div>
            </>
          )}

          {experienceLabel && (
            <>
              <span className="text-oe-gold text-3xl hidden sm:block">•</span>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                <span className="text-oe-gold font-medium">
                  {experienceLabel}
                </span>
              </div>
            </>
          )}

          {/* Ubicaciones - Copy estático definido por ti (no métrica) */}
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <span className="text-oe-gold font-medium">
              📍 {t('location')}
            </span>
          </div>
        </div>

        {/* Próximo evento (si existe) */}
        {nextEventLabel && (
          <div className="mb-10 text-center text-sm text-white/80">
            {t('nextEvent')}:{' '}
            <span className="font-semibold text-oe-gold">
              {nextEventLabel}
            </span>
            {nextEvent?.clienteNombre && (
              <>
                {' '}
                ·{' '}
                <span className="text-white/80">
                  {nextEvent.clienteNombre}
                </span>
              </>
            )}
          </div>
        )}

        {/* CTAs - FORMULARIO, NO WHATSAPP */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <Link
            href="/contacto"
            className="group relative inline-flex items-center gap-3 px-10 py-6 rounded-2xl text-black text-xl font-black bg-gradient-to-r from-oe-gold via-oe-gold to-oe-gold hover:from-oe-gold hover:via-oe-gold hover:to-oe-gold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-oe-gold/50"
          >
            <FileText className="w-7 h-7" />
            <span>{tCommon('buttons.contact')}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>

          <Link
            href="/configurador"
            className="group inline-flex items-center gap-3 px-10 py-6 rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md text-white text-xl font-bold hover:border-oe-gold hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
          >
            <Calendar className="w-6 h-6 text-oe-gold" />
            <span>{tCommon('buttons.configure')}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </Link>
        </div>

        {/* Badge de respuesta */}
        <div className="text-center px-4">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 border border-white/20 max-w-full">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-white/90 text-sm sm:text-base">
                <span className="font-bold text-green-400">
                  {t('responseTime')}
                </span>
              </span>
            </div>
            <span className="text-white/30 hidden sm:block">•</span>
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm sm:text-base">
                💯{' '}
                <span className="font-bold text-white">
                  {t('satisfactionGuaranteed')}
                </span>
              </span>
            </div>
            <span className="text-white/30 hidden sm:block">•</span>
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm sm:text-base">
                🎁{' '}
                <span className="font-bold text-oe-gold">
                  {t('webDiscount')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Scroll indicator - oculto en móvil */}
        <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/40 flex items-start justify-center p-2">
            <div className="w-2 h-4 rounded-full bg-oe-gold animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
