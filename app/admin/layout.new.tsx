'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HelpProvider, HelpToggleButton } from './components/HelpSystem';

/**
 * 🎨 ADMIN LAYOUT v2 - Simplificat i professional
 * 
 * CANVIS RESPECTE ANTERIOR:
 * - De 930 línies a ~400
 * - Navegació simplificada (de 32 opcions a 15)
 * - Sistema d'ajuda integrat
 * - Millor organització visual
 */

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

type NavItem = {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'red';
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ DE NAVEGACIÓ SIMPLIFICADA
// ═══════════════════════════════════════════════════════════════════════════

const PRIORITY_NAV: NavItem[] = [
  { icon: '📥', label: 'Entrades', href: '/admin/leads' },
  { icon: '👤', label: 'Clients', href: '/admin/clientes' },
  { icon: '📅', label: 'Reserves', href: '/admin/bookings' },
  { icon: '✅', label: 'Tasques', href: '/admin/tasks' },
  { icon: '📄', label: 'Pressupostos', href: '/admin/presupuestos' },
];

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operativa',
    items: [
      { icon: '📆', label: 'Calendari', href: '/admin/calendario' },
      { icon: '📬', label: 'Inbox', href: '/admin/inbox' },
      { icon: '📊', label: 'Analítica', href: '/admin/analytics' },
    ],
  },
  {
    title: 'Gestió',
    items: [
      { icon: '⭐', label: 'Ressenyes', href: '/admin/ressenyes' },
      { icon: '🎉', label: 'Post-Esdeveniment', href: '/admin/post-event' },
      { icon: '💶', label: 'Finances', href: '/admin/finanzas' },
      { icon: '📦', label: 'Packs i Preus', href: '/admin/packs' },
    ],
  },
  {
    title: 'Contingut',
    items: [
      { icon: '📝', label: 'Blog', href: '/admin/blog' },
      { icon: '❓', label: 'FAQ', href: '/admin/faq' },
      { icon: '✏️', label: 'Textos', href: '/admin/text-manager' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const badgeStyles = {
    orange: 'bg-orange-500/20 text-orange-300',
    blue: 'bg-sky-500/20 text-sky-300',
    green: 'bg-emerald-500/20 text-emerald-300',
    red: 'bg-rose-500/20 text-rose-300',
  };

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className="w-5 text-center text-base">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeStyles[item.badgeColor || 'orange']}`}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function Sidebar({ 
  isOpen, 
  onClose, 
  newLeadsCount 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  newLeadsCount: number;
}) {
  const pathname = usePathname();
  
  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href) || false;
  }, [pathname]);

  // Actualitzar badge de leads
  const priorityNav = useMemo(() => {
    return PRIORITY_NAV.map(item => {
      if (item.href === '/admin/leads' && newLeadsCount > 0) {
        return { ...item, badge: String(newLeadsCount), badgeColor: 'orange' as const };
      }
      return item;
    });
  }, [newLeadsCount]);

  return (
    <>
      {/* Overlay mòbil */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
            <Image
              src="/orbita-logo.png"
              alt="Òrbita"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div>
              <p className="text-sm font-semibold text-white">Òrbita Admin</p>
              <p className="text-[10px] text-slate-500">Gestió d'esdeveniments</p>
            </div>
          </div>

          {/* Priority nav */}
          <nav className="border-b border-slate-800 p-3">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Principal
            </p>
            <div className="space-y-1">
              {priorityNav.map((item) => (
                <NavLink 
                  key={item.href} 
                  item={item} 
                  isActive={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </nav>

          {/* Sections */}
          <nav className="flex-1 overflow-y-auto p-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="mb-4">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink 
                      key={item.href} 
                      item={item} 
                      isActive={isActive(item.href)}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-3">
            <NavLink
              item={{ icon: '⚙️', label: 'Configuració', href: '/admin/settings' }}
              isActive={isActive('/admin/settings')}
              onClick={onClose}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({ 
  onMenuClick,
  pageTitle,
}: { 
  onMenuClick: () => void;
  pageTitle: string;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur-xl">
      {/* Menu button (mobile) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-slate-500 hover:text-slate-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-medium text-white">{pageTitle}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          type="button"
          onClick={() => {/* TODO: Open search modal */}}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300"
        >
          <span>🔍</span>
          <span className="hidden sm:inline">Cerca...</span>
          <kbd className="hidden rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline">
            ⌘K
          </kbd>
        </button>

        {/* Help */}
        <HelpToggleButton />

        {/* Web */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300"
        >
          <span>🌐</span>
          <span className="hidden sm:inline">Veure web</span>
        </Link>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  // Tancar sidebar al canviar de pàgina
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Obtenir comptador de leads nous
  useEffect(() => {
    async function fetchLeadsCount() {
      try {
        const res = await fetch('/api/admin/leads/count?status=NEW');
        if (res.ok) {
          const data = await res.json();
          setNewLeadsCount(data.count || 0);
        }
      } catch {
        // Ignorar errors
      }
    }
    fetchLeadsCount();
    const interval = setInterval(fetchLeadsCount, 60000); // Cada minut
    return () => clearInterval(interval);
  }, []);

  // Calcular títol de pàgina
  const pageTitle = useMemo(() => {
    if (!pathname || pathname === '/admin') return 'Tauler';
    
    const titles: Record<string, string> = {
      '/admin/leads': 'Entrades',
      '/admin/clientes': 'Clients',
      '/admin/bookings': 'Reserves',
      '/admin/tasks': 'Tasques',
      '/admin/presupuestos': 'Pressupostos',
      '/admin/calendario': 'Calendari',
      '/admin/inbox': 'Inbox',
      '/admin/analytics': 'Analítica',
      '/admin/ressenyes': 'Ressenyes',
      '/admin/post-event': 'Post-Esdeveniment',
      '/admin/finanzas': 'Finances',
      '/admin/packs': 'Packs i Preus',
      '/admin/blog': 'Blog',
      '/admin/faq': 'FAQ',
      '/admin/text-manager': 'Textos',
      '/admin/settings': 'Configuració',
    };

    // Buscar coincidència exacta o per prefix
    for (const [path, title] of Object.entries(titles)) {
      if (pathname === path || pathname.startsWith(path + '/')) {
        return title;
      }
    }

    // Fallback: extreure de la URL
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'Tauler';
  }, [pathname]);

  return (
    <HelpProvider>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          newLeadsCount={newLeadsCount}
        />
        
        <div className="flex flex-1 flex-col">
          <TopBar 
            onMenuClick={() => setSidebarOpen(true)}
            pageTitle={pageTitle}
          />
          
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HelpProvider>
  );
}
