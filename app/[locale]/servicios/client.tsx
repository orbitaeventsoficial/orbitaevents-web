'use client';

import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { WHATSAPP_NUMBER } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIOS CLIENT v2.0 - ESTIL ELEGANT
// ═══════════════════════════════════════════════════════════════════════════

interface Servicio {
  key: string;
  href: string;
  popular: boolean;
  icon: string;
  emoji: string;
  name: string;
  tagline: string;
  desc: string;
  features: string[];
}

interface ServiciosClientProps {
  servicios: Servicio[];
  texts: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    cta: string;
    configureButton: string;
    exploreBelow: string;
    equipment: string;
    backup: string;
    guarantee: string;
    mostPopular: string;
    viewService: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaResponseTime: string;
    ctaButton: string;
    ctaWhatsappMessage: string;
    ctaWhatsappButton: string;
  };
}

const Icons = {
  Arrow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Settings: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

export default function ServiciosClient({ servicios, texts }: ServiciosClientProps) {
  return (
    <>
      {/* HERO */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
              <span>⭐</span>
              {texts.badge}
            </span>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1]">
              {texts.title}
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {texts.titleHighlight}
              </span>
            </h1>

            <p className="text-xl text-white/60 max-w-3xl mx-auto mb-4">
              {texts.subtitle}
            </p>
            <p className="text-lg text-amber-400 font-medium mb-8">
              {texts.cta}
            </p>

            {/* CTA PROMINENTE CONFIGURADOR */}
            <div className="mb-10">
              <Link
                href="/configurador"
                className="group inline-flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-lg rounded-2xl transition-all hover:scale-105 hover:shadow-[0_8px_30px_rgba(251,191,36,0.3)]"
              >
                <Icons.Settings />
                {texts.configureButton}
                <Icons.Arrow />
              </Link>
              <p className="text-sm text-white/50 mt-4">
                {texts.exploreBelow}
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              {[texts.equipment, texts.backup, texts.guarantee].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-white/70">
                  <span className="text-amber-400"><Icons.Check /></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* GRID SERVICIOS */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={servicio.href}
                  className={`
                    group relative block h-full rounded-3xl p-8 transition-all duration-300
                    bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm
                    border hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10
                    ${servicio.popular
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-white/10 hover:border-amber-500/30'
                    }
                  `}
                >
                  {servicio.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        {texts.mostPopular}
                      </span>
                    </div>
                  )}

                  {/* Emoji icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-3xl">
                    {servicio.emoji}
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {servicio.name}
                  </h2>

                  <p className="text-sm font-medium text-amber-400/80 mb-3">
                    {servicio.tagline}
                  </p>

                  <p className="text-white/60 mb-6 leading-relaxed">
                    {servicio.desc}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {servicio.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                        <span className="text-amber-400"><Icons.Check /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-amber-400 font-semibold group-hover:gap-4 transition-all">
                    {texts.viewService}
                    <Icons.Arrow />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">
              {texts.ctaTitle}
            </h2>
            <p className="text-xl text-white/60 mb-4">
              {texts.ctaSubtitle}
            </p>
            <p className="text-lg text-amber-400 font-medium mb-10">
              {texts.ctaResponseTime}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texts.ctaWhatsappMessage)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-[#25D366] hover:bg-[#20BD5A] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] text-white font-bold text-lg"
              >
                <Icons.WhatsApp />
                <span>{texts.ctaWhatsappButton}</span>
              </a>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-lg rounded-2xl transition-all hover:scale-105"
              >
                {texts.ctaButton}
                <Icons.Arrow />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
