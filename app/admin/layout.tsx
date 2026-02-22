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
    orange: '',
    blue: '',
    green: '',
    red: '',
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      onMouseEnter={() => onPrefetch?.(href)}
      onFocus={() => onPrefetch?.(href)}
      aria-current={isActive ? 'page' : undefined}
      className={`${isActive ? '' : ''}`}
    >
      {isActive && (
        <span className="" />
      )}
      <span className="">{icon}</span>
      <span className="">{label}</span>
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
    <div className="">
      <button
        type="button"
        onClick={toggle}
        className=""
      >
        <span>{title}</span>
        <span className={`${open ? '' : ''}`}>⌄</span>
      </button>
      {open && <div className="">{children}</div>}
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
      className={`${isActive ? '' : ''}`}
    >
      <span className="">
        {icon}
        {badge && badge > 0 && (
          <span className="">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span className="">
        {label}
      </span>
      {isActive && (
        <span className="" />
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
    document.documentElement.classList.add('');
    document.body.classList.add('');
    document.documentElement.classList.add('scroll-unlocked');
    document.body.classList.add('scroll-unlocked');
    return () => {
      document.documentElement.classList.remove('');
      document.body.classList.remove('');
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
    const parent = segments[segments.length - 2] || '';
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
      'post-event': 'Post-esdeveniment',
      'google-reviews': 'Ressenyes de Google',
      'google-ads': 'Google Ads',
    };
    const isDynamicId =
      /^[a-f0-9]{24}$/i.test(page) || // Mongo-like id
      /^[a-f0-9-]{32,36}$/i.test(page) || // UUID variants
      /^[a-z0-9]{20,}$/i.test(page); // CUID/ULID-like

    if (isDynamicId) {
      const detailByParent: Record<string, string> = {
        contactes: 'Fitxa client',
        inventory: 'Fitxa inventari',
        bookings: 'Fitxa reserva',
        leads: 'Fitxa entrada',
        clientes: 'Fitxa client',
        packs: 'Fitxa pack',
      };
      return detailByParent[parent] || 'Detall';
    }

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
      <body className="" suppressHydrationWarning>
        <div
          className=""
          onClickCapture={blockInteractionInHelpMode}
          onDoubleClickCapture={blockInteractionInHelpMode}
          onSubmitCapture={blockInteractionInHelpMode}
          onPointerDownCapture={blockInteractionInHelpMode}
        >
          {helpModeEnabled && (
            <div className="">
              Mode ajuda actiu: les accions estan bloquejades. Prem els icones d'ajuda per veure explicacions.
            </div>
          )}
          {helpModeEnabled && <AdminHelpLegend />}
          {helpModeEnabled && <AdminHelpInspector />}
          {/* Desktop Sidebar */}
          <aside className="">
        {/* Logo */}
        <div className="">
          <Link href="/admin" className="">
            <div className="">
              <Image
                src="/img/logosoloplaneta.svg"
                alt="Òrbita"
                width={40}
                height={40}
                sizes="40px"
                quality={80}
                className=""
              />
            </div>
            <div>
              <span className="">Òrbita</span>
              <span className="">Admin</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="">
          <div className="">
            <p className="">
              Prioritat
            </p>
            <div className="">
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
          <div className="">
          <div className="">
            <p className="">Sistema</p>
            <p className="">Òrbita Admin</p>
            <p className="">v2.0 · Prisma + Supabase</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Mejorado */}
      <header className="">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
          aria-label="Obrir menú admin"
          aria-expanded={sidebarOpen}
          aria-controls=""
          className=""
        >
          <svg className="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="">
          <span className="">
            <span className="">Òrbita</span> Admin
          </span>
          <span className="">{getPageName()}</span>
        </div>

        <div className="">
          <button
            type="button"
            data-help-toggle="true"
            onClick={toggleHelpMode}
            className={`${
              helpModeEnabled
                ? ''
                : ''
            }`}
            aria-label="Activar o desactivar mode ajuda"
            aria-pressed={helpModeEnabled}
          >
            ❓ Ajuda
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className=""
            aria-label="Cercar (Ctrl+K)"
          >
            🔍
          </button>
          <Link
            href="/admin/settings/notifications"
            className=""
            aria-label="Notificacions"
          >
            <svg className="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationsCount > 0 && (
              <span className="" />
            )}
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay - Con animación */}
      {mounted && (
        <>
          {/* Backdrop */}
          <div
            className={`${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
          {/* Sidebar */}
          <aside
            id=""
            aria-label="Menú admin"
            className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {/* Header del sidebar */}
            <div className="">
              <div className="">
                <div className="">
                  <Image
                    src="/img/logosoloplaneta.svg"
                    alt="Òrbita"
                    width={36}
                    height={36}
                    className=""
                  />
                </div>
                <div>
                  <span className="">Òrbita Admin</span>
                  <p className="">Panell de gestió</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tancar menú admin"
                onClick={() => setSidebarOpen(false)}
                className=""
              >
                <svg className="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navegación */}
            <nav className="">
              <div className="">
                <p className="">
                  Prioritat
                </p>
                <div className="">
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
            <div className="">
              <Link
                href="/admin/settings"
                onClick={() => setSidebarOpen(false)}
                className=""
              >
                <div className="">
                  A
                </div>
                <div className="">
                  <p className="">Admin</p>
                  <p className="">Configuració del compte</p>
                </div>
                <svg className="" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Desktop Header */}
      <header className="">
        <div className="">
          <Link href="/admin" className="">Admin</Link>
          <span className="">/</span>
          <span className="">{getPageName()}</span>
        </div>
        <div className="">
          <button
            type="button"
            data-help-toggle="true"
            onClick={toggleHelpMode}
            className={`${
              helpModeEnabled
                ? ''
                : ''
            }`}
            aria-pressed={helpModeEnabled}
            aria-label="Activar o desactivar mode ajuda"
          >
            ❓ Ajuda {helpModeEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className=""
            aria-label="Cercar (Ctrl+K)"
          >
            🔍 Cercar
            <span className="">Ctrl/⌘K</span>
          </button>
          <Link
            href="/admin/settings/notifications"
            className=""
            aria-label="Notificacions"
          >
            🔔
            {notificationsCount > 0 && (
              <span className="" />
            )}
          </Link>
          <div className="" />
          <Link
            href="/admin/settings"
            className=""
          >
            <div className="">
              A
            </div>
            <span className="">Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="">
        <div className="">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="">
        <div className="">
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


