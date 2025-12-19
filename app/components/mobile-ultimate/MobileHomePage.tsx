'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE HOME PAGE - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Página principal móvil que integra todos los componentes:
 * - App Shell con PWA features
 * - Hero inmersivo
 * - Servicios en carrusel 3D
 * - Testimonios tipo Reels
 * - CTA con urgencia
 * - Bottom navigation
 * 
 * 100% optimizada para móvil
 */

import MobileAppShell from './MobileAppShell';
import MobileHeroUltimate from './MobileHeroUltimate';
import MobileServicesCards from './MobileServicesCards';
import MobileTestimonialsReels from './MobileTestimonialsReels';
import MobileCTAUrgency from './MobileCTAUrgency';
import MobileBottomNav from './MobileBottomNav';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// QUICK FEATURES SECTION
// ═══════════════════════════════════════════════════════════════════════════

function QuickFeatures() {
  const features = [
    { icon: '🎃', title: 'Halloween', desc: 'Decoració completa' },
    { icon: '🪄', title: 'Món Màgic', desc: 'Experiències úniques' },
    { icon: '🎵', title: 'DJ Pro', desc: 'Pioneer + 4000W' },
    { icon: '✨', title: 'Efectes FX', desc: 'Fum, llums, espurnes' },
  ];

  return (
    <section className="py-8 px-6">
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <span className="text-3xl">{feature.icon}</span>
            <h3 className="text-white font-bold mt-2">{feature.title}</h3>
            <p className="text-white/50 text-sm">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARANTEE SECTION
// ═══════════════════════════════════════════════════════════════════════════

function GuaranteeSection() {
  const guarantees = [
    {
      icon: '🛡️',
      title: 'Garantia 100%',
      desc: 'Si no estàs content, et tornem els diners',
    },
    {
      icon: '🔧',
      title: 'Backup complet',
      desc: 'Equip duplicat. El teu event MAI es para',
    },
    {
      icon: '⚡',
      title: 'Resposta 2h',
      desc: 'Comunicació directa i sense intermediaris',
    },
  ];

  return (
    <section className="py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <span className="text-amber-500 text-sm font-medium tracking-wider uppercase">
          Tranquil·litat garantida
        </span>
        <h2 className="text-2xl font-black text-white mt-2">
          El teu event, sense riscos
        </h2>
      </motion.div>

      <div className="space-y-4">
        {guarantees.map((guarantee, i) => (
          <motion.div
            key={guarantee.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-white/5 to-transparent border border-white/10"
          >
            <span className="text-3xl">{guarantee.icon}</span>
            <div>
              <h3 className="text-white font-bold">{guarantee.title}</h3>
              <p className="text-white/50 text-sm">{guarantee.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER SIMPLE
// ═══════════════════════════════════════════════════════════════════════════

function MobileFooter() {
  return (
    <footer className="py-8 px-6 pb-24 border-t border-white/10">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-black font-black text-lg">Ò</span>
          </div>
          <span className="text-white font-bold text-xl">Òrbita Events</span>
        </div>

        {/* Tagline */}
        <p className="text-white/50 text-sm mb-6">
          Events temàtics que ningú més fa
        </p>

        {/* Location */}
        <div className="flex items-center justify-center gap-2 text-white/40 text-sm mb-4">
          <span>📍</span>
          <span>Barcelona i Girona</span>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-4 mb-6">
          <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
          </a>
        </div>

        {/* Legal */}
        <div className="flex justify-center gap-4 text-white/30 text-xs">
          <a href="/legal/privacidad" className="hover:text-white/60">Privacitat</a>
          <span>·</span>
          <a href="/legal/cookies" className="hover:text-white/60">Cookies</a>
          <span>·</span>
          <a href="/legal/aviso-legal" className="hover:text-white/60">Legal</a>
        </div>

        {/* Copyright */}
        <p className="text-white/20 text-xs mt-4">
          © 2024 Òrbita Events. Tots els drets reservats.
        </p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileHomePage() {
  return (
    <MobileAppShell showSplash={true}>
      {/* Hero */}
      <MobileHeroUltimate />

      {/* Quick Features */}
      <QuickFeatures />

      {/* Services */}
      <MobileServicesCards />

      {/* Testimonials */}
      <MobileTestimonialsReels />

      {/* Guarantees */}
      <GuaranteeSection />

      {/* Final CTA */}
      <MobileCTAUrgency />

      {/* Footer */}
      <MobileFooter />

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </MobileAppShell>
  );
}
