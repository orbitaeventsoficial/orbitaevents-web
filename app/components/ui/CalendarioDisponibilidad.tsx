"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Check, X, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

// ============================================
// TIPOS
// ============================================

interface DiaDisponibilidad {
  fecha: string;
  disponible: boolean;
  motivo?: string;
  esFinDeSemana: boolean;
  esTemporadaAlta: boolean;
}

interface CalendarioMes {
  mes: string;
  year: number;
  dias: DiaDisponibilidad[];
  stats: {
    diasDisponibles: number;
    diasReservados: number;
    diasBloqueados: number;
  };
}

interface CalendarioDisponibilidadProps {
  onSelectDate?: (_fecha: string, _disponible: boolean) => void;
  className?: string;
}

// ============================================
// COMPONENTE
// ============================================

export default function CalendarioDisponibilidad({
  onSelectDate,
  className = "",
}: CalendarioDisponibilidadProps) {
  const t = useTranslations("calendar");
  const DIAS_SEMANA = t.raw("days") as string[];
  const MESES = t.raw("months") as string[];
  const [mesActual, setMesActual] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calendario, setCalendario] = useState<CalendarioMes | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch del calendario
  const fetchCalendario = useCallback(async (mes: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCalendario(data);
      }
    } catch (error) {
      console.error("Error fetching calendario:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendario(mesActual);
  }, [mesActual, fetchCalendario]);

  // Navegación de meses
  const cambiarMes = (direccion: number) => {
    const [year, month] = mesActual.split("-").map(Number);
    const nuevaFecha = new Date(year, month - 1 + direccion, 1);
    setMesActual(
      `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, "0")}`
    );
  };

  // Obtener el primer día del mes (0 = Domingo, ajustar a Lunes = 0)
  const getPrimerDiaSemana = () => {
    if (!calendario) return 0;
    const [year, month] = calendario.mes.split("-").map(Number);
    const primerDia = new Date(year, month - 1, 1).getDay();
    return primerDia === 0 ? 6 : primerDia - 1; // Ajustar para empezar en Lunes
  };

  // Handle click en día
  const handleDiaClick = (dia: DiaDisponibilidad) => {
    setSelectedDate(dia.fecha);
    onSelectDate?.(dia.fecha, dia.disponible);
  };

  // Parsear mes para mostrar
  const getMesDisplay = () => {
    if (!calendario) return "";
    const [year, month] = calendario.mes.split("-").map(Number);
    return `${MESES[month - 1]} ${year}`;
  };

  return (
    <div className={`bg-[var(--bg-surface)] rounded-2xl border border-white/10 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => cambiarMes(-1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={t("prevMonth")}
        >
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-oe-gold" />
          <h3 className="text-lg font-bold text-white">{getMesDisplay()}</h3>
        </div>

        <button
          onClick={() => cambiarMes(1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={t("nextMonth")}
        >
          <ChevronRight className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="text-center text-xs font-medium text-white/50 py-2"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-64 flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-oe-gold/30 border-t-oe-gold rounded-full animate-spin" />
          </motion.div>
        ) : calendario ? (
          <motion.div
            key={calendario.mes}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-7 gap-1"
          >
            {/* Espacios vacíos para alinear el primer día */}
            {Array.from({ length: getPrimerDiaSemana() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Días del mes */}
            {calendario.dias.map((dia) => {
              const diaNum = parseInt(dia.fecha.split("-")[2]);
              const isSelected = selectedDate === dia.fecha;
              
              return (
                <motion.button
                  key={dia.fecha}
                  onClick={() => handleDiaClick(dia)}
                  whileHover={{ scale: dia.disponible ? 1.1 : 1 }}
                  whileTap={{ scale: dia.disponible ? 0.95 : 1 }}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                    transition-all duration-200 relative
                    ${dia.disponible 
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer" 
                      : "bg-red-500/10 text-red-400/50 cursor-not-allowed"
                    }
                    ${dia.esFinDeSemana && dia.disponible ? "ring-1 ring-oe-gold/30" : ""}
                    ${isSelected ? "ring-2 ring-oe-gold" : ""}
                    ${dia.esTemporadaAlta && dia.disponible ? "bg-oe-gold/20 text-oe-gold" : ""}
                  `}
                  disabled={!dia.disponible}
                  title={dia.disponible ? t("available") : dia.motivo || t("notAvailable")}
                >
                  {diaNum}
                  
                  {/* Indicador de disponibilidad */}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2">
                    {dia.disponible ? (
                      <Check className="w-2 h-2 text-green-400" />
                    ) : (
                      <X className="w-2 h-2 text-red-400/50" />
                    )}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 flex items-center justify-center">
              <Check className="w-2 h-2 text-green-400" />
            </div>
            <span className="text-white/60">{t("available")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/10 flex items-center justify-center">
              <X className="w-2 h-2 text-red-400/50" />
            </div>
            <span className="text-white/60">{t("notAvailable")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-oe-gold/20 ring-1 ring-oe-gold/30" />
            <span className="text-white/60">{t("highSeason")}</span>
          </div>
        </div>

        {/* Stats */}
        {calendario && (
          <div className="mt-4 flex gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t("daysAvailable", { count: calendario.stats.diasDisponibles })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
