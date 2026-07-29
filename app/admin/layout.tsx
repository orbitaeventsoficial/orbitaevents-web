'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AdminHelpModeProvider } from './components/AdminHelpMode';
import { ToastProvider } from './components/ToastProvider';
import { useCsrfFetch } from '@/hooks/useCsrfFetch';
import { log } from '@/lib/logger';
import { ADMIN_CHANGE_COUNTER } from '@/lib/constants/admin';
import { NAV_GROUPS, getGroupForPath, type NavItem, type NavGroup } from './lib/adminNav';
import MaximsTicker from './components/MaximsTicker';
import '../studio/orbita-tokens.css';
import './admin-theme.css';
import './admin-shell.css';

/* Grups de navegació + mapa ruta→òrgan: font única a `./lib/adminNav`. */

/* ── Layout principal ─────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminHelpModeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminHelpModeProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string>(() => getGroupForPath(pathname ?? ''));
  useCsrfFetch();

  /* admin-mode + scroll-unlocked per compatibilitat CSS durant la migració */
  useEffect(() => {
    document.documentElement.classList.add('admin-mode', 'scroll-unlocked');
    document.body.classList.add('admin-mode', 'scroll-unlocked');
    return () => {
      document.documentElement.classList.remove('admin-mode', 'scroll-unlocked');
      document.body.classList.remove('admin-mode', 'scroll-unlocked');
    };
  }, []);

  /* Segueix el grup actiu amb el pathname */
  useEffect(() => {
    setActiveGroup(getGroupForPath(pathname ?? ''));
  }, [pathname]);

  /* Service worker (prod) */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocal) {
      // En dev: desregistrar el SW I esborrar les caches, perquè no serveixi
      // chunks JS vells (causa de "veig el codi d'abans" en desenvolupament).
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => (typeof caches !== 'undefined' ? caches.keys() : []))
        .then((keys) => Promise.all((keys as string[]).map((k) => caches.delete(k))))
        .catch((e) => log.warn('SW cleanup', { error: String(e) }));
      return;
    }
    navigator.serviceWorker.register('/sw.js')
      .catch((e) => log.warn('SW register', { error: String(e) }));
  }, []);

  const activeGroupData = NAV_GROUPS.find((g) => g.id === activeGroup) ?? NAV_GROUPS[0];

  return (
    <ToastProvider>
      <div className="ax-root">
        <div className="ax ax--side">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="ax__side">
            <div className="ax__brand">
              <Image
                src="/img/logoplanetatextdreta.svg"
                alt="Òrbita Events"
                width={140} height={46}
                priority
                className="ax__logo"
              />
            </div>

            {/* Accions primàries al capdamunt */}
            <div className="ax__sidetop">
              <Link
                href="/admin/inbox"
                className={`ax__inbox${pathname?.startsWith('/admin/inbox') ? ' is-on' : ''}`}
              >
                ✉ Safata
              </Link>
              <Link href="/admin/intake" className="ax__add">
                + Nova entrada
              </Link>
            </div>

            <nav className="ax__sidenav" aria-label="Àrees de treball">
              {NAV_GROUPS.map((g) => (
                <div key={g.id} className={`ax__sidegroup${g.id === activeGroup ? ' is-active' : ''}`}>
                  <button
                    type="button"
                    className="ax__sideitem"
                    aria-current={g.id === activeGroup ? 'true' : undefined}
                    onClick={() => setActiveGroup(g.id)}
                  >
                    {g.label}
                  </button>
                  {g.id === activeGroup && (
                    <div className="ax__sidesub">
                      {activeGroupData.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={[
                            pathname?.startsWith(item.href) ? 'is-on' : '',
                            item.secondary ? 'is-secondary' : '',
                          ].filter(Boolean).join(' ') || undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="ax__sidefoot">
              <span className="ax__meav" title="Òrbita Events">OE</span>
              <span className="ax__sidefootname">Òrbita Events</span>
              <span className="ax__change" suppressHydrationWarning>#{ADMIN_CHANGE_COUNTER}</span>
            </div>
          </aside>

          {/* ── Contingut principal ──────────────────────────────────────── */}
          <div className="ax__workspace">
            <main id="admin-main-content" className="ax__page">
              {/* Brúixola d'Economia: màximes rotant al top de TOTES les pàgines admin (#1391) */}
              <MaximsTicker />
              {children}
            </main>
          </div>

        </div>
      </div>
    </ToastProvider>
  );
}
