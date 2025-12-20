'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 🎨 ADMIN LAYOUT - Òrbita Events
 * Amb estructura HTML completa per evitar errors d'hidratació
 */

function SidebarItem({
  icon,
  label,
  href,
  badge,
  badgeColor = 'orange'
}: {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'red';
}) {
  const pathname = usePathname();
  const isActive = href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);

  const badgeStyles = {
    orange: 'bg-orange-500/20 text-orange-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 group
        ${isActive
          ? 'bg-orange-500/10 text-orange-500'
          : 'text-neutral-400 hover:text-white hover:bg-white/5'
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Tancar sidebar al canviar de pàgina
    setSidebarOpen(false);
  }, [pathname]);

  const navSections = [
    {
      title: 'General',
      items: [
        { icon: '📊', label: 'Dashboard', href: '/admin' },
        { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
      ]
    },
    {
      title: 'CRM',
      items: [
        { icon: '👥', label: 'Leads', href: '/admin/leads', badge: 'NEW', badgeColor: 'orange' as const },
        { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
        { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
      ]
    },
    {
      title: 'Contingut',
      items: [
        { icon: '📦', label: 'Packs', href: '/admin/packs' },
        { icon: '💰', label: 'Preus', href: '/admin/pricing' },
        { icon: '❓', label: 'FAQ', href: '/admin/faq' },
        { icon: '⭐', label: 'Testimonis', href: '/admin/testimonios' },
      ]
    },
    {
      title: 'Operacions',
      items: [
        { icon: '🎸', label: 'Inventari', href: '/admin/inventory' },
        { icon: '📈', label: 'Analytics', href: '/admin/analytics' },
        { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
      ]
    },
  ];

  return (
    <html lang="ca" suppressHydrationWarning>
      <body className="bg-[#0a0a0a] text-white" style={{ margin: 0 }} suppressHydrationWarning>
        <div className="min-h-screen">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/5 flex-col z-40">
            {/* Logo */}
            <div className="p-4 border-b border-white/5">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-lg">Ò</span>
                </div>
                <div>
                  <span className="text-white font-semibold">Òrbita</span>
                  <span className="text-orange-500 font-semibold ml-1">Admin</span>
                </div>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.title} className="mb-6">
                  <p className="px-3 mb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <SidebarItem key={item.href} {...item} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <p className="text-[10px] text-orange-400 uppercase tracking-wider">Sistema</p>
                <p className="text-sm text-white font-medium mt-1">Òrbita Admin</p>
                <p className="text-xs text-neutral-500">Prisma + Supabase</p>
              </div>
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 z-50 px-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-white hover:bg-white/5 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-white font-semibold">
              <span className="text-orange-500">Òrbita</span> Admin
            </span>
            <div className="w-10" />
          </header>

          {/* Mobile Sidebar Overlay */}
          {mounted && sidebarOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/5 z-50 overflow-y-auto">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white font-semibold">
                    <span className="text-orange-500">Òrbita</span> Admin
                  </span>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-neutral-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <nav className="p-3">
                  {navSections.map((section) => (
                    <div key={section.title} className="mb-6">
                      <p className="px-3 mb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {section.title}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <SidebarItem key={item.href} {...item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </aside>
            </>
          )}

          {/* Desktop Header */}
          <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 border-b border-white/5 px-6 items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-xl z-30">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-neutral-500">Admin</span>
              <span className="text-neutral-700">/</span>
              <span className="text-white font-medium">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar... (⌘K)"
                  className="w-64 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 text-sm transition-all duration-200 hover:border-white/20 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              <button className="relative p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                🔔
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </button>
              <button className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
                  C
                </div>
                <span className="text-white text-sm font-medium">Carles</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="lg:pl-64 pt-16 min-h-screen">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
