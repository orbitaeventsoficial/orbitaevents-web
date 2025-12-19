'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE CTA URGENCY - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Call to Action final con:
 * - Contador de disponibilidad en tiempo real
 * - Animaciones de urgencia
 * - Social proof
 * - Múltiples CTAs
 * - Garantía visible
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useMobile } from './MobileAppShell';

// ═══════════════════════════════════════════════════════════════════════════
// AVAILABILITY COUNTER
// ═══════════════════════════════════════════════════════════════════════════

function AvailabilityCounter() {
  const [availability, setAvailability] = useState({
    saturdays: 3,
    month: 'octubre',
    loading: true,
  });

  useEffect(() => {
    // Simular fetch de disponibilidad
    const fetchAvailability = async () => {
      try {
        const res = await fetch('/api/public/availability?month=10&year=2025');
        if (res.ok) {
          const data = await res.json();
          setAvailability({
            saturdays: data.freeSaturdays || 3,
            month: 'octubre',
            loading: false,
          });
        } else {
          setAvailability(prev => ({ ...prev, loading: false }));
        }
      } catch {
        setAvailability(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAvailability();
  }, []);

  const getUrgencyLevel = () => {
    if (availability.saturdays <= 1) return 'critical';
    if (availability.saturdays <= 2) return 'high';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();
  
  const colors = {
    critical: {
      bg: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    high: {
      bg: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    normal: {
      bg: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
  };

  const style = colors[urgencyLevel];

  if (availability.loading) {
    return (
      <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-4 rounded-2xl bg-gradient-to-r ${style.bg} border ${style.border} ${style.glow} shadow-xl overflow-hidden`}
    >
      {/* Animated background for critical */}
      {urgencyLevel === 'critical' && (
        <motion.div
          className="absolute inset-0 bg-red-500/10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-white/60 text-xs mb-1">🎃 Halloween 2025</p>
          <p className={`font-black text-2xl ${style.text}`}>
            {availability.saturdays} dissabtes lliures
          </p>
          <p className="text-white/50 text-xs">{availability.month}</p>
        </div>

        {urgencyLevel !== 'normal' && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className={`px-3 py-1.5 rounded-full ${
              urgencyLevel === 'critical' 
                ? 'bg-red-500 text-white' 
                : 'bg-orange-500 text-black'
            } text-xs font-bold`}
          >
            {urgencyLevel === 'critical' ? '⚠️ Últim!' : '🔥 Últimes!'}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRUST BADGES
// ═══════════════════════════════════════════════════════════════════════════

function TrustBadges() {
  const badges = [
    { icon: '⭐', value: '4.9', label: 'Rating' },
    { icon: '🎉', value: '48+', label: 'Events' },
    { icon: '⚡', value: '2h', label: 'Resposta' },
  ];

  return (
    <div className="flex justify-center gap-6">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="text-center"
        >
          <span className="text-xl">{badge.icon}</span>
          <p className="text-white font-bold text-lg">{badge.value}</p>
          <p className="text-white/40 text-xs">{badge.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileCTAUrgency() {
  const { haptic } = useMobile();

  return (
    <section className="py-16 px-6">
      {/* Background decoration */}
      <div className="relative">
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px]" />

        <div className="relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-black text-white mb-3">
              Preparat per crear
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                el teu event?
              </span>
            </h2>
            <p className="text-white/60">
              Resposta garantida en menys de 2 hores
            </p>
          </motion.div>

          {/* Availability Counter */}
          <div className="mb-8">
            <AvailabilityCounter />
          </div>

          {/* CTAs */}
          <div className="space-y-3 mb-8">
            {/* Primary CTA */}
            <motion.a
              href="/contacto"
              whileTap={{ scale: 0.98 }}
              onTapStart={() => haptic('medium')}
              className="relative block w-full group"
            >
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-xl opacity-50 group-active:opacity-70 transition-opacity" />
              
              <div className="relative flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-bold text-black text-lg shadow-2xl">
                <span>Demana pressupost gratis</span>
                <motion.svg 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </div>
            </motion.a>

            {/* Secondary CTA */}
            <motion.a
              href="https://wa.me/34699121023?text=Hola!%20Vull%20info%20sobre%20events%20temàtics"
              whileTap={{ scale: 0.98 }}
              onTapStart={() => haptic('light')}
              className="flex items-center justify-center gap-3 py-4 px-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 font-semibold text-white"
            >
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp directe</span>
            </motion.a>
          </div>

          {/* Trust badges */}
          <TrustBadges />

          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="text-green-400">🛡️</span>
              <span className="text-green-400 text-sm font-medium">
                Garantia 100% satisfacció
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
