'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePublicStats } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// CTA FINAL BRUTAL v2.0
// ═══════════════════════════════════════════════════════════════════════════
// CANVIS:
// 1. WhatsApp com a CTA PRIMARI (80% tràfic mòbil vol parlar directe)
// 2. Configurador com a secundari
// 3. Menys text, més acció
// 4. Urgència real amb disponibilitat
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  WhatsApp: () => (
    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Fire: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.87 2.47-7.17 5.91-8.41L12 2l3.09 3.59C18.53 6.83 21 10.13 21 14c0 4.97-4.03 9-9 9z"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

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

export default function CTAFinal() {
  const t = useTranslations('common');
  const isEs = t('language') === 'es';
  const availability = useAvailability(isEs);
  const { stats } = usePublicStats();

  const statusColors = {
    scarce: 'from-red-500 to-rose-500',
    limited: 'from-amber-500 to-orange-500',
    available: 'from-emerald-500 to-teal-500',
  };

  const statusText = {
    scarce: isEs ? '⚠️ ¡Casi lleno!' : '⚠️ Gairebé ple!',
    limited: isEs ? '🔥 ¡Se acaba!' : '🔥 S\'acaba!',
    available: isEs ? '✓ Disponible' : '✓ Disponible',
  };

  const texts = {
    saturdaysSingular: isEs ? 'sábado libre en' : 'dissabte lliure a',
    saturdaysPlural: isEs ? 'sábados libres en' : 'dissabtes lliures a',
    title1: isEs ? '¿Listo para' : 'Preparat per',
    title2: isEs ? 'crear tu evento?' : 'crear el teu event?',
    subtitle: isEs
      ? 'Escríbenos y te respondemos en menos de 2 horas.'
      : 'Escriu-nos i et responem en menys de 2 hores.',
    ctaPrimary: isEs ? 'Escríbenos por WhatsApp' : 'Escriu-nos per WhatsApp',
    ctaSecondary: isEs ? 'Ver precios' : 'Veure preus',
    whatsappMsg: isEs
      ? 'Hola! Quiero información para mi evento.'
      : 'Hola! Vull informació per al meu event.',
    events: 'events',
    rating: isEs ? 'valoración' : 'valoració',
    guarantee: isEs
      ? '🛡️ Garantía 100%. Si no estás contento, te devolvemos el dinero.'
      : '🛡️ Garantia 100%. Si no estàs content, et tornem els diners.',
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          
          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-6"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${statusColors[availability.status]} rounded-full text-white text-sm font-semibold`}>
              <Icons.Fire />
              <span>
                {availability.saturdays} {availability.saturdays === 1 ? texts.saturdaysSingular : texts.saturdaysPlural} {availability.month}
              </span>
              <span className="text-white/80 text-xs">{statusText[availability.status]}</span>
            </div>
          </motion.div>

          {/* Heading - MÉS CURT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {texts.title1}
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {texts.title2}
              </span>
            </h2>
            <p className="text-lg text-white/60">
              {texts.subtitle}
            </p>
          </motion.div>

          {/* CTAs - WhatsApp PRIMER i MÉS GRAN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-3 mb-10"
          >
            {/* WhatsApp - PRIMARI */}
            <a
              href={`https://wa.me/34699121023?text=${encodeURIComponent(texts.whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-8 py-5 bg-[#25D366] hover:bg-[#20BD5A] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)]"
            >
              <Icons.WhatsApp />
              <span className="font-bold text-white text-lg">{texts.ctaPrimary}</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            </a>

            {/* Configurador - SECUNDARI */}
            <Link
              href="/configurador"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-white/80 hover:text-white"
            >
              <span className="font-medium">{texts.ctaSecondary}</span>
              <Icons.Arrow />
            </Link>
          </motion.div>

          {/* Trust - SIMPLIFICAT */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm mb-6"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span><strong className="text-white">+{stats.totalEvents}</strong> {texts.events}</span>
            </span>
            <span className="w-px h-4 bg-white/20" />
            <span className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span><strong className="text-white">4.9/5</strong> {texts.rating}</span>
            </span>
            <span className="w-px h-4 bg-white/20" />
            <span className="flex items-center gap-1">
              <Icons.Clock />
              <span><strong className="text-white">&lt;2h</strong> resposta</span>
            </span>
          </motion.div>

          {/* Guarantee */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/40 text-sm"
          >
            {texts.guarantee}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
