// app/components/ui/footer.tsx
// ÒRBITA EVENTS - Footer BRUTAL v5 🔥
// El footer més seductor del sector esdeveniments!
// AMB TOTES les experiències temàtiques!

"use client";

import { Link } from '@/lib/navigation';
import { SITE_CONFIG } from '@/config/site-config';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Calculator,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Sparkles
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// TikTok icon custom
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// ========================================
// CONSTANTS
// ========================================

const CONTACT_INFO = {
  phone: SITE_CONFIG.business.phone,
  email: SITE_CONFIG.business.email,
  location: 'Granollers, Barcelona',
  coverage: ['Barcelona', 'Girona', 'Costa Brava', 'Maresme', 'Vallès'],
};

// Social links des de site-config
const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    icon: Instagram,
    href: SITE_CONFIG.social.instagram.url || '',
    color: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10',
    enabled: SITE_CONFIG.social.instagram.enabled,
  },
  {
    name: 'TikTok',
    icon: TikTokIcon,
    href: SITE_CONFIG.social.tiktok.url || '',
    color: 'hover:text-[#00F2EA] hover:bg-[#00F2EA]/10',
    enabled: SITE_CONFIG.social.tiktok.enabled,
  },
  {
    name: 'Facebook',
    icon: Facebook,
    href: SITE_CONFIG.social.facebook.url || '',
    color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10',
    enabled: SITE_CONFIG.social.facebook.enabled,
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    href: SITE_CONFIG.social.linkedin.url || '',
    color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10',
    enabled: SITE_CONFIG.social.linkedin.enabled,
  },
  {
    name: 'YouTube',
    icon: Youtube,
    href: SITE_CONFIG.social.youtube.url || '',
    color: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10',
    enabled: SITE_CONFIG.social.youtube.enabled,
  },
].filter(link => link.enabled && link.href);

// ═══════════════════════════════════════════════════════════════════
// SERVEIS (4 principals)
// ═══════════════════════════════════════════════════════════════════
const SERVICIOS_LINKS = [
  { nameKey: 'djWeddings', href: '/servicios/bodas', icon: '💍' },
  { nameKey: 'privateParties', href: '/servicios/fiestas', icon: '🎉' },
  { nameKey: 'corporateEvents', href: '/servicios/empresas', icon: '💼' },
  { nameKey: 'discomovil', href: '/servicios/discomovil', icon: '🎵' },
];

// ═══════════════════════════════════════════════════════════════════
// EXPERIÈNCIES TEMÀTIQUES - AQUÍ ESTÀ HALLOWEEN! 🎃🪄
// ═══════════════════════════════════════════════════════════════════
const EXPERIENCIAS_LINKS = [
  { nameKey: 'monMagic', href: '/tematica-mon-magic', icon: '🪄' },
  { nameKey: 'halloween', href: '/tematica-halloween', icon: '🎃' },
  { nameKey: 'bodaHalloween', href: '/boda-halloween', icon: '💀' },
  { nameKey: 'allExperiences', href: '/experiencias', icon: '✨' },
];

// Recursos
const RECURSOS_LINKS = [
  { nameKey: 'portfolio', href: '/portfolio' },
  { nameKey: 'faq', href: '/faq' },
  { nameKey: 'about', href: '/about' },
  { nameKey: 'reviews', href: '/opiniones' },
];

const LEGAL_LINKS = [
  { nameKey: 'privacy', href: '/legal/privacidad' },
  { nameKey: 'privacyPortal', href: '/privacitat' },
  { nameKey: 'terms', href: '/legal/terminos' },
  { nameKey: 'cookies', href: '/legal/cookies' },
  { nameKey: 'legalNotice', href: '/legal/aviso-legal' },
];

import { useAnalytics } from '@/lib/hooks/useAnalytics';

// ========================================
// MAIN FOOTER COMPONENT
// ========================================

