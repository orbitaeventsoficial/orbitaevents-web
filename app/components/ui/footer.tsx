// app/components/ui/footer.tsx
// ÒRBITA EVENTS - Footer BRUTAL v5 🔥
// El footer més seductor del sector esdeveniments!
// AMB TOTES les experiències temàtiques!

"use client";

import { Link } from '@/lib/navigation';
import { SITE_CONFIG } from '@/app/config/site-config';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Calculator,
  Instagram,
  Linkedin,
  Youtube,
  Sparkles
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PUBLIC_FOOTER_DEFAULT_COVERAGE, PUBLIC_FOOTER_EXPERIENCES_LINKS, PUBLIC_FOOTER_LEGAL_LINKS, PUBLIC_FOOTER_RESOURCES_LINKS, PUBLIC_FOOTER_SOCIAL_LINK_META, WHATSAPP_URL } from '@/lib/constants';
import { PUBLIC_CORE_SERVICE_NAV } from '@/lib/publicServiceCatalog';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useManagedImageSrc } from '@/lib/hooks/useManagedImageSrc';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SOCIAL_ICON_MAP = {
  Instagram,
  TikTok: TikTokIcon,
  LinkedIn: Linkedin,
  YouTube: Youtube,
} as const;

const SOCIAL_LINKS = PUBLIC_FOOTER_SOCIAL_LINK_META.map((item) => {
  const config = SITE_CONFIG.social[item.configKey];
  return {
    ...item,
    icon: SOCIAL_ICON_MAP[item.name],
    href: config.url || '',
    enabled: config.enabled,
  };
}).filter((link) => link.enabled && link.href);

export default function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const tFooterLinks = useTranslations('footerLinks');
  const { track } = useAnalytics();
  const rawCoverage = t.raw('coverageAreas');
  const localizedCoverage = Array.isArray(rawCoverage) ? rawCoverage : [...PUBLIC_FOOTER_DEFAULT_COVERAGE];
  const [coverageAreas, setCoverageAreas] = useState<string[]>(localizedCoverage);
  const managedLogoSrc = useManagedImageSrc('layout.logo.header', '/img/logoplanetatextdreta.svg');

  useEffect(() => {
    let cancelled = false;

    const loadCoverage = async () => {
      try {
        const res = await fetch('/api/public/coverage', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !Array.isArray(data?.cities) || cancelled) return;
        if (data.cities.length > 0) {
          setCoverageAreas(data.cities);
        }
      } catch {
        // Silent fallback to localized static coverage.
      }
    };

    void loadCoverage();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLinkClick = (category: string, linkName: string) => {
    track('Footer_Link_Click', { category, link: linkName });
  };

  const handleSocialClick = (platform: string) => {
    track('Footer_Social_Click', { platform });
  };

  return (
    <footer
      id="footer"
      className="bg-gradient-to-b from-zinc-950 to-black border-t border-white/[0.06] relative overflow-hidden oe-grid-pattern"
      role="contentinfo"
    >
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="inline-block mb-6 group"
                onClick={() => handleLinkClick('brand', 'logo')}
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Image
                    src={managedLogoSrc}
                    alt="Òrbita Events"
                    width={200}
                    height={60}
                    sizes="200px"
                    quality={80}
                    className="h-14 w-auto relative z-10 group-hover:scale-105 transition-transform duration-300"
                    unoptimized={managedLogoSrc.includes('/api/uploads/')}
                  />
                </div>
              </Link>

              <p className="text-white/70 mb-6 text-base leading-relaxed max-w-md">
                {tFooterLinks('description')}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {coverageAreas.map((city) => (
                  <span
                    key={city}
                    className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-white/70 text-sm font-medium hover:bg-zinc-800 hover:border-amber-500/30 transition-colors cursor-default"
                  >
                    {city}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => handleSocialClick(social.name)}
                      className={`p-3 rounded-xl bg-zinc-900 text-white/60 ${social.color} transition-all duration-200`}
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

            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                {t('sections.services')}
              </h3>
              <ul className="space-y-3">
                {PUBLIC_CORE_SERVICE_NAV.map((link) => (
                  <li key={link.footerNameKey}>
                    <Link
                      href={link.href}
                      onClick={() => handleLinkClick('servicios', link.footerNameKey)}
                      className="text-white/60 hover:text-amber-400 text-sm transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      {tFooterLinks(`services.${link.footerNameKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                {t('sections.experiences')}
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h3>
              <ul className="space-y-3">
                {PUBLIC_FOOTER_EXPERIENCES_LINKS.map((link) => (
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

            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                {t('sections.resources')}
              </h3>
              <ul className="space-y-3">
                {PUBLIC_FOOTER_RESOURCES_LINKS.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      href={link.href}
                      onClick={() => handleLinkClick('recursos', link.nameKey)}
                      className="text-white/60 hover:text-blue-400 text-sm transition-colors inline-flex items-center gap-2 group"
                    >
                      {tFooterLinks(`resources.${link.nameKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                {t('sections.contact')}
              </h3>

              <ul className="space-y-4 mb-8">
                <li>
                  <a
                    href={`tel:${SITE_CONFIG.business.phone}`}
                    onClick={() => handleLinkClick('contact', 'phone')}
                    className="flex items-center gap-3 text-white/60 hover:text-green-400 text-sm transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <Phone className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="font-medium">{SITE_CONFIG.business.phoneDisplay}</span>
                  </a>
                </li>

                <li>
                  <a
                    href={`mailto:${SITE_CONFIG.business.email}`}
                    onClick={() => handleLinkClick('contact', 'email')}
                    className="flex items-center gap-3 text-white/60 hover:text-amber-400 text-sm transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <Mail className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="font-medium break-all">{SITE_CONFIG.business.email}</span>
                  </a>
                </li>

                <li className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-blue-500/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-medium">{t('location')}</span>
                </li>
              </ul>

              <div className="space-y-3">
                <Link
                  href="/configurador"
                  onClick={() => handleLinkClick('cta', 'configurador')}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:scale-105 transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-[0_8px_32px_rgba(251,191,36,0.3)]"
                >
                  <Calculator className="w-4 h-4" />
                  {tCommon('buttons.configure')}
                </Link>

                <a
                  href={WHATSAPP_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all duration-300 hover:shadow-[0_6px_20px_rgba(34,197,94,0.25)]"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  {t('whatsappButton')}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 pb-24 lg:pb-6 border-t border-white/10 bg-black relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Òrbita Events · {t('since')} · {t('copyright')}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm pr-20 md:pr-0">
              {PUBLIC_FOOTER_LEGAL_LINKS.map((link, idx) => (
                <span key={link.nameKey} className="flex items-center gap-4">
                  <Link
                    href={link.href}
                    onClick={() => handleLinkClick('legal', link.nameKey)}
                    className="text-white/60 hover:text-amber-400 transition-colors"
                  >
                    {tFooterLinks(`legal.${link.nameKey}`)}
                  </Link>
                  {idx < PUBLIC_FOOTER_LEGAL_LINKS.length - 1 && (
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
