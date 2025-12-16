// app/components/marketing/CTAFinal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - CTA FINAL BRUTAL v1.0
// ═══════════════════════════════════════════════════════════════════════════
//
// El cierre que CONVIERTE:
// - Urgencia con countdown
// - Doble CTA (configurador + WhatsApp)
// - Stats de confianza
// - Animaciones cinematográficas
// - Garantía visible
// - Fondo con efectos de luz
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Fire: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.87 2.47-7.17 5.91-8.41L12 2l3.09 3.59C18.53 6.83 21 10.13 21 14c0 4.97-4.03 9-9 9z"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: Disponibilidad
// ═══════════════════════════════════════════════════════════════════════════

function useAvailability(isEs: boolean) {
  const [data, setData] = useState<{ month: string; saturdays: number; status: 'scarce' | 'limited' | 'available' }>({ month: '', saturdays: 0, status: 'available' });

  useEffect(() => {
    const monthNamesCa = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
    const monthNamesEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthNames = isEs ? monthNamesEs : monthNamesCa;
    const mockAvailability: Record<number, number> = { 0: 3, 1: 4, 2: 3, 3: 2, 4: 1, 5: 2, 6: 3, 7: 4, 8: 2, 9: 3, 10: 2, 11: 1 };
    const month = new Date().getMonth();
    const sats = mockAvailability[month] || 2;
    setData({
      month: monthNames[month],
      saturdays: sats,
      status: sats <= 1 ? 'scarce' : sats <= 2 ? 'limited' : 'available'
    });
  }, [isEs]);

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CTAFinal() {
  const t = useTranslations('common');
  const isEs = t('language') === 'es';
  const availability = useAvailability(isEs);

  const statusColors = {
    scarce: 'from-red-500 to-rose-500',
    limited: 'from-amber-500 to-orange-500',
    available: 'from-emerald-500 to-teal-500',
  };

  const statusText = {
    scarce: isEs ? '⚠️ ¡Casi lleno!' : '⚠️ Gairebé ple!',
    limited: isEs ? '🔥 ¡Se acaba rápido!' : '🔥 S\'acaba ràpid!',
    available: isEs ? '✓ Disponible' : '✓ Disponible',
  };

  // Textos bilingües
  const texts = {
    saturdaysSingular: isEs ? 'sábado libre en' : 'dissabte lliure a',
    saturdaysPlural: isEs ? 'sábados libres en' : 'dissabtes lliures a',
    title1: isEs ? '¿Preparado para crear' : 'Preparat per crear',
    title2: isEs ? 'el evento perfecto?' : 'l\'event perfecte?',
    subtitle: isEs
      ? 'En 2 minutos tienes tu presupuesto personalizado. Sin compromiso.'
      : 'En 2 minuts tens el teu pressupost personalitzat. Sense compromís.',
    feature1: isEs ? 'Respuesta en < 2h' : 'Resposta en < 2h',
    feature2: isEs ? 'Garantía 100%' : 'Garantia 100%',
    feature3: isEs ? 'Sin sorpresas' : 'Sense sorpreses',
    ctaPrimary: isEs ? 'Pide Presupuesto Gratis' : 'Demana Pressupost Gratis',
    ctaSecondary: 'WhatsApp Directe',
    whatsappMsg: isEs
      ? 'Hola! Me gustaría información para mi evento.'
      : 'Hola! M\'agradaria informació per al meu event.',
    events: 'events',
    rating: isEs ? 'valoración' : 'valoració',
    payment: isEs ? 'Pago' : 'Pagament',
    secure: isEs ? 'seguro' : 'segur',
    guarantee: isEs
      ? '🛡️ Garantía de satisfacción 100%. Si no estás contento, te devolvemos el dinero.'
      : '🛡️ Garantia de satisfacció 100%. Si no estàs content, et tornem els diners.',
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background with animated gradients */}
      <div className="absolute inset-0 bg-zinc-950" />
      
      {/* Animated light beams */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-amber-500/20 via-transparent to-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-8"
          >
            <div className={`inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r ${statusColors[availability.status]} rounded-full`}>
              <Icons.Fire />
              <span className="font-bold text-white">
                {availability.saturdays} {availability.saturdays === 1 ? texts.saturdaysSingular : texts.saturdaysPlural} {availability.month}
              </span>
              <span className="text-white/80 text-sm">{statusText[availability.status]}</span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center mb-10"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              {texts.title1}
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                {texts.title2}
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {texts.subtitle}
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {[
              { icon: <Icons.Clock />, text: texts.feature1 },
              { icon: <Icons.Shield />, text: texts.feature2 },
              { icon: <Icons.Check />, text: texts.feature3 },
            ].map((feature, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/80 text-sm"
              >
                {feature.icon}
                <span>{feature.text}</span>
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            {/* Primary CTA */}
            <Link
              href="/configurador"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 overflow-hidden rounded-2xl w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] animate-gradient" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-3 text-black font-bold text-lg">
                <Icons.Sparkles />
                <span>{texts.ctaPrimary}</span>
              </span>
            </Link>

            {/* Secondary CTA */}
            <a
              href={`https://wa.me/34699121023?text=${encodeURIComponent(texts.whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl transition-all w-full sm:w-auto"
            >
              <Icons.WhatsApp />
              <span className="font-bold text-emerald-400 group-hover:text-emerald-300">
                {texts.ctaSecondary}
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span><strong className="text-white">+195</strong> {texts.events}</span>
            </span>
            <span className="hidden md:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span><strong className="text-white">4.9/5</strong> {texts.rating}</span>
            </span>
            <span className="hidden md:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>{texts.payment} <strong className="text-white">{texts.secure}</strong></span>
            </span>
          </motion.div>

          {/* Guarantee note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center text-white/40 text-sm mt-8"
          >
            {texts.guarantee}
          </motion.p>
        </div>
      </div>

      {/* Gradient animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
