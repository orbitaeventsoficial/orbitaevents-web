'use client';

import { useState, useEffect } from 'react';
import AdminSidebar, { MobileSidebar } from './components/Sidebar';
import MobileAdminLayout from './components/mobile/MobileAdminLayout';

/**
 * 🎨 ADMIN LAYOUT - Modern & Elegant
 * v3.0 - Mobile Pro amb splash, offline indicator, page transitions
 */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure hydration safety by tracking client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <MobileAdminLayout>
      <div className="min-h-screen bg-[#0a0a0a]" suppressHydrationWarning>
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          {isMounted && <AdminSidebar />}
        </div>

        {/* Sidebar Mobile (drawer) */}
        {isMounted && <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 z-30 px-4 flex items-center justify-between" style={{ top: 'env(safe-area-inset-top, 0)' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-white font-semibold">
              <span className="text-orange-500">Òrbita</span> Admin
            </span>
            <button className="p-2 text-white hover:bg-white/5 rounded-lg transition-colors relative">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
          </header>

          {/* Desktop Header */}
          <header className="hidden lg:flex h-16 border-b border-white/5 px-6 items-center justify-between sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-20">
            {/* Breadcrumbs / Title */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-neutral-500">Admin</span>
              <span className="text-neutral-700">/</span>
              <span className="text-white font-medium">Dashboard</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar... (⌘K)"
                  className="
                    w-64 pl-9 pr-4 py-2
                    bg-white/5 border border-white/10 rounded-xl
                    text-white placeholder-neutral-500 text-sm
                    transition-all duration-200
                    hover:border-white/20 focus:border-orange-500
                    focus:outline-none focus:ring-2 focus:ring-orange-500/50
                  "
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                🔔
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </button>

              {/* Profile */}
              <button className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/5 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
                  C
                </div>
                <span className="text-white text-sm font-medium">Carles</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-6 mt-16 lg:mt-0 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
    </MobileAdminLayout>
  );
}
