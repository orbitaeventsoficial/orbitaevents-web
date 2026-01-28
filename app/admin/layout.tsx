'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * 🎨 ADMIN LAYOUT - Òrbita Events
 * Estil càlid i acollidor amb tons beige/taronja suau
 * Mobile-first design amb bottom navigation
 */

function SidebarItem({
  icon,
  label,
  href,
  isActive,
  badge,
  badgeColor = 'orange',
  onClick
}: {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'red';
  onClick?: () => void;
}) {
  const badgeStyles = {
    orange: 'bg-orange-500/20 text-orange-200',
    blue: 'bg-sky-500/20 text-sky-200',
    green: 'bg-emerald-500/20 text-emerald-200',
    red: 'bg-rose-500/20 text-rose-200',
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`
        flex items-center gap-3 px-3 py-3 rounded-xl
        transition-all duration-200 group active:scale-[0.98]
        ${isActive
          ? 'bg-slate-800 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
        }
      `}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="flex-1 font-medium text-sm">{label}</span>
      {badge && (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeStyles[badgeColor]}`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// Bottom Navigation Item para móvil
function BottomNavItem({
  icon,
  label,
  href,
  isActive,
  badge
}: {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl
        transition-all duration-200 active:scale-95 relative min-w-[60px]
        ${isActive
          ? 'text-cyan-300'
          : 'text-slate-500'
        }
      `}
    >
      <span className="text-xl relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className={`text-[10px] font-medium ${isActive ? 'text-cyan-300' : 'text-slate-500'}`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-cyan-400 rounded-full" />
      )}
    </Link>
  );
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const pathname = usePathname();

  // Cargar conteo de leads nuevos
  const fetchNewLeadsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads-new?countOnly=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNewLeadsCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Tancar sidebar al canviar de pàgina
    setSidebarOpen(false);
    // Cargar conteo de leads nuevos
    fetchNewLeadsCount();
  }, [pathname, fetchNewLeadsCount]);

  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    document.body.classList.add('admin-mode');
    document.documentElement.classList.add('scroll-unlocked');
    document.body.classList.add('scroll-unlocked');
    return () => {
      document.documentElement.classList.remove('admin-mode');
      document.body.classList.remove('admin-mode');
      document.documentElement.classList.remove('scroll-unlocked');
      document.body.classList.remove('scroll-unlocked');
    };
  }, []);

  useEffect(() => {
    const windowRef = window as typeof window & { __csrfFetchWrapped?: boolean };
    if (windowRef.__csrfFetchWrapped) return;
    windowRef.__csrfFetchWrapped = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const method = request.method.toUpperCase();
      const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
      const url = new URL(request.url, window.location.origin);
      const isSameOrigin = url.origin === window.location.origin;

      if (isMutation && isSameOrigin) {
        let token = getCookieValue('csrf-token');
        if (!token) {
          try {
            await originalFetch('/api/csrf', {
              method: 'GET',
              credentials: 'same-origin',
            });
          } catch {
            // Ignore token fetch failures and let the request continue.
          }
          token = getCookieValue('csrf-token');
        }

        if (token) {
          const headers = new Headers(request.headers);
          headers.set('x-csrf-token', token);
          const nextRequest = new Request(request, { headers });
          return originalFetch(nextRequest);
        }
      }

      return originalFetch(request);
    };

    return () => {
      window.fetch = originalFetch;
      windowRef.__csrfFetchWrapped = false;
    };
  }, []);

  const navSections = useMemo(() => ([
    {
      title: 'General',
      items: [
        { icon: '📊', label: 'Dashboard', href: '/admin' },
        { icon: '📈', label: 'Analytics', href: '/admin/analytics' },
        { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
      ]
    },
    {
      title: 'CRM',
      items: [
        { icon: '👥', label: 'Leads', href: '/admin/leads', badge: newLeadsCount > 0 ? String(newLeadsCount) : undefined, badgeColor: 'orange' as const },
        { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
        { icon: '👤', label: 'Clients', href: '/admin/contactes' },
        { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
        { icon: '⭐', label: 'Ressenyes', href: '/admin/ressenyes' },
      ]
    },
    {
      title: 'Contingut',
      items: [
        { icon: '📦', label: 'Packs', href: '/admin/packs' },
        { icon: '💰', label: 'Preus', href: '/admin/pricing' },
        { icon: '❓', label: 'FAQ', href: '/admin/faq' },
        { icon: '📝', label: 'Textos PRO', href: '/admin/text-manager', badge: 'PRO', badgeColor: 'green' as const },
      ]
    },
    {
      title: 'Operacions',
      items: [
        { icon: '🎸', label: 'Inventari', href: '/admin/inventory' },
        { icon: '📝', label: 'Post-Event', href: '/admin/post-event' },
      ]
    },
    {
      title: 'Automatització',
      items: [
        { icon: '📥', label: 'Inbox (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' as const },
        { icon: '🤖', label: 'Emails Auto', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' as const },
        { icon: '🎨', label: 'Canvas', href: '/admin/canvas' },
        { icon: '⭐', label: 'Google Reviews', href: '/admin/google-reviews', badge: '5★', badgeColor: 'green' as const },
      ]
    },
    {
      title: 'Configuració',
      items: [
        { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
        { icon: '🎛️', label: 'Features', href: '/admin/features' },
        { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage' },
        { icon: '🎨', label: 'Tema', href: '/admin/theme' },
        { icon: '🌐', label: 'Traduccions', href: '/admin/translations' },
        { icon: '📝', label: 'Blog', href: '/admin/blog' },
      ]
    },
  ]), [newLeadsCount]);

  const isActive = useCallback((href: string) => {
    return href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);
  }, [pathname]);

  // Obtenir nom de la pàgina actual per al breadcrumb
  const getPageName = useCallback(() => {
    if (!pathname) return 'Dashboard';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Dashboard';
    const page = segments[segments.length - 1];
    const pageNames: Record<string, string> = {
      leads: 'Leads',
      bookings: 'Reserves',
      packs: 'Packs',
      analytics: 'Analytics',
      emails: 'Emails Auto',
      inbox: 'Inbox (IMAP)',
      calendario: 'Calendari',
      settings: 'Configuració',
      inventory: 'Inventari',
      contactes: 'Clients',
      mensajes: 'Missatges',
      ressenyes: 'Ressenyes',
      faq: 'FAQ',
      pricing: 'Preus',
      coverage: 'Cobertura',
      features: 'Features',
      theme: 'Tema',
      stats: 'Estadístiques',
      blog: 'Blog',
      canvas: 'Canvas',
      translations: 'Traduccions',
      'text-manager': 'Textos PRO',
      'post-event': 'Post-Event',
      'google-reviews': 'Google Reviews',
    };
    return pageNames[page] || page.charAt(0).toUpperCase() + page.slice(1);
  }, [pathname]);

  return (
    <html lang="ca" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-200 antialiased" suppressHydrationWarning>
        <div className="min-h-screen">
          {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 flex-col z-40">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 p-1.5">
              <Image
                src="/img/logosoloplaneta.svg"
                alt="Òrbita"
                width={40}
                height={40}
                sizes="40px"
                quality={80}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-slate-200 font-semibold">Òrbita</span>
              <span className="text-cyan-300 font-semibold ml-1">Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem key={item.href} {...item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sistema</p>
            <p className="text-sm text-slate-200 font-medium mt-1">Òrbita Admin</p>
            <p className="text-xs text-slate-400">v2.0 · Prisma + Supabase</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Mejorado */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 z-50 px-3 flex items-center justify-between safe-area-top">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
          aria-label="Obrir menú admin"
          aria-expanded={sidebarOpen}
          aria-controls="admin-mobile-sidebar"
          className="p-2.5 -ml-1 text-slate-300 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-slate-200 font-semibold text-sm">
            <span className="text-cyan-300">Òrbita</span> Admin
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{getPageName()}</span>
        </div>

        <Link
          href="/admin/settings/notifications"
          className="p-2.5 -mr-1 text-slate-300 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors relative"
          aria-label="Notificacions"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        </Link>
      </header>

      {/* Mobile Sidebar Overlay - Con animación */}
      {mounted && (
        <>
          {/* Backdrop */}
          <div
            className={`lg:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 transition-opacity duration-300
              ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
          {/* Sidebar */}
          <aside
            id="admin-mobile-sidebar"
            aria-label="Menú admin"
            className={`lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 overflow-hidden
              transform transition-transform duration-300 ease-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {/* Header del sidebar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md p-1.5">
                  <Image
                    src="/img/logosoloplaneta.svg"
                    alt="Òrbita"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-slate-100 font-semibold text-sm">Òrbita Admin</span>
                  <p className="text-[10px] text-slate-400">Panel de gestio</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tancar menú admin"
                onClick={() => setSidebarOpen(false)}
                className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navegación */}
            <nav className="p-3 overflow-y-auto h-[calc(100%-140px)]">
              {navSections.map((section) => (
                <div key={section.title} className="mb-5">
                  <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.href}
                        {...item}
                        isActive={isActive(item.href)}
                        onClick={() => setSidebarOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer del sidebar móvil */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800 bg-slate-900">
              <Link
                href="/admin/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                  A
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">Admin</p>
                  <p className="text-xs text-slate-400">Configuracio del compte</p>
                </div>
                <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 border-b border-slate-800 px-6 items-center justify-between bg-slate-900/95 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/admin" className="text-slate-400 hover:text-slate-200 transition-colors">Admin</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-medium">{getPageName()}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings/notifications"
            className="relative p-2.5 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Notificacions"
          >
            🔔
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          </Link>
          <div className="h-6 w-px bg-slate-800" />
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
              A
            </div>
            <span className="text-slate-100 text-sm font-medium">Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-16 pb-20 lg:pb-0 min-h-screen">
        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2 max-w-lg mx-auto">
          <BottomNavItem
            icon="📊"
            label="Dashboard"
            href="/admin"
            isActive={pathname === '/admin'}
          />
          <BottomNavItem
            icon="📈"
            label="Analytics"
            href="/admin/analytics"
            isActive={pathname?.startsWith('/admin/analytics') || false}
          />
          <BottomNavItem
            icon="👥"
            label="Leads"
            href="/admin/leads"
            isActive={pathname?.startsWith('/admin/leads') || false}
            badge={newLeadsCount}
          />
          <BottomNavItem
            icon="📋"
            label="Reserves"
            href="/admin/bookings"
            isActive={pathname?.startsWith('/admin/bookings') || false}
          />
          <BottomNavItem
            icon="⚙️"
            label="Config"
            href="/admin/settings"
            isActive={pathname?.startsWith('/admin/settings') || false}
          />
        </div>
      </nav>
        </div>
      </body>
    </html>
  );
}
