// =============================================================================
// COMPONENT: AvailableMonths.tsx
// Substitueix el component actual que mostra NOV/DES/GEN per aquest
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Noms dels mesos en català (abreujats)
const MONTH_NAMES_CA: Record<number, string> = {
  0: 'GEN',
  1: 'FEB',
  2: 'MAR',
  3: 'ABR',
  4: 'MAI',
  5: 'JUN',
  6: 'JUL',
  7: 'AGO',
  8: 'SET',
  9: 'OCT',
  10: 'NOV',
  11: 'DES'
}

// Noms complets per a traducció
const MONTH_NAMES_FULL_CA: Record<number, string> = {
  0: 'Gener',
  1: 'Febrer',
  2: 'Març',
  3: 'Abril',
  4: 'Maig',
  5: 'Juny',
  6: 'Juliol',
  7: 'Agost',
  8: 'Setembre',
  9: 'Octubre',
  10: 'Novembre',
  11: 'Desembre'
}

interface MonthAvailability {
  month: number
  year: number
  name: string
  fullName: string
  availableSaturdays: number
  status: 'scarce' | 'limited' | 'available'
  statusLabel: string
}

// Simula disponibilitat - SUBSTITUEIX per dades reals de la BD
const getAvailabilityForMonth = (month: number, year: number): number => {
  // Això hauria de venir de la base de dades!
  // Per ara, simulem:
  const baseAvailability: Record<number, number> = {
    11: 1, // Desembre - 1 disponible (últims!)
    0: 3,  // Gener - 3 disponibles
    1: 4,  // Febrer - 4 disponibles
    2: 3,  // Març - 3 disponibles
    3: 2,  // Abril - 2 disponibles (temporada alta)
    4: 1,  // Maig - 1 disponible (temporada alta)
    5: 1,  // Juny - 1 disponible
    6: 2,  // Juliol - 2 disponibles
    7: 3,  // Agost - 3 disponibles
    8: 2,  // Setembre - 2 disponibles
    9: 3,  // Octubre - 3 disponibles
    10: 2, // Novembre - 2 disponibles
  }
  return baseAvailability[month] ?? 2
}

const getStatus = (available: number): { status: 'scarce' | 'limited' | 'available', label: string } => {
  if (available <= 1) return { status: 'scarce', label: 'Últims!' }
  if (available <= 2) return { status: 'limited', label: 'Pocs' }
  return { status: 'available', label: 'Disponibles' }
}

export function AvailableMonths() {
  // Estat inicial buit per evitar hydration mismatch
  const [monthsData, setMonthsData] = useState<MonthAvailability[]>([])
  const [isClient, setIsClient] = useState(false)

  // Calcula els 3 propers mesos NOMÉS al client
  useEffect(() => {
    setIsClient(true)
    const now = new Date()
    const currentMonth = now.getMonth() // 0-indexed
    const currentYear = now.getFullYear()

    const months: MonthAvailability[] = []

    for (let i = 0; i < 3; i++) {
      const monthIndex = (currentMonth + i) % 12
      const year = currentYear + Math.floor((currentMonth + i) / 12)
      const available = getAvailabilityForMonth(monthIndex, year)
      const { status, label } = getStatus(available)

      months.push({
        month: monthIndex,
        year,
        name: MONTH_NAMES_CA[monthIndex],
        fullName: MONTH_NAMES_FULL_CA[monthIndex],
        availableSaturdays: available,
        status,
        statusLabel: label
      })
    }

    setMonthsData(months)
  }, [])

  const statusColors = {
    scarce: {
      bg: 'from-red-900/80 to-red-950/90',
      border: 'border-red-500/50',
      number: 'text-red-400',
      glow: 'shadow-red-500/20'
    },
    limited: {
      bg: 'from-amber-900/80 to-amber-950/90',
      border: 'border-amber-500/50',
      number: 'text-amber-400',
      glow: 'shadow-amber-500/20'
    },
    available: {
      bg: 'from-green-900/80 to-green-950/90',
      border: 'border-green-500/50',
      number: 'text-green-400',
      glow: 'shadow-green-500/20'
    }
  }

  // No renderitzar res fins que el client estigui llest
  if (!isClient || monthsData.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-xl">📅</span>
          <span className="text-sm font-medium">Carregant disponibilitat...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Títol */}
      <div className="flex items-center gap-2 text-white/70">
        <span className="text-xl">📅</span>
        <span className="text-sm font-medium">Dissabtes disponibles:</span>
      </div>

      {/* Cards de mesos */}
      <div className="flex gap-3 md:gap-4">
        {monthsData.map((monthData, index) => {
          const colors = statusColors[monthData.status]
          
          return (
            <motion.div
              key={`${monthData.month}-${monthData.year}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex flex-col items-center
                px-4 py-3 md:px-6 md:py-4
                rounded-xl
                bg-gradient-to-b ${colors.bg}
                border ${colors.border}
                shadow-lg ${colors.glow}
                min-w-[80px] md:min-w-[100px]
              `}
            >
              {/* Nom del mes */}
              <span className="text-xs font-semibold text-white/90 tracking-wider">
                {monthData.name}.
              </span>
              
              {/* Número de dissabtes */}
              <span className={`
                text-2xl md:text-3xl font-bold font-mono
                ${colors.number}
              `}>
                {monthData.availableSaturdays}
              </span>
              
              {/* Status label */}
              <span className="text-[10px] md:text-xs text-white/60 mt-1">
                {monthData.statusLabel}
              </span>
            </motion.div>
          )
        })}
      </div>
      
      {/* Nota */}
      <p className="text-xs text-white/40 mt-2">
        Actualitzat automàticament
      </p>
    </div>
  )
}

// =============================================================================
// VERSIÓ SIMPLIFICADA (sense framer-motion) - HYDRATION SAFE
// =============================================================================

export function AvailableMonthsSimple() {
  const [months, setMonths] = useState<Array<{name: string, available: number, status: string, label: string}>>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const calculatedMonths = [0, 1, 2].map(i => {
      const monthIndex = (currentMonth + i) % 12
      const year = currentYear + Math.floor((currentMonth + i) / 12)
      const available = getAvailabilityForMonth(monthIndex, year)
      const { status, label } = getStatus(available)

      return {
        name: MONTH_NAMES_CA[monthIndex],
        available,
        status,
        label
      }
    })
    setMonths(calculatedMonths)
  }, [])

  if (!isClient || months.length === 0) {
    return <div className="text-white/50 text-sm">Carregant...</div>
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-white/70 text-sm">📅 Dissabtes disponibles:</span>
      <div className="flex gap-2">
        {months.map((m, i) => (
          <div
            key={i}
            className={`
              px-3 py-2 rounded-lg text-center min-w-[70px]
              ${m.status === 'scarce' ? 'bg-red-900/80 border border-red-500/50' : ''}
              ${m.status === 'limited' ? 'bg-amber-900/80 border border-amber-500/50' : ''}
              ${m.status === 'available' ? 'bg-green-900/80 border border-green-500/50' : ''}
            `}
          >
            <div className="text-xs text-white/70">{m.name}</div>
            <div className={`
              text-xl font-bold font-mono
              ${m.status === 'scarce' ? 'text-red-400' : ''}
              ${m.status === 'limited' ? 'text-amber-400' : ''}
              ${m.status === 'available' ? 'text-green-400' : ''}
            `}>
              {m.available}
            </div>
            <div className="text-[10px] text-white/50">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AvailableMonths
