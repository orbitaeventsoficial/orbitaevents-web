'use client';

import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg className={`h-5 w-5 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ServicesIcon = ({ active }: { active: boolean }) => (
  <svg className={`h-5 w-5 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const PortfolioIcon = ({ active }: { active: boolean }) => (
  <svg className={`h-5 w-5 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ContactIcon = ({ active }: { active: boolean }) => (
  <svg className={`h-5 w-5 ${active ? 'text-amber-400' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

type NavItem = {
  id: string;
  href: string;
  labelKey: string;
  icon: ComponentType<{ active: boolean }>;
};

function NavLink({ href, active, label, icon: Icon }: { href: string; active: boolean; label: string; icon: ComponentType<{ active: boolean }> }) {
  const reduceMotion = useReducedMotion();

  return (
    <Link href={href} className="relative flex min-w-[54px] flex-col items-center gap-0.5 px-1 py-1.5 text-center">
      <div className="relative flex h-6 items-center justify-center">
        <Icon active={active} />
        {active && (
          <motion.div
            initial={false}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            className="absolute inset-0 rounded-full bg-amber-400/20 blur-md"
          />
        )}
      </div>
      <span className={`text-[9px] font-medium leading-none tracking-[0.01em] ${active ? 'text-amber-200' : 'text-white/50'}`}>{label}</span>
      {active && <span className="absolute -top-0.5 h-1 w-1 rounded-full bg-amber-400" />}
    </Link>
  );
}

export default function MobileBottomNav() {
  const locale = useLocale();
  const pathname = usePathname() || '';
  const t = useTranslations('mobileNav');
  const reduceMotion = useReducedMotion();

  const items = useMemo<NavItem[]>(() => [
    { id: 'home', href: `/${locale}`, labelKey: 'items.home', icon: HomeIcon },
    { id: 'services', href: `/${locale}/servicios`, labelKey: 'items.services', icon: ServicesIcon },
    { id: 'portfolio', href: `/${locale}/portfolio`, labelKey: 'items.portfolio', icon: PortfolioIcon },
    { id: 'contact', href: `/${locale}/contacto`, labelKey: 'items.contact', icon: ContactIcon },
  ], [locale]);

  const normalizedPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const activeId = useMemo(() => {
    if (normalizedPath === '/' || normalizedPath === '') return 'home';
    if (normalizedPath.startsWith('/servicios') || normalizedPath.startsWith('/tematica') || normalizedPath.startsWith('/experiencias')) return 'services';
    if (normalizedPath.startsWith('/portfolio')) return 'portfolio';
    if (normalizedPath.startsWith('/contacto') || normalizedPath.startsWith('/configurador')) return 'contact';
    return 'home';
  }, [normalizedPath]);

  return (
    <motion.nav
      aria-label={t('cta')}
      initial={reduceMotion ? false : { y: 64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="safe-bottom fixed bottom-0 left-0 right-0 z-50 px-3.5 pb-2"
    >
      <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_auto_1fr_1fr] items-end rounded-[24px] border border-white/8 bg-zinc-950/78 px-2.5 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <NavLink href={items[0].href} active={activeId === items[0].id} label={t(items[0].labelKey)} icon={items[0].icon} />
        <NavLink href={items[1].href} active={activeId === items[1].id} label={t(items[1].labelKey)} icon={items[1].icon} />
        <Link
          href={`/${locale}/configurador`}
          aria-label={t('fab.configurator')}
          className="mb-1 flex h-10.5 w-10.5 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-orange-400 text-black shadow-[0_8px_20px_rgba(251,191,36,0.24)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
        <NavLink href={items[2].href} active={activeId === items[2].id} label={t(items[2].labelKey)} icon={items[2].icon} />
        <NavLink href={items[3].href} active={activeId === items[3].id} label={t(items[3].labelKey)} icon={items[3].icon} />
      </div>
    </motion.nav>
  );
}
