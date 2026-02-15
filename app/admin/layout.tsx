'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import AdminSearchModal from './components/AdminSearchModal';
import AdminHelpLegend from './components/AdminHelpLegend';
import AdminHelpInspector from './components/AdminHelpInspector';
import { AdminHelpModeProvider, useAdminHelpMode } from './components/AdminHelpMode';

/**
 * 🎨 ADMIN LAYOUT - Òrbita Events
 * Estil sobri i professional amb focus en llegibilitat
 * Mobile-first design amb bottom navigation
 */

function SidebarItem({
  icon,
  label,
  href,
  isActive,
  badge,
  badgeColor = 'orange',
  onClick,
  onPrefetch,
}: {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'red';
  onClick?: () => void;
  onPrefetch?: (href: string) => void;
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
      prefetch={false}
      onClick={onClick}
      onMouseEnter={() => onPrefetch?.(href)}
      onFocus={() => onPrefetch?.(href)}
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

function SidebarSection({
  title,
  storageKey,
  defaultOpen = false,
  children,
}: {
  title: string;
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(`admin.section.${storageKey}`);
    if (raw === '1') setOpen(true);
    if (raw === '0') setOpen(false);
  }, [storageKey]);

  const toggle = useCallback(() => {
    setOpen((value) => {
      const next = !value;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`admin.section.${storageKey}`, next ? '1' : '0');
      }
      return next;
    });
  }, [storageKey]);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:bg-slate-800/60"
      >
        <span>{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}

