'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * 🎨 SIDEBAR ADMIN - Elegant i Modern
 */

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'red';
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

const NavSection = ({ title, children }: NavSectionProps) => (
  <div className="mb-6">
    <p className="px-3 mb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
      {title}
    </p>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const NavItem = ({ icon, label, href, badge, badgeColor = 'orange' }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

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
          : 'text-neutral-400 hover:text-slate-800 hover:bg-stone-100'
        }
      `}
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="flex-1 font-medium text-sm">{label}</span>
      {badge && (
        <span className={`
          px-2 py-0.5 text-xs font-semibold rounded-full
          ${badgeStyles[badgeColor]}
        `}>
          {badge}
        </span>
      )}
    </Link>
  );
};

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`
      fixed left-0 top-0 bottom-0
      bg-[#0a0a0a] border-r border-stone-200
      flex flex-col
      transition-all duration-300
      ${collapsed ? 'w-20' : 'w-64'}
      hidden lg:flex
    `}>
      {/* Logo */}
      <div className="p-4 border-b border-stone-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-slate-800 font-bold text-lg">Ò</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="text-slate-800 font-semibold">Òrbita</span>
              <span className="text-orange-500 font-semibold ml-1">Admin</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navegació */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <NavSection title={collapsed ? '' : 'General'}>
          <NavItem icon="📊" label="Dashboard" href="/admin" />
          <NavItem icon="📅" label="Calendari" href="/admin/calendario" badge="3" />
        </NavSection>
        
        <NavSection title={collapsed ? '' : 'CRM'}>
          <NavItem icon="👥" label="Leads" href="/admin/leads" badge="12" badgeColor="orange" />
          <NavItem icon="📋" label="Reserves" href="/admin/bookings" />
          <NavItem icon="💬" label="Missatges" href="/admin/mensajes" badge="5" badgeColor="blue" />
        </NavSection>

        <NavSection title={collapsed ? '' : 'Contingut'}>
          <NavItem icon="📦" label="Packs" href="/admin/packs" />
          <NavItem icon="💰" label="Preus" href="/admin/pricing" />
          <NavItem icon="❓" label="FAQ" href="/admin/faq" />
          <NavItem icon="⭐" label="Testimonis" href="/admin/testimonios" />
          <NavItem icon="🌍" label="Textos" href="/admin/texts" />
          <NavItem icon="📝" label="Textos PRO" href="/admin/text-manager" badge="PRO" badgeColor="green" />
        </NavSection>

        <NavSection title={collapsed ? '' : 'Operacions'}>
          <NavItem icon="🎸" label="Inventari" href="/admin/inventory" />
          <NavItem icon="📈" label="Analytics" href="/admin/analytics" />
          <NavItem icon="📝" label="Post-Event" href="/admin/post-event" />
        </NavSection>

        <NavSection title={collapsed ? '' : 'Automatització'}>
          <NavItem icon="📬" label="Inbox" href="/admin/inbox" badge="NEW" badgeColor="blue" />
          <NavItem icon="📧" label="Emails" href="/admin/emails" badge="AUTO" badgeColor="green" />
          <NavItem icon="🎨" label="Canvas" href="/admin/canvas" />
          <NavItem icon="⭐" label="Ressenyes" href="/admin/ressenyes" />
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-stone-200">
        <NavItem icon="⚙️" label="Configuració" href="/admin/settings" />
        
        {!collapsed && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20">
            <p className="text-[10px] text-orange-400 uppercase tracking-wider">Pròxim event</p>
            <p className="text-sm text-slate-800 font-medium mt-1">Boda - Dissabte 14</p>
            <p className="text-xs text-neutral-500">Mas Can Ferrer, Granollers</p>
          </div>
        )}

        {/* Collapse button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="mt-3 w-full p-2 rounded-lg hover:bg-stone-100 text-neutral-500 text-sm flex items-center justify-center gap-2"
        >
          {collapsed ? '→' : '← Minimitzar'}
        </button>
      </div>
    </aside>
  );
}

// Mobile sidebar
export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          lg:hidden fixed inset-0 bg-stone-200/70 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className={`
        lg:hidden fixed left-0 top-0 bottom-0 w-64
        bg-[#0a0a0a] border-r border-stone-200 z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Contingut igual que desktop */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-slate-800 font-bold text-lg">Ò</span>
            </div>
            <div>
              <span className="text-slate-800 font-semibold">Òrbita</span>
              <span className="text-orange-500 font-semibold ml-1">Admin</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-slate-800">
            ✕
          </button>
        </div>
        
        <nav className="p-3 overflow-y-auto flex-1">
          <NavSection title="General">
            <NavItem icon="📊" label="Dashboard" href="/admin" />
            <NavItem icon="📅" label="Calendari" href="/admin/calendario" badge="3" />
          </NavSection>

          <NavSection title="CRM">
            <NavItem icon="👥" label="Leads" href="/admin/leads" badge="12" badgeColor="orange" />
            <NavItem icon="📋" label="Reserves" href="/admin/bookings" />
            <NavItem icon="💬" label="Missatges" href="/admin/mensajes" badge="5" badgeColor="blue" />
          </NavSection>

          <NavSection title="Contingut">
            <NavItem icon="📦" label="Packs" href="/admin/packs" />
            <NavItem icon="💰" label="Preus" href="/admin/pricing" />
            <NavItem icon="❓" label="FAQ" href="/admin/faq" />
            <NavItem icon="⭐" label="Testimonis" href="/admin/testimonios" />
            <NavItem icon="🌍" label="Textos" href="/admin/texts" />
            <NavItem icon="📝" label="Textos PRO" href="/admin/text-manager" badge="PRO" badgeColor="green" />
          </NavSection>

          <NavSection title="Operacions">
            <NavItem icon="🎸" label="Inventari" href="/admin/inventory" />
            <NavItem icon="📈" label="Analytics" href="/admin/analytics" />
            <NavItem icon="📝" label="Post-Event" href="/admin/post-event" />
          </NavSection>

          <NavSection title="Automatització">
            <NavItem icon="📬" label="Inbox" href="/admin/inbox" badge="NEW" badgeColor="blue" />
            <NavItem icon="📧" label="Emails" href="/admin/emails" badge="AUTO" badgeColor="green" />
            <NavItem icon="🎨" label="Canvas" href="/admin/canvas" />
            <NavItem icon="⭐" label="Ressenyes" href="/admin/ressenyes" />
          </NavSection>

          <NavSection title="">
            <NavItem icon="⚙️" label="Configuració" href="/admin/settings" />
          </NavSection>
        </nav>
      </aside>
    </>
  );
}