export default function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const tStats = useTranslations('stats');
  const tFooterLinks = useTranslations('footerLinks');
  const { track } = useAnalytics();

  const handleLinkClick = (category: string, linkName: string) => {
    track('Footer_Link_Click', { category, link: linkName });
  };

  const handleSocialClick = (platform: string) => {
    track('Footer_Social_Click', { platform });
  };

  return (
    <footer
      className="bg-gradient-to-b from-zinc-950 to-black border-t border-white/10 relative overflow-hidden"
      role="contentinfo"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TRUST SIGNALS BAR - BRUTAL                                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="py-10 border-b border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { metric: '2+', labelKey: 'yearsExperience', icon: '⭐', color: 'from-amber-500/20 to-orange-500/20' },
              { metric: '48+', labelKey: 'eventsCompleted', icon: '🎉', color: 'from-purple-500/20 to-pink-500/20' },
              { metric: '2h', labelKey: 'response', icon: '⚡', color: 'from-green-500/20 to-emerald-500/20' },
              { metric: '', labelKey: 'coverage', icon: '📍', color: 'from-blue-500/20 to-cyan-500/20' },
            ].map((signal, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl bg-gradient-to-br ${signal.color} border border-white/5 hover:border-white/20 transition-all duration-300 group hover:scale-105`}
              >
                <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                  {signal.icon}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-white">
                  {signal.metric}
                </span>
                <span className="text-sm text-white/60 text-center">
                  {tStats(signal.labelKey)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MAIN FOOTER CONTENT                                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

            {/* ════════════════════════════════════════════════════════════ */}
            {/* COLUMN 1: BRAND & CONTACT                                    */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-2">
              {/* Logo amb glow */}
              <Link
                href="/"
                className="inline-block mb-6 group"
                onClick={() => handleLinkClick('brand', 'logo')}
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Image
                    src="/img/logoplanetatextdreta.svg"
                    alt="Òrbita Events"
                    width={200}
                    height={60}
                    className="h-14 w-auto relative z-10 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              <p className="text-white/70 mb-6 text-base leading-relaxed max-w-md">
                {tFooterLinks('description')}
              </p>

              {/* Coverage areas amb badges */}
              <div className="flex flex-wrap gap-2 mb-8">
                {CONTACT_INFO.coverage.map((city) => (
                  <span
                    key={city}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 hover:border-amber-500/30 transition-colors cursor-default"
                  >
                    {city}
                  </span>
                ))}
              </div>

              {/* Social Media amb efectes */}
              <div className="flex gap-2">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSocialClick(social.name)}
                      className={`p-3 rounded-xl bg-white/5 text-white/60 ${social.color} transition-all duration-200`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Visitar ${social.name}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* COLUMN 2: SERVICIOS                                          */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                {t('sections.services')}
              </h3>
              <ul className="space-y-3">
                {SERVICIOS_LINKS.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      href={link.href}
                      onClick={() => handleLinkClick('servicios', link.nameKey)}
                      className="text-white/60 hover:text-amber-400 text-sm transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      {tFooterLinks(`services.${link.nameKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* COLUMN 3: EXPERIÈNCIES TEMÀTIQUES 🔥                         */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                {t('sections.experiences')}
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h3>
              <ul className="space-y-3">
                {EXPERIENCIAS_LINKS.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      href={link.href}
                      onClick={() => handleLinkClick('experiencias', link.nameKey)}
                      className="text-white/60 hover:text-purple-400 text-sm transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      {tFooterLinks(`experiences.${link.nameKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* COLUMN 4: CONTACTE & CTA                                     */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                {t('sections.contact')}
              </h3>

              <ul className="space-y-4 mb-8">
                <li>
                  <a
                    href={`tel:${CONTACT_INFO.phone}`}
                    onClick={() => handleLinkClick('contact', 'phone')}
                    className="flex items-center gap-3 text-white/60 hover:text-green-400 text-sm transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="font-medium">{SITE_CONFIG.business.phoneDisplay}</span>
                  </a>
                </li>

                <li>
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    onClick={() => handleLinkClick('contact', 'email')}
                    className="flex items-center gap-3 text-white/60 hover:text-amber-400 text-sm transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <Mail className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="font-medium break-all">{CONTACT_INFO.email}</span>
                  </a>
                </li>

                <li className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-medium">{CONTACT_INFO.location}</span>
                </li>
              </ul>

              {/* CTAs */}
              <div className="space-y-3">
                <Link
                  href="/configurador"
                  onClick={() => handleLinkClick('cta', 'configurador')}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-orange-500/25"
                >
                  <Calculator className="w-4 h-4" />
                  {tCommon('buttons.configure')}
                </Link>

                <a
                  href="https://wa.me/34699121023"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('whatsappButton')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM BAR (Legal & Copyright)                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-white/40 text-sm text-center md:text-left" suppressHydrationWarning>
              © {new Date().getFullYear()} Òrbita Events · {t('since')} · {t('copyright')}
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              {LEGAL_LINKS.map((link, idx) => (
                <span key={link.nameKey} className="flex items-center gap-4">
                  <Link
                    href={link.href}
                    onClick={() => handleLinkClick('legal', link.nameKey)}
                    className="text-white/40 hover:text-amber-400 transition-colors"
                  >
                    {tFooterLinks(`legal.${link.nameKey}`)}
                  </Link>
                  {idx < LEGAL_LINKS.length - 1 && (
                    <span className="text-white/20" aria-hidden="true">
                      •
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