function FavoriteChip({
  href,
  label,
  isActive,
  onClick,
  onPrefetch,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  onPrefetch?: (href: string) => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      onMouseEnter={() => onPrefetch?.(href)}
      onFocus={() => onPrefetch?.(href)}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        isActive
          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
          : 'bg-slate-800/70 text-slate-300 border border-slate-700 hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  );
}

// Bottom Navigation Item para móvil
function BottomNavItem({
  icon,
  label,
  href,
  isActive,
  badge,
  onPrefetch,
}: {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
  badge?: number;
  onPrefetch?: (href: string) => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={() => onPrefetch?.(href)}
      onFocus={() => onPrefetch?.(href)}
      className={`
        flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl
        transition-all duration-200 active:scale-95 relative min-w-[60px]
        ${isActive
          ? 'text-amber-300'
          : 'text-slate-500'
        }
      `}
    >
      <span className="text-xl relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className={`text-[10px] font-medium ${isActive ? 'text-amber-300' : 'text-slate-500'}`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 rounded-full" />
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
  return (
    <AdminHelpModeProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminHelpModeProvider>
  );
}

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const pathname = usePathname();
  const { enabled: helpModeEnabled, toggle: toggleHelpMode } = useAdminHelpMode();

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
    // Cargar conteo de leads nuevos al iniciar.
    fetchNewLeadsCount();
  }, [fetchNewLeadsCount]);

  useEffect(() => {
    // Tancar sidebar al canviar de pàgina.
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Evita fer una petició a cada navegació: refresc periòdic.
    const intervalId = setInterval(fetchNewLeadsCount, 45000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchNewLeadsCount();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchNewLeadsCount]);

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
    const handleShortcut = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === 'k';
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
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

  const priorityItems = useMemo(() => ([
    { icon: '📥', label: 'Entrades (Leads)', href: '/admin/leads', badge: newLeadsCount > 0 ? String(newLeadsCount) : undefined, badgeColor: 'orange' as const },
    { icon: '👤', label: 'Clients', href: '/admin/clientes' },
    { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
    { icon: '📝', label: 'Tasques', href: '/admin/tasks' },
    { icon: '🧾', label: 'Pressupost (PDF)', href: '/admin/presupuestos' },
  ]), [newLeadsCount]);

  const favoriteItems = useMemo(() => ([
    { label: 'Entrades', href: '/admin/leads' },
    { label: 'Clients', href: '/admin/clientes' },
    { label: 'Reserves', href: '/admin/bookings' },
    { label: 'Tasques', href: '/admin/tasks' },
  ]), []);

  const navSections = useMemo(() => ([
    {
      title: 'Operativa',
      defaultOpen: true,
      items: [
        { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
        { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
        { icon: '📥', label: 'Inbox (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' as const },
      ]
    },
    {
      title: 'Herramientas',
      defaultOpen: false,
      items: [
        { icon: '💶', label: 'Finances', href: '/admin/finanzas' },
        { icon: '🎯', label: 'Sales Ops', href: '/admin/sales-ops' },
        { icon: '⭐', label: 'Ressenyes', href: '/admin/ressenyes' },
        { icon: '📝', label: 'Postevent', href: '/admin/post-event' },
        { icon: '📈', label: 'Analytics', href: '/admin/analytics' },
        { icon: '📊', label: 'Rendibilitat', href: '/admin/rentabilidad' },
        { icon: '🗂️', label: 'Catàleg', href: '/admin/catalog' },
        { icon: '❓', label: 'FAQ', href: '/admin/faq' },
        { icon: '📝', label: 'Textos PRO', href: '/admin/text-manager', badge: 'PRO', badgeColor: 'green' as const },
        { icon: '🤖', label: 'Emails Auto', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' as const },
        { icon: '🎨', label: 'Canvas', href: '/admin/canvas' },
        { icon: '⭐', label: 'Google Reviews', href: '/admin/google-reviews', badge: '5★', badgeColor: 'green' as const },
        { icon: '📝', label: 'Blog', href: '/admin/blog' },
      ]
    },
    {
      title: 'Configuración',
      defaultOpen: false,
      items: [
        { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
        { icon: '📄', label: 'Plantilla pressupostos', href: '/admin/settings/quotes' },
        { icon: '🔗', label: 'Integracions', href: '/admin/settings/integrations' },
        { icon: '🎛️', label: 'Features', href: '/admin/features' },
        { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage' },
        { icon: '🎨', label: 'Tema', href: '/admin/theme' },
        { icon: '🌐', label: 'Traduccions', href: '/admin/translations' },
      ]
    },
  ]), []);

  const navLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    priorityItems.forEach((item) => map.set(item.href, item.label));
    navSections.forEach((section) => {
      section.items.forEach((item) => map.set(item.href, item.label));
    });
    return map;
  }, [priorityItems, navSections]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'admin.recent.hrefs';
    const saved = window.localStorage.getItem(key);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setRecentHrefs(parsed.filter((v) => typeof v === 'string').slice(0, 6));
      }
    } catch {
      // ignore broken cache
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname?.startsWith('/admin')) return;
    const key = 'admin.recent.hrefs';
    setRecentHrefs((prev) => {
      const next = [pathname, ...prev.filter((item) => item !== pathname)].slice(0, 6);
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [pathname]);

  const isActive = useCallback((href: string) => {
    return href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);
  }, [pathname]);

  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  // Obtenir nom de la pàgina actual per al breadcrumb
  const getPageName = useCallback(() => {
    if (!pathname) return 'Tauler';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Tauler';
    const page = segments[segments.length - 1];
    const pageNames: Record<string, string> = {
      leads: 'Leads',
      bookings: 'Reserves',
      tasks: 'Tasques',
      packs: 'Packs',
      analytics: 'Analytics',
      'sales-ops': 'Sales Ops',
      rentabilidad: 'Rendibilitat',
      catalog: 'Catàleg',
      finanzas: 'Finances',
      emails: 'Emails Auto',
      inbox: 'Inbox (IMAP)',
      calendario: 'Calendari',
      settings: 'Configuració',
      integrations: 'Integracions',
      quotes: 'Plantilla pressupostos',
      inventory: 'Inventari',
      contactes: 'Clients',
      clientes: 'Clients',
      mensajes: 'Missatges',
      ressenyes: 'Ressenyes',
      faq: 'PMF',
      pricing: 'Preus',
      presupuestos: 'Editor PDF pressupost',
      coverage: 'Cobertura',
      features: 'Features',
      theme: 'Tema',
      stats: 'Estadísticas',
      blog: 'Blog',
      canvas: 'Canvas',
      translations: 'Traduccions',
      'text-manager': 'Textos PRO',
      'post-event': 'Postevent',
      'google-reviews': 'Google Reviews',
    };
    return pageNames[page] || page.charAt(0).toUpperCase() + page.slice(1);
  }, [pathname]);

  const isHelpTarget = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest('[data-help-tooltip="true"]') ||
      target.closest('[data-help-tooltip-panel="true"]') ||
      target.closest('[data-help-toggle="true"]')
    );
  }, []);

  const blockInteractionInHelpMode = useCallback((event: React.SyntheticEvent) => {
    if (!helpModeEnabled) return;
    if (isHelpTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }, [helpModeEnabled, isHelpTarget]);

  return (
    <html lang="ca" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-200 antialiased" suppressHydrationWarning>
        <div
          className="min-h-screen"
          onClickCapture={blockInteractionInHelpMode}
          onDoubleClickCapture={blockInteractionInHelpMode}
          onSubmitCapture={blockInteractionInHelpMode}
          onPointerDownCapture={blockInteractionInHelpMode}
        >
          {helpModeEnabled && (
            <div className="fixed left-1/2 top-16 z-[70] -translate-x-1/2 rounded-full border border-amber-400/60 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 shadow-lg">
              Modo ayuda activo: las acciones están bloqueadas. Pulsa los iconos de ayuda para ver explicaciones.
            </div>
          )}
          {helpModeEnabled && <AdminHelpLegend />}
          {helpModeEnabled && <AdminHelpInspector />}
          {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-zinc-900/95 backdrop-blur-sm border-r border-zinc-700/80 flex-col z-40">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 p-1.5">
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
              <span className="text-amber-300 font-semibold ml-1">Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="mb-4">
            <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Prioritat
            </p>
            <div className="space-y-1">
              {priorityItems.map((item) => (
                <SidebarItem key={item.href} {...item} isActive={isActive(item.href)} onPrefetch={prefetchRoute} />
              ))}
            </div>
          </div>

          <div className="mb-4 px-3">
            <p className="mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Preferits
            </p>
            <div className="flex flex-wrap gap-1.5">
              {favoriteItems.map((item) => (
                <FavoriteChip
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={isActive(item.href)}
                  onPrefetch={prefetchRoute}
                />
              ))}
            </div>
          </div>

          {recentHrefs.length > 0 && (
            <div className="mb-4 px-3">
              <p className="mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Recents
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recentHrefs.map((href) => (
                  <FavoriteChip
                    key={href}
                    href={href}
                    label={navLabelMap.get(href) || href.replace('/admin/', '')}
                    isActive={isActive(href)}
                    onPrefetch={prefetchRoute}
                  />
                ))}
              </div>
            </div>
          )}

          {navSections.map((section) => (
            <SidebarSection
              key={section.title}
              title={section.title}
              storageKey={section.title.toLowerCase().replace(/\s+/g, '-')}
              defaultOpen={section.defaultOpen}
            >
              {section.items.map((item) => (
                <SidebarItem key={item.href} {...item} isActive={isActive(item.href)} onPrefetch={prefetchRoute} />
              ))}
            </SidebarSection>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-700/80 z-50 px-3 flex items-center justify-between safe-area-top">
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
            <span className="text-amber-300">Òrbita</span> Admin
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{getPageName()}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-help-toggle="true"
            onClick={toggleHelpMode}
            className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${
              helpModeEnabled
                ? 'border-amber-400/70 bg-amber-500/20 text-amber-200'
                : 'border-slate-700/80 text-slate-200 hover:bg-slate-800 active:bg-slate-700'
            }`}
            aria-label="Activar o desactivar modo ayuda"
            aria-pressed={helpModeEnabled}
          >
            ❓ Ayuda
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-2.5 text-slate-300 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors"
            aria-label="Cercar (Ctrl+K)"
          >
            🔍
          </button>
          <Link
            href="/admin/settings/notifications"
            className="p-2.5 -mr-1 text-slate-300 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors relative"
            aria-label="Notificacions"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay - Con animación */}
      {mounted && (
        <>
          {/* Backdrop */}
          <div
            className={`lg:hidden fixed inset-0 bg-zinc-950/50 backdrop-blur-sm z-40 transition-opacity duration-300
              ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
          {/* Sidebar */}
          <aside
            id="admin-mobile-sidebar"
            aria-label="Menú admin"
            className={`lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-zinc-900 border-r border-zinc-700/80 z-50 overflow-hidden
              transform transition-transform duration-300 ease-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {/* Header del sidebar */}
            <div className="p-4 border-b border-zinc-700/80 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md p-1.5">
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
                  <p className="text-[10px] text-slate-400">Panell de gestió</p>
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
              <div className="mb-4">
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Prioritat
                </p>
                <div className="space-y-0.5">
                  {priorityItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      {...item}
                      isActive={isActive(item.href)}
                      onClick={() => setSidebarOpen(false)}
                      onPrefetch={prefetchRoute}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4 px-3">
                <p className="mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Preferits
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {favoriteItems.map((item) => (
                    <FavoriteChip
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      isActive={isActive(item.href)}
                      onClick={() => setSidebarOpen(false)}
                      onPrefetch={prefetchRoute}
                    />
                  ))}
                </div>
              </div>

              {recentHrefs.length > 0 && (
                <div className="mb-4 px-3">
                  <p className="mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Recents
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentHrefs.map((href) => (
                      <FavoriteChip
                        key={href}
                        href={href}
                        label={navLabelMap.get(href) || href.replace('/admin/', '')}
                        isActive={isActive(href)}
                        onClick={() => setSidebarOpen(false)}
                        onPrefetch={prefetchRoute}
                      />
                    ))}
                  </div>
                </div>
              )}

              {navSections.map((section) => (
                <SidebarSection
                  key={section.title}
                  title={section.title}
                  storageKey={section.title.toLowerCase().replace(/\s+/g, '-')}
                  defaultOpen={section.defaultOpen}
                >
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      {...item}
                      isActive={isActive(item.href)}
                      onClick={() => setSidebarOpen(false)}
                      onPrefetch={prefetchRoute}
                    />
                  ))}
                </SidebarSection>
              ))}
            </nav>

            {/* Footer del sidebar móvil */}
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-700/80 bg-zinc-900">
              <Link
                href="/admin/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold shadow-sm">
                  A
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-100">Admin</p>
                  <p className="text-xs text-slate-400">Configuració del compte</p>
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
      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 border-b border-zinc-700/80 px-6 items-center justify-between bg-zinc-900/95 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/admin" className="text-slate-400 hover:text-slate-200 transition-colors">Admin</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 font-medium">{getPageName()}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-help-toggle="true"
            onClick={toggleHelpMode}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              helpModeEnabled
                ? 'border-amber-400/70 bg-amber-500/20 text-amber-300'
                : 'border-zinc-700/80 bg-zinc-800/60 text-slate-300 hover:border-amber-500/30 hover:text-slate-100'
            }`}
            aria-pressed={helpModeEnabled}
            aria-label="Activar o desactivar modo ayuda"
          >
            ❓ Ayuda {helpModeEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/30 hover:text-slate-100 transition-colors"
            aria-label="Cercar (Ctrl+K)"
          >
            🔍 Cercar
            <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] text-slate-500">Ctrl/⌘K</span>
          </button>
          <Link
            href="/admin/settings/notifications"
            className="relative p-2.5 text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Notificacions"
          >
            🔔
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          </Link>
          <div className="h-6 w-px bg-slate-800" />
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
              A
            </div>
            <span className="text-slate-100 text-sm font-medium">Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-14 lg:pt-16 pb-20 lg:pb-0 min-h-screen">
        <div className="admin-shell admin-readable admin-unified p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-700/80 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2 max-w-lg mx-auto">
          <BottomNavItem
            icon="📊"
            label="Tauler"
            href="/admin"
            isActive={pathname === '/admin'}
            onPrefetch={prefetchRoute}
          />
          <BottomNavItem
            icon="📈"
            label="Analytics"
            href="/admin/analytics"
            isActive={pathname?.startsWith('/admin/analytics') || false}
            onPrefetch={prefetchRoute}
          />
          <BottomNavItem
            icon="👥"
            label="Leads"
            href="/admin/leads"
            isActive={pathname?.startsWith('/admin/leads') || false}
            badge={newLeadsCount}
            onPrefetch={prefetchRoute}
          />
          <BottomNavItem
            icon="📋"
            label="Reserves"
            href="/admin/bookings"
            isActive={pathname?.startsWith('/admin/bookings') || false}
            onPrefetch={prefetchRoute}
          />
          <BottomNavItem
            icon="⚙️"
            label="Configuració"
            href="/admin/settings"
            isActive={pathname?.startsWith('/admin/settings') || false}
            onPrefetch={prefetchRoute}
          />
        </div>
      </nav>
      <AdminSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      </body>
    </html>
  );
}


