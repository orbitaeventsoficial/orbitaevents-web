"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface DiaCalendario {
  fecha: string;
  disponible: boolean;
  bloqueado: boolean;
  tieneReserva: boolean;
  antelacionInsuficiente: boolean;
  esTemporadaAlta: boolean;
  diaSemana: number;
}

interface CalendarioDisponibilidadProps {
  onFechaSeleccionada?: (_fecha: string) => void;
  mostrarLeyenda?: boolean;
  compacto?: boolean;
}

export default function CalendarioDisponibilidad({
  onFechaSeleccionada,
  mostrarLeyenda = true,
  compacto = false
}: CalendarioDisponibilidadProps) {
  const t = useTranslations('common');
  const tCal = useTranslations('calendar');
  const [mesActual, setMesActual] = useState(new Date());
  const [calendario, setCalendario] = useState<DiaCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [stats, setStats] = useState({
    diasDisponibles: 0,
    diasBloqueados: 0,
    diasReservados: 0
  });

  // Cargar disponibilidad del mes
  useEffect(() => {
    cargarMes(mesActual);
  }, [mesActual]);

  async function cargarMes(fecha: Date) {
    setLoading(true);
    try {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const mesStr = `${year}-${month}`;

      const response = await fetch('/api/calendario/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: mesStr })
      });

      if (!response.ok) throw new Error('Error al cargar calendario');

      const data = await response.json();
      setCalendario(data.calendario);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  }

  function mesAnterior() {
    const nueva = new Date(mesActual);
    nueva.setMonth(nueva.getMonth() - 1);
    setMesActual(nueva);
  }

  function mesSiguiente() {
    const nueva = new Date(mesActual);
    nueva.setMonth(nueva.getMonth() + 1);
    setMesActual(nueva);
  }

  function seleccionarFecha(dia: DiaCalendario) {
    if (!dia.disponible) return;
    
    setFechaSeleccionada(dia.fecha);
    onFechaSeleccionada?.(dia.fecha);
  }

  const nombreMes = mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const diasSemana = tCal.raw('daysShort') as string[];

  // Calcular días vacíos al inicio del mes
  const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay();

  return (
    <div className={`${compacto ? 'p-4' : 'p-6'} bg-surface/40 backdrop-blur-lg rounded-2xl border border-white/10`}>
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white capitalize">
          {nombreMes}
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={mesAnterior}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label={tCal('prevMonth')}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={mesSiguiente}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label={tCal('nextMonth')}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {diasSemana.map((dia) => (
          <div
            key={dia}
            className="text-center text-sm font-medium text-white/60 py-2"
          >
            {compacto ? dia.charAt(0) : dia}
          </div>
        ))}
      </div>

      {/* Calendario */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-[var(--oe-gold)] border-t-transparent rounded-full"
            />
            <p className="text-white/60 text-sm">{t('loading')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Días vacíos al inicio */}
          {Array.from({ length: primerDiaMes }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Días del mes */}
          {calendario.map((dia) => {
            const fecha = new Date(dia.fecha);
            const numeroDia = fecha.getDate();
            const esHoy = dia.fecha === new Date().toISOString().split('T')[0];
            const estaSeleccionado = dia.fecha === fechaSeleccionada;

            return (
              <motion.button
                key={dia.fecha}
                onClick={() => seleccionarFecha(dia)}
                disabled={!dia.disponible}
                whileHover={dia.disponible ? { scale: 1.05 } : {}}
                whileTap={dia.disponible ? { scale: 0.95 } : {}}
                className={`
                  relative aspect-square rounded-lg p-2 text-sm font-medium
                  transition-all duration-200
                  ${dia.disponible 
                    ? 'bg-white/5 hover:bg-white/10 text-white cursor-pointer border border-white/10 hover:border-[var(--oe-gold)]' 
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }
                  ${esHoy ? 'ring-2 ring-[var(--oe-gold)]' : ''}
                  ${estaSeleccionado ? 'bg-[var(--oe-gold)] text-black' : ''}
                  ${dia.esTemporadaAlta && dia.disponible ? 'border-orange-500' : ''}
                `}
              >
                {/* Número del día */}
                <span className="relative z-10">{numeroDia}</span>

                {/* Indicadores */}
                {dia.disponible && dia.esTemporadaAlta && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                )}
                
                {dia.tieneReserva && (
                  <X className="absolute bottom-1 right-1 w-3 h-3 text-red-400" />
                )}
                
                {estaSeleccionado && (
                  <Check className="absolute bottom-1 right-1 w-3 h-3 text-black" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Stats rápidas */}
      {!compacto && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{stats.diasDisponibles}</div>
            <div className="text-xs text-white/60">{tCal('available')}</div>
          </div>
          <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="text-2xl font-bold text-orange-400">{stats.diasReservados}</div>
            <div className="text-xs text-white/60">{tCal('reserved')}</div>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{stats.diasBloqueados}</div>
            <div className="text-xs text-white/60">{tCal('blocked')}</div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      {mostrarLeyenda && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-sm font-medium text-white mb-3">{tCal('legend')}</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5 border border-white/10" />
              <span className="text-white/60">{tCal('available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5 border border-orange-500 relative">
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full" />
              </div>
              <span className="text-white/60">{tCal('highSeason')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5 opacity-50" />
              <span className="text-white/60">{tCal('notAvailable')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--oe-gold)]" />
              <span className="text-white/60">{tCal('selected')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de fecha seleccionada */}
      <AnimatePresence>
        {fechaSeleccionada && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-[var(--oe-gold)]/10 border border-[var(--oe-gold)]/30 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[var(--oe-gold)] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">
                  {tCal('dateSelected')}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {new Date(fechaSeleccionada).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
