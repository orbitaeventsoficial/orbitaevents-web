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
import './admin-theme.css';
import './control-room.css';
import './admin-shell.css';

/* ── Grups de navegació ───────────────────────────────────────────────────── */
type NavGroup = { id: string; label: string; items: { label: string; href: string }[] };

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'comercial', label: 'Comercial',
    items: [
      { label: 'Temporada', href: '/admin/leads' },
      { label: 'Clients', href: '/admin/clientes' },
      { label: 'Pressupostos', href: '/admin/presupuestos' },
      { label: 'Entrada ràpida', href: '/admin/intake' },
    ],
  },
  {
    id: 'operacio', label: 'Operació',
    items: [
      { label: 'Reserves', href: '/admin/bookings' },
      { label: 'Calendari', href: '/admin/calendario' },
      { label: 'Tasques', href: '/admin/tasks' },
      { label: 'Inventari', href: '/admin/inventory' },
      { label: 'Packs', href: '/admin/packs' },
    ],
  },
  {
    id: 'economia', label: 'Economia',
    items: [
      { label: 'Finances', href: '/admin/economia' },
      { label: 'Pricing', href: '/admin/pricing' },
      { label: 'Reporting', href: '/admin/reporting' },
      { label: 'Analytics', href: '/admin/analytics' },
    ],
  },
  {
    id: 'marqueting', label: 'Màrqueting',
    items: [
      { label: 'Hub', href: '/admin/marketing' },
      { label: 'Portfolio', href: '/admin/portfolio' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Social', href: '/admin/social' },
      { label: 'Ressenyes', href: '/admin/ressenyes' },
    ],
  },
  {
    id: 'sistema', label: 'Sistema',
    items: [
      { label: 'Safata', href: '/admin/inbox' },
      { label: 'Configuració', href: '/admin/settings' },
      { label: 'Manual', href: '/admin/manual' },
      { label: 'Salut', href: '/admin/salut' },
      { label: 'Crons', href: '/admin/crons' },
    ],
  },
];

function getGroupForPath(pathname: string): string {
  if (
    pathname.startsWith('/admin/leads') ||
    pathname.startsWith('/admin/clientes') ||
    pathname.startsWith('/admin/presupuestos') ||
    pathname.startsWith('/admin/intake') ||
    pathname.startsWith('/admin/quick-create') ||
    pathname.startsWith('/admin/sales-ops')
  ) return 'comercial';
  if (
    pathname.startsWith('/admin/bookings') ||
    pathname.startsWith('/admin/calendario') ||
    pathname.startsWith('/admin/tasks') ||
    pathname.startsWith('/admin/inventory') ||
    pathname.startsWith('/admin/packs')
  ) return 'operacio';
  if (
    pathname.startsWith('/admin/economia') ||
    pathname.startsWith('/admin/pricing') ||
    pathname.startsWith('/admin/reporting') ||
    pathname.startsWith('/admin/analytics') ||
    pathname.startsWith('/admin/cost-calculator')
  ) return 'economia';
  if (
    pathname.startsWith('/admin/marketing') ||
    pathname.startsWith('/admin/portfolio') ||
    pathname.startsWith('/admin/blog') ||
    pathname.startsWith('/admin/social') ||
    pathname.startsWith('/admin/ressenyes') ||
    pathname.startsWith('/admin/google-reviews') ||
    pathname.startsWith('/admin/campaigns')
  ) return 'marqueting';
  return 'sistema';
}

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
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
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
                          className={pathname?.startsWith(item.href) ? 'is-on' : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="ax__sideactions">
              <Link href="/admin/intake" className="ax__add">
                Nova entrada
              </Link>
            </div>

            <div className="ax__sidefoot">
              <span className="ax__meav" title="Òrbita Events">OE</span>
              <span className="ax__sidefootname">Òrbita Events</span>
              <span className="ax__change">#{ADMIN_CHANGE_COUNTER}</span>
            </div>
          </aside>

          {/* ── Contingut principal ──────────────────────────────────────── */}
          <div className="ax__workspace">
            <main id="admin-main-content" className="ax__page">
              {children}
            </main>
          </div>

        </div>
      </div>
    </ToastProvider>
  );
}
