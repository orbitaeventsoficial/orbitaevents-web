'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamicImport from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { AdminHelpModeProvider, useAdminHelpMode } from './components/AdminHelpMode';

const AdminSearchModal = dynamicImport(() => import('./components/AdminSearchModal'), {
  ssr: false,
});
const AdminHelpLegend = dynamicImport(() => import('./components/AdminHelpLegend'), {
  ssr: false,
});
const AdminHelpInspector = dynamicImport(() => import('./components/AdminHelpInspector'), {
  ssr: false,
});

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
    orange: 'admin-nav-badge admin-nav-badge--orange',
    blue: 'admin-nav-badge admin-nav-badge--blue',
    green: 'admin-nav-badge admin-nav-badge--green',
    red: 'admin-nav-badge admin-nav-badge--red',
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      onMouseEnter={() => onPrefetch?.(href)}
      onFocus={() => onPrefetch?.(href)}
      aria-current={isActive ? 'page' : undefined}
      className={`admin-nav-item ${isActive ? 'admin-nav-item--active' : 'admin-nav-item--idle'}`}
    >
      {isActive && (
        <span className="admin-nav-item-marker" />
      )}
      <span className="admin-nav-item-icon">{icon}</span>
      <span className="admin-nav-item-label">{label}</span>
      {badge && (
        <span className={badgeStyles[badgeColor]}>
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
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const raw = window.localStorage.getItem(`admin.section.${storageKey}`);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return defaultOpen;
  });

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
    <div className="admin-nav-section">
      <button
        type="button"
        onClick={toggle}
        className="admin-nav-section-btn"
      >
        <span>{title}</span>
        <span className={`admin-nav-section-caret ${open ? 'admin-nav-section-caret--open' : ''}`}>⌄</span>
      </button>
      {open && <div className="admin-nav-section-content">{children}</div>}
    </div>
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
      className={`admin-bottom-nav-item ${isActive ? 'admin-bottom-nav-item--active' : 'admin-bottom-nav-item--idle'}`}
    >
      <span className="admin-bottom-nav-icon-wrap">
        {icon}
        {badge && badge > 0 && (
          <span className="admin-bottom-nav-badge">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="admin-bottom-nav-label">
        {label}
      </span>
      {isActive && (
        <span className="admin-bottom-nav-marker" />
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
  const [packPriceAlertsCount, setPackPriceAlertsCount] = useState(0);
  const [financeAlertsCount, setFinanceAlertsCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [customAdminCss, setCustomAdminCss] = useState('');
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

  const fetchPackPriceAlertsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/packs/price-alerts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPackPriceAlertsCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchFinanceAlertsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/alerts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFinanceAlertsCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCss = async () => {
      try {
        const res = await fetch('/api/admin/css', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (!cancelled && typeof data?.css === 'string') {
          setCustomAdminCss(data.css);
        }
      } catch {
        // Silently fail
      }
    };
    loadCss();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    // Carrega en idle per no bloquejar render inicial.
    const run = () => {
      fetchNewLeadsCount();
      fetchPackPriceAlertsCount();
      fetchFinanceAlertsCount();
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number })
        .requestIdleCallback(() => run());
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }
    const timeoutId = globalThis.setTimeout(run, 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, [fetchNewLeadsCount, fetchPackPriceAlertsCount, fetchFinanceAlertsCount]);

  useEffect(() => {
    const criticalRoutes = [
      '/admin/leads',
      '/admin/bookings',
      '/admin/tasks',
      '/admin/economia',
      '/admin/catalog',
    ];
    const run = () => {
      criticalRoutes.forEach((href) => router.prefetch(href));
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number })
        .requestIdleCallback(() => run());
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
      };
    }
    const timeoutId = globalThis.setTimeout(run, 500);
    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  useEffect(() => {
    // Tancar sidebar al canviar de pàgina.
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Sense polling periòdic: només refresc quan la pestanya torna visible.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNewLeadsCount();
        fetchPackPriceAlertsCount();
        fetchFinanceAlertsCount();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchNewLeadsCount, fetchPackPriceAlertsCount, fetchFinanceAlertsCount]);

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
    { icon: '📥', label: 'Entrades', href: '/admin/leads', badge: newLeadsCount > 0 ? String(newLeadsCount) : undefined, badgeColor: 'orange' as const },
    { icon: '⚡', label: 'Entrada ràpida', href: '/admin/intake' },
    { icon: '👤', label: 'Clients', href: '/admin/clientes' },
    { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
    { icon: '📝', label: 'Tasques', href: '/admin/tasks' },
    { icon: '🧾', label: 'Pressupost (PDF)', href: '/admin/presupuestos' },
    { icon: '🧭', label: 'Mapa admin', href: '/admin/mapa' },
  ]), [newLeadsCount]);

  const navSections = useMemo(() => ([
    {
      title: 'Operativa',
      defaultOpen: true,
      items: [
        { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
        { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
        { icon: '📦', label: 'Inventari', href: '/admin/inventory' },
        { icon: '🎟️', label: 'Descomptes', href: '/admin/discount-codes' },
        { icon: '📥', label: 'Safata (IMAP)', href: '/admin/inbox', badge: 'IMAP', badgeColor: 'blue' as const },
      ]
    },
    {
      title: 'Eines',
      defaultOpen: false,
      items: [
        { icon: '💶', label: 'Economia', href: '/admin/economia' },
        { icon: '🎯', label: 'Operativa de vendes', href: '/admin/sales-ops' },
        { icon: '⭐', label: 'Ressenyes clients', href: '/admin/ressenyes' },
        { icon: '📝', label: 'Post-esdeveniment', href: '/admin/post-event' },
        { icon: '📈', label: 'Analítica', href: '/admin/analytics' },
        { icon: '🗂️', label: 'Catàleg', href: '/admin/catalog' },
        { icon: '❓', label: 'FAQ', href: '/admin/faq' },
        { icon: '✍️', label: 'Textos PRO', href: '/admin/text-manager', badge: 'PRO', badgeColor: 'green' as const },
        { icon: '🧩', label: 'CSS PRO', href: '/admin/css-manager', badge: 'PRO', badgeColor: 'green' as const },
        { icon: '🤖', label: 'Correus automàtics', href: '/admin/emails', badge: 'AUTO', badgeColor: 'green' as const },
        { icon: '🎨', label: 'Canvas', href: '/admin/canvas' },
        { icon: '🌟', label: 'Google Reviews', href: '/admin/google-reviews', badge: '5★', badgeColor: 'green' as const },
        { icon: '📰', label: 'Blog', href: '/admin/blog' },
      ]
    },
    {
      title: 'Configuració',
      defaultOpen: false,
      items: [
        { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
        { icon: '📄', label: 'Plantilla pressupostos', href: '/admin/settings/quotes' },
        { icon: '🔗', label: 'Integracions', href: '/admin/settings/integrations' },
        { icon: '🎛️', label: 'Features', href: '/admin/features' },
        { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage' },
        { icon: '🌐', label: 'Traduccions', href: '/admin/translations' },
      ]
    },
  ]), []);

  const notificationsCount = newLeadsCount + packPriceAlertsCount + financeAlertsCount;

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
      leads: 'Entrades',
      bookings: 'Reserves',
      tasks: 'Tasques',
      packs: 'Packs',
      analytics: 'Analítica',
      'sales-ops': 'Operativa de vendes',
      rentabilidad: 'Rendibilitat',
      catalog: 'Catàleg',
      finanzas: 'Finances',
      emails: 'Correus automàtics',
      inbox: 'Safata (IMAP)',
      calendario: 'Calendari',
      settings: 'Configuració',
      integrations: 'Integracions',
      quotes: 'Plantilla pressupostos',
      inventory: 'Inventari',
      contactes: 'Fitxa client',
      clientes: 'Clients',
      mensajes: 'Missatges',
      ressenyes: 'Ressenyes',
      faq: 'PMF',
      pricing: 'Preus',
      presupuestos: 'Editor PDF pressupost',
      coverage: 'Cobertura',
      features: 'Features',
      stats: 'Estadístiques',
      mapa: 'Mapa Admin',
      blog: 'Blog',
      canvas: 'Canvas',
      translations: 'Traduccions',
      'text-manager': 'Textos PRO',
      'css-manager': 'CSS PRO',
      'post-event': 'Post-esdeveniment',
      'google-reviews': 'Ressenyes de Google',
      'google-ads': 'Google Ads',
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

  const isInteractiveControl = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest('button, input, select, textarea, label, a, [role="button"], [contenteditable="true"]')
    );
  }, []);

  const blockInteractionInHelpMode = useCallback((event: React.SyntheticEvent) => {
    if (!helpModeEnabled) return;
    if (isHelpTarget(event.target)) return;
    if (isInteractiveControl(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }, [helpModeEnabled, isHelpTarget, isInteractiveControl]);

  return (
    <html lang="ca" suppressHydrationWarning>
      <body className="admin-layout-body" suppressHydrationWarning>
        <div
          className="admin-layout-shell"
          onClickCapture={blockInteractionInHelpMode}
          onDoubleClickCapture={blockInteractionInHelpMode}
          onSubmitCapture={blockInteractionInHelpMode}
          onPointerDownCapture={blockInteractionInHelpMode}
        >
          {customAdminCss && (
            <style id="admin-custom-css" dangerouslySetInnerHTML={{ __html: customAdminCss }} />
          )}
          {helpModeEnabled && (
            <div className="admin-help-banner">
              Mode ajuda actiu: les accions estan bloquejades. Prem els icones d'ajuda per veure explicacions.
            </div>
          )}
          {helpModeEnabled && <AdminHelpLegend />}
          {helpModeEnabled && <AdminHelpInspector />}
          {/* Desktop Sidebar */}
          <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar-head">
          <Link href="/admin" className="admin-sidebar-brand">
            <div className="admin-sidebar-logo-wrap">
              <Image
                src="/img/logosoloplaneta.svg"
                alt="Òrbita"
                width={40}
                height={40}
                sizes="40px"
                quality={80}
                className="admin-logo-img"
              />
            </div>
            <div>
              <span className="admin-sidebar-brand-main">Òrbita</span>
              <span className="admin-sidebar-brand-accent">Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-block">
            <p className="admin-sidebar-block-title">
              Prioritat
            </p>
            <div className="admin-sidebar-block-list">
              {priorityItems.map((item) => (
                <SidebarItem key={item.href} {...item} isActive={isActive(item.href)} onPrefetch={prefetchRoute} />
              ))}
            </div>
          </div>

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
          <div className="admin-sidebar-foot">
          <div className="admin-sidebar-foot-card">
            <p className="admin-sidebar-foot-kicker">Sistema</p>
            <p className="admin-sidebar-foot-title">Òrbita Admin</p>
            <p className="admin-sidebar-foot-meta">v2.0 · Prisma + Supabase</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Mejorado */}
      <header className="admin-mobile-header">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
          aria-label="Obrir menú admin"
          aria-expanded={sidebarOpen}
          aria-controls="admin-mobile-sidebar"
          className="admin-icon-btn admin-icon-btn--left"
        >
          <svg className="admin-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="admin-mobile-title-wrap">
          <span className="admin-mobile-title">
            <span className="admin-mobile-title-accent">Òrbita</span> Admin
          </span>
          <span className="admin-mobile-subtitle">{getPageName()}</span>
        </div>

        <div className="admin-mobile-actions">
          <button
            type="button"
            data-help-toggle="true"
            onClick={toggleHelpMode}
            className={`admin-help-btn ${
              helpModeEnabled
                ? 'admin-help-btn--active'
                : 'admin-help-btn--idle'
            }`}
            aria-label="Activar o desactivar mode ajuda"
            aria-pressed={helpModeEnabled}
          >
            ❓ Ajuda
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="admin-icon-btn"
            aria-label="Cercar (Ctrl+K)"
          >
            🔍
          </button>
          <Link
            href="/admin/settings/notifications"
            className="admin-icon-btn admin-icon-btn--notif"
            aria-label="Notificacions"
          >
            <svg className="admin-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationsCount > 0 && (
              <span className="admin-notif-dot" />
            )}
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay - Con animación */}
      {mounted && (
        <>
          {/* Backdrop */}
          <div
            className={`admin-mobile-backdrop
              ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
          {/* Sidebar */}
          <aside
            id="admin-mobile-sidebar"
            aria-label="Menú admin"
            className={`admin-mobile-sidebar
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {/* Header del sidebar */}
            <div className="admin-mobile-sidebar-head">
              <div className="admin-mobile-sidebar-brand">
                <div className="admin-mobile-sidebar-logo">
                  <Image
                    src="/img/logosoloplaneta.svg"
                    alt="Òrbita"
                    width={36}
                    height={36}
                    className="admin-logo-img"
                  />
                </div>
                <div>
                  <span className="admin-mobile-sidebar-title">Òrbita Admin</span>
                  <p className="admin-mobile-sidebar-subtitle">Panell de gestió</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tancar menú admin"
                onClick={() => setSidebarOpen(false)}
                className="admin-icon-btn"
              >
                <svg className="admin-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navegación */}
            <nav className="admin-mobile-sidebar-nav">
              <div className="admin-sidebar-block">
                <p className="admin-sidebar-block-title">
                  Prioritat
                </p>
                <div className="admin-sidebar-block-list">
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
            <div className="admin-mobile-sidebar-foot">
              <Link
                href="/admin/settings"
                onClick={() => setSidebarOpen(false)}
                className="admin-mobile-sidebar-foot-link"
              >
                <div className="admin-mobile-sidebar-foot-avatar">
                  A
                </div>
                <div className="admin-mobile-sidebar-foot-copy">
                  <p className="admin-mobile-sidebar-foot-title">Admin</p>
                  <p className="admin-mobile-sidebar-foot-subtitle">Configuració del compte</p>
                </div>
                <svg className="admin-cr-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Header */}
      <header className="admin-desktop-header">
        <div className="admin-desktop-breadcrumb">
          <Link href="/admin" className="admin-desktop-breadcrumb-link">Admin</Link>
          <span className="admin-desktop-breadcrumb-sep">/</span>
          <span className="admin-desktop-breadcrumb-current">{getPageName()}</span>
        </div>
        <div className="admin-desktop-actions">
          <button
            type="button"
            data-help-toggle="true"
            onClick={toggleHelpMode}
            className={`admin-help-btn ${
              helpModeEnabled
                ? 'admin-help-btn--active'
                : 'admin-help-btn--idle'
            }`}
            aria-pressed={helpModeEnabled}
            aria-label="Activar o desactivar mode ajuda"
          >
            ❓ Ajuda {helpModeEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="admin-desktop-search-btn"
            aria-label="Cercar (Ctrl+K)"
          >
            🔍 Cercar
            <span className="admin-desktop-kbd">Ctrl/⌘K</span>
          </button>
          <Link
            href="/admin/settings/notifications"
            className="admin-icon-btn admin-icon-btn--notif"
            aria-label="Notificacions"
          >
            🔔
            {notificationsCount > 0 && (
              <span className="admin-notif-dot" />
            )}
          </Link>
          <div className="admin-desktop-sep" />
          <Link
            href="/admin/settings"
            className="admin-desktop-user"
          >
            <div className="admin-desktop-user-avatar">
              A
            </div>
            <span className="admin-desktop-user-label">Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-shell admin-readable admin-unified admin-compact admin-main-shell">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="admin-bottom-nav">
        <div className="admin-bottom-nav-inner">
          <BottomNavItem
            icon="📊"
            label="Tauler"
            href="/admin"
            isActive={pathname === '/admin'}
            onPrefetch={prefetchRoute}
          />
          <BottomNavItem
            icon="📈"
            label="Analítica"
            href="/admin/analytics"
            isActive={pathname?.startsWith('/admin/analytics') || false}
            onPrefetch={prefetchRoute}
          />
          <BottomNavItem
            icon="👥"
            label="Entrades"
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


