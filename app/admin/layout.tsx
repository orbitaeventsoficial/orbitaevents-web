'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 🎨 ADMIN LAYOUT - Simplified Version
 * Eliminat MobileAdminLayout per evitar errors d'hidratació
 */

// Sidebar Item Component
function SidebarItem({
  icon,
  label,
  href,
  isActive
}: {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200
        ${isActive
          ? 'bg-orange-500/10 text-orange-500'
          : 'text-neutral-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { icon: '📊', label: 'Dashboard', href: '/admin' },
    { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
    { icon: '👥', label: 'Leads', href: '/admin/leads' },
    { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
    { icon: '💬', label: 'Missatges', href: '/admin/mensajes' },
    { icon: '📦', label: 'Packs', href: '/admin/packs' },
    { icon: '💰', label: 'Preus', href: '/admin/pricing' },
    { icon: '⭐', label: 'Testimonis', href: '/admin/testimonios' },
    { icon: '🎸', label: 'Inventari', href: '/admin/inventory' },
    { icon: '📈', label: 'Analytics', href: '/admin/analytics' },
    { icon: '⚙️', label: 'Configuració', href: '/admin/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href) || false;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
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
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>
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
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/5 z-50 p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-semibold">
                <span className="text-orange-500">Òrbita</span> Admin
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={isActive(item.href)}
                />
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
          <button className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
              C
            </div>
            <span className="text-white text-sm font-medium">Carles</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-16 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
