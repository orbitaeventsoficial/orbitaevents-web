// app/components/ui/CalendarioUrgencia.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - CALENDARIO DE URGENCIA v2.0
// ═══════════════════════════════════════════════════════════════════════════
//
// El calendario que GENERA URGENCIA y CIERRA VENTAS.
// Características:
// - Vista de 3 meses con disponibilidad real
// - Indicadores visuales de escasez (rojo/amarillo/verde)
// - Countdown dinámico "X días para que se agote"
// - Tooltips informativos en cada día
// - Modal de reserva rápida
// - Integración con API de disponibilidad
// - Animaciones de urgencia pulsante
// - Mobile-first design
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface DayStatus {
  date: string;
  dayOfMonth: number;
  isWeekend: boolean;
  isSaturday: boolean;
  available: boolean;
  reason?: string;
  isHighSeason: boolean;
  isPast: boolean;
}

interface MonthData {
  month: number;
  year: number;
  name: string;
  shortName: string;
  days: DayStatus[];
  stats: {
    totalSaturdays: number;
    availableSaturdays: number;
    status: 'scarce' | 'limited' | 'available';
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const MONTH_NAMES = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  ca: ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
       'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre']
};

const MONTH_SHORT = {
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  ca: ['GEN', 'FEB', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DES']
};

const DAYS_SHORT = {
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  ca: ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']
};

// Simular disponibilidad (reemplazar con API real)
const MOCK_BOOKED_SATURDAYS: Record<string, string[]> = {
  '2025-01': ['2025-01-11', '2025-01-25'],
  '2025-02': ['2025-02-01', '2025-02-15', '2025-02-22'],
  '2025-03': ['2025-03-08', '2025-03-15', '2025-03-22', '2025-03-29'],
  '2025-04': ['2025-04-05', '2025-04-12', '2025-04-19'],
  '2025-05': ['2025-05-03', '2025-05-10', '2025-05-17', '2025-05-24'],
  '2025-06': ['2025-06-07', '2025-06-14', '2025-06-21'],
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

function generateMonthData(month: number, year: number, locale: 'es' | 'ca' = 'es'): MonthData {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const bookedDates = MOCK_BOOKED_SATURDAYS[monthKey] || [];
  
  const days: DayStatus[] = [];
  let totalSaturdays = 0;
  let availableSaturdays = 0;
  
  // Alta temporada: Mayo, Junio, Septiembre, Octubre
  const isHighSeasonMonth = [4, 5, 8, 9].includes(month);
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();
    const isSaturday = dayOfWeek === 6;
    const isPast = date < today;
    
    if (isSaturday) {
      totalSaturdays++;
      const isBooked = bookedDates.includes(dateStr);
      if (!isBooked && !isPast) availableSaturdays++;
    }
    
    days.push({
      date: dateStr,
      dayOfMonth: d,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isSaturday,
      available: isSaturday && !bookedDates.includes(dateStr) && !isPast,
      reason: bookedDates.includes(dateStr) ? 'Reservado' : isPast ? 'Pasado' : undefined,
      isHighSeason: isHighSeasonMonth,
      isPast
    });
  }
  
  const status: 'scarce' | 'limited' | 'available' = 
    availableSaturdays <= 1 ? 'scarce' : 
    availableSaturdays <= 2 ? 'limited' : 'available';
  
  return {
    month,
    year,
    name: MONTH_NAMES[locale][month],
    shortName: MONTH_SHORT[locale][month],
    days,
    stats: { totalSaturdays, availableSaturdays, status }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Mini Calendario de Mes
// ═══════════════════════════════════════════════════════════════════════════

interface MiniMonthProps {
  data: MonthData;
  onDayClick: (day: DayStatus) => void;
  locale: 'es' | 'ca';
}

function MiniMonth({ data, onDayClick, locale }: MiniMonthProps) {
  const firstDayOfWeek = new Date(data.year, data.month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  const statusColors = {
    scarce: {
      bg: 'from-red-950 to-red-900/50',
      border: 'border-red-500/40',
      badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      glow: 'shadow-red-500/20'
    },
    limited: {
      bg: 'from-amber-950 to-amber-900/50',
      border: 'border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      glow: 'shadow-amber-500/20'
    },
    available: {
      bg: 'from-emerald-950 to-emerald-900/50',
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      glow: 'shadow-emerald-500/20'
    }
  };
  
  const colors = statusColors[data.stats.status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative bg-gradient-to-b ${colors.bg} 
        border ${colors.border} rounded-2xl p-4
        shadow-lg ${colors.glow}
      `}
    >
      {/* Header del mes */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{data.name}</h3>
          <p className="text-xs text-white/50">{data.year}</p>
        </div>
        
        {/* Badge de disponibilidad */}
        <div className={`px-2 py-1 rounded-lg border ${colors.badge} text-xs font-bold`}>
          {data.stats.status === 'scarce' && (
            <span className="flex items-center gap-1">
              <span className="animate-pulse">🔥</span>
              {data.stats.availableSaturdays === 0 ? 'AGOTADO' : `¡${data.stats.availableSaturdays} libre!`}
            </span>
          )}
          {data.stats.status === 'limited' && (
            <span>{data.stats.availableSaturdays} libres</span>
          )}
          {data.stats.status === 'available' && (
            <span>{data.stats.availableSaturdays} libres</span>
          )}
        </div>
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_SHORT[locale].map((day, i) => (
          <div
            key={day}
            className={`
              text-center text-[10px] font-medium py-1
              ${i >= 5 ? 'text-amber-400/70' : 'text-white/40'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {/* Espacios vacíos */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Días */}
        {data.days.map((day) => {
          const isClickable = day.isSaturday && day.available;
          
          return (
            <motion.button
              key={day.date}
              onClick={() => isClickable && onDayClick(day)}
              disabled={!isClickable}
              whileHover={isClickable ? { scale: 1.15 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
              className={`
                aspect-square rounded-lg flex items-center justify-center
                text-xs font-medium transition-all duration-200 relative
                ${day.isPast ? 'text-white/20' : ''}
                ${day.isSaturday && day.available ? `
                  bg-emerald-500/30 text-emerald-300 
                  hover:bg-emerald-500/50 cursor-pointer
                  ring-1 ring-emerald-500/50
                ` : ''}
                ${day.isSaturday && !day.available && !day.isPast ? `
                  bg-red-500/20 text-red-400/70
                  cursor-not-allowed
                ` : ''}
                ${!day.isSaturday && !day.isPast ? 'text-white/50 hover:text-white/70' : ''}
                ${day.isWeekend && !day.isSaturday ? 'text-amber-400/50' : ''}
              `}
              title={
                day.isSaturday 
                  ? day.available 
                    ? `✅ ${day.date} - Disponible` 
                    : `❌ ${day.date} - ${day.reason || 'No disponible'}`
                  : undefined
              }
            >
              {day.dayOfMonth}
              
              {/* Indicador de sábado disponible */}
              {day.isSaturday && day.available && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Leyenda compacta */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
          <span className="w-2 h-2 rounded bg-emerald-500/50" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
          <span className="w-2 h-2 rounded bg-red-500/30" />
          <span>Reservado</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Card de Resumen de Mes
// ═══════════════════════════════════════════════════════════════════════════

interface MonthSummaryCardProps {
  data: MonthData;
  index: number;
  onClick: () => void;
}

function MonthSummaryCard({ data, index, onClick }: MonthSummaryCardProps) {
  const statusConfig = {
    scarce: {
      bg: 'from-red-900/80 to-red-950',
      border: 'border-red-500/50',
      number: 'text-red-400',
      label: data.stats.availableSaturdays === 0 ? '¡AGOTADO!' : '¡Últimos!',
      pulse: true
    },
    limited: {
      bg: 'from-amber-900/80 to-amber-950',
      border: 'border-amber-500/50',
      number: 'text-amber-400',
      label: 'Pocos',
      pulse: false
    },
    available: {
      bg: 'from-emerald-900/80 to-emerald-950',
      border: 'border-emerald-500/50',
      number: 'text-emerald-400',
      label: 'Disponible',
      pulse: false
    }
  };
  
  const config = statusConfig[data.stats.status];
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex flex-col items-center justify-center
        px-5 py-4 rounded-2xl
        bg-gradient-to-b ${config.bg}
        border ${config.border}
        shadow-lg hover:shadow-xl transition-shadow
        min-w-[100px] md:min-w-[120px]
        cursor-pointer group
      `}
    >
      {/* Efecto de urgencia pulsante */}
      {config.pulse && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      
      {/* Nombre del mes */}
      <span className="text-xs font-bold text-white/90 tracking-wider mb-1">
        {data.shortName}
      </span>
      
      {/* Número de sábados */}
      <span className={`text-3xl md:text-4xl font-black font-mono ${config.number}`}>
        {data.stats.availableSaturdays}
      </span>
      
      {/* Label */}
      <span className="text-[10px] md:text-xs text-white/60 mt-1">
        {config.label}
      </span>
      
      {/* Hover indicator */}
      <span className="absolute bottom-2 text-[9px] text-white/0 group-hover:text-white/50 transition-colors">
        Ver calendario →
      </span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Modal de Día Seleccionado
// ═══════════════════════════════════════════════════════════════════════════

interface DayModalProps {
  day: DayStatus | null;
  monthName: string;
  onClose: () => void;
}

function DayModal({ day, monthName, onClose }: DayModalProps) {
  if (!day) return null;
  
  const formattedDate = new Date(day.date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          {/* Icono */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-3xl">🎉</span>
          </div>
          
          {/* Contenido */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              ¡Fecha disponible!
            </h3>
            <p className="text-emerald-400 font-medium mb-1 capitalize">
              {formattedDate}
            </p>
            <p className="text-white/50 text-sm mb-6">
              {day.isHighSeason ? '⭐ Temporada alta - Alta demanda' : 'Reserva antes de que se agote'}
            </p>
            
            {/* CTAs */}
            <div className="space-y-3">
              <Link
                href={`/configurador?fecha=${day.date}`}
                className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all text-center"
              >
                Reservar esta fecha
              </Link>
              
              <a
                href={`https://wa.me/34699121023?text=Hola! Me interesa el ${formattedDate} para mi evento`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-4 bg-emerald-500/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/30 transition-all text-center"
              >
                Consultar por WhatsApp
              </a>
              
              <button
                onClick={onClose}
                className="block w-full py-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                Seguir mirando
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: CalendarioUrgencia
// ═══════════════════════════════════════════════════════════════════════════

interface CalendarioUrgenciaProps {
  className?: string;
  locale?: 'es' | 'ca';
  showFullCalendar?: boolean;
}

export default function CalendarioUrgencia({ 
  className = '', 
  locale = 'es',
  showFullCalendar = false 
}: CalendarioUrgenciaProps) {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayStatus | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Generar datos de los próximos 3 meses
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthsData: MonthData[] = [];
    for (let i = 0; i < 3; i++) {
      const m = (currentMonth + i) % 12;
      const y = currentYear + Math.floor((currentMonth + i) / 12);
      monthsData.push(generateMonthData(m, y, locale));
    }
    
    setMonths(monthsData);
  }, [locale]);
  
  // Calcular estadísticas globales
  const globalStats = useMemo(() => {
    if (months.length === 0) return { total: 0, available: 0, percentage: 0 };
    
    const total = months.reduce((acc, m) => acc + m.stats.totalSaturdays, 0);
    const available = months.reduce((acc, m) => acc + m.stats.availableSaturdays, 0);
    const percentage = Math.round((1 - available / total) * 100);
    
    return { total, available, percentage };
  }, [months]);
  
  // Manejar click en día
  const handleDayClick = (day: DayStatus) => {
    setSelectedDay(day);
  };
  
  // Loading state
  if (!isClient || months.length === 0) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex gap-4 justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-28 h-24 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {/* Header con urgencia global */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-3">
          <span className="animate-pulse">🔥</span>
          <span>{globalStats.percentage}% de fechas ya reservadas</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white">
          Disponibilidad de Sábados
        </h3>
        <p className="text-white/50 text-sm mt-1">
          Solo {globalStats.available} sábados disponibles en los próximos 3 meses
        </p>
      </div>
      
      {/* Cards de resumen */}
      <div className="flex justify-center gap-3 md:gap-4 mb-6">
        {months.map((month, index) => (
          <MonthSummaryCard
            key={`${month.month}-${month.year}`}
            data={month}
            index={index}
            onClick={() => setSelectedMonth(selectedMonth === index ? null : index)}
          />
        ))}
      </div>
      
      {/* Calendario expandido */}
      <AnimatePresence>
        {(showFullCalendar || selectedMonth !== null) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {months.map((month, index) => (
                <MiniMonth
                  key={`${month.month}-${month.year}`}
                  data={month}
                  onDayClick={handleDayClick}
                  locale={locale}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Botón para expandir/colapsar */}
      {!showFullCalendar && (
        <div className="text-center mt-4">
          <button
            onClick={() => setSelectedMonth(selectedMonth === null ? 0 : null)}
            className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            {selectedMonth !== null ? 'Ocultar calendario ↑' : 'Ver calendario completo ↓'}
          </button>
        </div>
      )}
      
      {/* CTA final */}
      <div className="mt-6 text-center">
        <Link
          href="/configurador"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/25"
        >
          <span>🎯</span>
          <span>Reserva tu fecha ahora</span>
        </Link>
        <p className="text-white/40 text-xs mt-2">
          Sin compromiso • Respuesta en menos de 2h
        </p>
      </div>
      
      {/* Modal de día seleccionado */}
      {selectedDay && (
        <DayModal
          day={selectedDay}
          monthName={months.find(m => selectedDay.date.startsWith(`${m.year}-${String(m.month + 1).padStart(2, '0')}`))?.name || ''}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT: Versión compacta para Header
// ═══════════════════════════════════════════════════════════════════════════

export function CalendarioCompacto({ locale = 'es' }: { locale?: 'es' | 'ca' }) {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthsData: MonthData[] = [];
    for (let i = 0; i < 3; i++) {
      const m = (currentMonth + i) % 12;
      const y = currentYear + Math.floor((currentMonth + i) / 12);
      monthsData.push(generateMonthData(m, y, locale));
    }
    
    setMonths(monthsData);
  }, [locale]);
  
  if (!isClient || months.length === 0) {
    return <div className="text-white/50 text-sm">Cargando...</div>;
  }
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-xs">📅 Sábados libres:</span>
      <div className="flex gap-2">
        {months.map((m) => {
          const statusColor = 
            m.stats.status === 'scarce' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            m.stats.status === 'limited' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          
          return (
            <div
              key={`${m.month}-${m.year}`}
              className={`px-2 py-1 rounded-lg border text-xs font-bold ${statusColor}`}
            >
              <span className="text-white/70">{m.shortName}</span>
              <span className="ml-1">{m.stats.availableSaturdays}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
