# 🎨 ADMIN PANEL ÒRBITA EVENTS - DISSENY ESPECTACULAR

## FILOSOFIA DE DISSENY

```
MODERN · FOSC · ELEGANT · INTUÏTIU
Inspiració: Linear, Vercel, Notion, Stripe Dashboard
```

---

## 🎨 PALETA DE COLORS

```css
/* FONS */
--bg-primary: #0a0a0a;      /* Negre profund */
--bg-secondary: #141414;     /* Cards */
--bg-tertiary: #1a1a1a;      /* Hover states */
--bg-elevated: #1f1f1f;      /* Modals, dropdowns */

/* ACCENT (Taronja Òrbita) */
--accent-500: #F26522;       /* Principal */
--accent-400: #FF7A3D;       /* Hover */
--accent-600: #D94E0F;       /* Active */
--accent-100: rgba(242, 101, 34, 0.1);  /* Backgrounds subtils */

/* TEXT */
--text-primary: #FFFFFF;
--text-secondary: #A1A1A1;
--text-tertiary: #6B6B6B;

/* ESTATS */
--success: #22C55E;
--warning: #EAB308;
--error: #EF4444;
--info: #3B82F6;

/* BORDERS */
--border: rgba(255, 255, 255, 0.08);
--border-hover: rgba(255, 255, 255, 0.15);
```

---

## 📐 LAYOUT PRINCIPAL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌─────────┐  ┌─────────────────────────────────────────────────────────────┐  │
│  │         │  │                                                             │  │
│  │         │  │  HEADER BAR                                                 │  │
│  │         │  │  Breadcrumbs · Search · Notificacions · Perfil              │  │
│  │         │  │                                                             │  │
│  │         │  ├─────────────────────────────────────────────────────────────┤  │
│  │         │  │                                                             │  │
│  │ SIDEBAR │  │                                                             │  │
│  │         │  │                                                             │  │
│  │  Logo   │  │                    CONTINGUT PRINCIPAL                      │  │
│  │         │  │                                                             │  │
│  │  Nav    │  │                    (Dashboard, Leads, etc.)                 │  │
│  │  items  │  │                                                             │  │
│  │         │  │                                                             │  │
│  │         │  │                                                             │  │
│  │         │  │                                                             │  │
│  │         │  │                                                             │  │
│  │ ─────── │  │                                                             │  │
│  │         │  │                                                             │  │
│  │ Config  │  │                                                             │  │
│  │         │  │                                                             │  │
│  └─────────┘  └─────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPONENTS BASE

### 1. SIDEBAR

```tsx
// Sidebar elegant amb icones i efectes hover
const Sidebar = () => (
  <aside className="
    fixed left-0 top-0 bottom-0 w-64
    bg-[#0a0a0a] border-r border-white/5
    flex flex-col
  ">
    {/* Logo */}
    <div className="p-6 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">Ò</span>
        </div>
        <div>
          <span className="text-white font-semibold">Òrbita</span>
          <span className="text-orange-500 font-semibold ml-1">Admin</span>
        </div>
      </div>
    </div>

    {/* Navegació */}
    <nav className="flex-1 p-4 space-y-1">
      <NavSection title="GENERAL">
        <NavItem icon="📊" label="Dashboard" href="/admin" active />
        <NavItem icon="📅" label="Calendari" href="/admin/calendario" badge="3" />
      </NavSection>
      
      <NavSection title="CRM">
        <NavItem icon="👥" label="Leads" href="/admin/leads" badge="12" badgeColor="orange" />
        <NavItem icon="📋" label="Reserves" href="/admin/reservas" />
        <NavItem icon="💬" label="Missatges" href="/admin/mensajes" badge="5" badgeColor="blue" />
      </NavSection>
      
      <NavSection title="CONTINGUT">
        <NavItem icon="✏️" label="Pàgines" href="/admin/paginas" />
        <NavItem icon="📦" label="Packs" href="/admin/packs" />
        <NavItem icon="❓" label="FAQ" href="/admin/faq" />
        <NavItem icon="⭐" label="Testimonis" href="/admin/testimonios" />
      </NavSection>
      
      <NavSection title="OPERACIONS">
        <NavItem icon="🎸" label="Inventari" href="/admin/inventario" />
        <NavItem icon="📊" label="Analytics" href="/admin/analytics" />
      </NavSection>
    </nav>

    {/* Footer sidebar */}
    <div className="p-4 border-t border-white/5">
      <NavItem icon="⚙️" label="Configuració" href="/admin/config" />
      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20">
        <p className="text-xs text-orange-400">Pròxim event</p>
        <p className="text-sm text-white font-medium mt-1">Boda - Dissabte 14</p>
      </div>
    </div>
  </aside>
);

// NavItem component
const NavItem = ({ icon, label, href, active, badge, badgeColor }) => (
  <Link
    href={href}
    className={`
      flex items-center gap-3 px-3 py-2.5 rounded-xl
      transition-all duration-200 group
      ${active 
        ? 'bg-orange-500/10 text-orange-500' 
        : 'text-neutral-400 hover:text-white hover:bg-white/5'
      }
    `}
  >
    <span className="text-lg">{icon}</span>
    <span className="flex-1 font-medium">{label}</span>
    {badge && (
      <span className={`
        px-2 py-0.5 text-xs font-semibold rounded-full
        ${badgeColor === 'orange' ? 'bg-orange-500/20 text-orange-400' :
          badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-400' :
          'bg-white/10 text-neutral-400'
        }
      `}>
        {badge}
      </span>
    )}
  </Link>
);
```

### 2. CARDS MÈTRIQUES (Dashboard)

```tsx
// Cards amb gradient subtil i animació
const MetricCard = ({ icon, label, value, change, changeType, sparkline }) => (
  <div className="
    relative overflow-hidden
    bg-[#141414] rounded-2xl border border-white/5
    p-6 group hover:border-white/10 transition-all duration-300
  ">
    {/* Gradient de fons subtil */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
    
    {/* Contingut */}
    <div className="relative">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <span>{icon}</span>
            <span>{label}</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{value}</div>
          {change && (
            <div className={`
              mt-2 flex items-center gap-1 text-sm
              ${changeType === 'up' ? 'text-green-400' : 'text-red-400'}
            `}>
              <span>{changeType === 'up' ? '↑' : '↓'}</span>
              <span>{change}</span>
              <span className="text-neutral-500">vs mes anterior</span>
            </div>
          )}
        </div>
        
        {/* Mini sparkline chart */}
        {sparkline && (
          <div className="w-24 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
            <Sparkline data={sparkline} />
          </div>
        )}
      </div>
    </div>
  </div>
);

// Ús al Dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard 
    icon="💰" 
    label="Facturat aquest mes" 
    value="4.850€" 
    change="+23%" 
    changeType="up"
    sparkline={[30, 45, 35, 50, 49, 60, 70, 91]}
  />
  <MetricCard 
    icon="📅" 
    label="Events confirmats" 
    value="7" 
    change="+2" 
    changeType="up"
  />
  <MetricCard 
    icon="👥" 
    label="Leads nous" 
    value="23" 
    change="+8" 
    changeType="up"
  />
  <MetricCard 
    icon="⭐" 
    label="Valoració mitjana" 
    value="4.9" 
    change="+0.1" 
    changeType="up"
  />
</div>
```

### 3. TAULA DE LEADS (Moderna)

```tsx
const LeadsTable = () => (
  <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">Leads recents</h3>
        <p className="text-sm text-neutral-500">23 leads aquest mes</p>
      </div>
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Buscar leads..." />
        <FilterButton />
        <Button variant="primary" icon="+" label="Nou lead" />
      </div>
    </div>

    {/* Taula */}
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/5">
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Client
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Event
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Data
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Estat
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Valor
          </th>
          <th className="px-6 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        <LeadRow 
          name="Maria García"
          email="maria@email.com"
          type="Boda"
          date="15 Jun 2025"
          status="nou"
          value="850€"
          avatar="MG"
          timeAgo="Fa 2h"
        />
        <LeadRow 
          name="Pere López"
          email="pere@empresa.com"
          type="Corporatiu"
          date="20 Jun 2025"
          status="contactat"
          value="1.200€"
          avatar="PL"
          timeAgo="Fa 5h"
        />
        {/* ... més files */}
      </tbody>
    </table>
  </div>
);

// Fila de lead amb hover elegant
const LeadRow = ({ name, email, type, date, status, value, avatar, timeAgo }) => (
  <tr className="group hover:bg-white/[0.02] transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center text-orange-400 font-medium">
          {avatar}
        </div>
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-neutral-500 text-sm">{email}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-sm">
        {type === 'Boda' ? '💍' : type === 'Corporatiu' ? '💼' : '🎉'}
        <span className="text-neutral-300">{type}</span>
      </span>
    </td>
    <td className="px-6 py-4 text-neutral-400">{date}</td>
    <td className="px-6 py-4">
      <StatusBadge status={status} />
    </td>
    <td className="px-6 py-4 text-white font-medium">{value}</td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton icon="👁️" tooltip="Veure" />
        <IconButton icon="✏️" tooltip="Editar" />
        <IconButton icon="💬" tooltip="WhatsApp" />
      </div>
    </td>
  </tr>
);

// Badge d'estat amb colors
const StatusBadge = ({ status }) => {
  const styles = {
    nou: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contactat: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    pressupost: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    confirmat: 'bg-green-500/10 text-green-400 border-green-500/20',
    perdut: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  const labels = {
    nou: '🔵 Nou',
    contactat: '🟡 Contactat',
    pressupost: '🟣 Pressupost enviat',
    confirmat: '🟢 Confirmat',
    perdut: '🔴 Perdut',
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
      border ${styles[status]}
    `}>
      {labels[status]}
    </span>
  );
};
```

### 4. CALENDARI VISUAL

```tsx
const CalendarView = () => (
  <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
    {/* Header calendari */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-semibold text-white">Desembre 2024</h3>
        <p className="text-sm text-neutral-500">3 events confirmats</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-white/5 text-neutral-400">←</button>
        <button className="px-4 py-2 rounded-lg bg-white/5 text-white font-medium">Avui</button>
        <button className="p-2 rounded-lg hover:bg-white/5 text-neutral-400">→</button>
      </div>
    </div>

    {/* Grid calendari */}
    <div className="grid grid-cols-7 gap-1">
      {/* Dies de la setmana */}
      {['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(day => (
        <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
          {day}
        </div>
      ))}
      
      {/* Dies del mes */}
      {generateCalendarDays().map((day, i) => (
        <CalendarDay 
          key={i}
          day={day.number}
          isToday={day.isToday}
          isCurrentMonth={day.isCurrentMonth}
          event={day.event}
        />
      ))}
    </div>
  </div>
);

const CalendarDay = ({ day, isToday, isCurrentMonth, event }) => (
  <div className={`
    relative aspect-square p-1
    ${!isCurrentMonth && 'opacity-30'}
  `}>
    <div className={`
      w-full h-full rounded-xl flex flex-col items-center justify-center
      transition-all duration-200 cursor-pointer
      ${isToday 
        ? 'bg-orange-500 text-white' 
        : event 
          ? 'bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20' 
          : 'hover:bg-white/5'
      }
    `}>
      <span className={`text-sm font-medium ${isCurrentMonth ? 'text-white' : 'text-neutral-600'}`}>
        {day}
      </span>
      {event && (
        <span className="text-[10px] text-orange-400 mt-0.5 truncate max-w-full px-1">
          {event.type}
        </span>
      )}
    </div>
  </div>
);
```

### 5. KANBAN DE LEADS

```tsx
const LeadsKanban = () => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    <KanbanColumn 
      title="Nous" 
      icon="🔵" 
      count={5}
      color="blue"
      leads={[...]}
    />
    <KanbanColumn 
      title="Contactats" 
      icon="🟡" 
      count={8}
      color="yellow"
      leads={[...]}
    />
    <KanbanColumn 
      title="Pressupost enviat" 
      icon="🟣" 
      count={4}
      color="purple"
      leads={[...]}
    />
    <KanbanColumn 
      title="Negociant" 
      icon="🟠" 
      count={3}
      color="orange"
      leads={[...]}
    />
    <KanbanColumn 
      title="Confirmats" 
      icon="🟢" 
      count={12}
      color="green"
      leads={[...]}
    />
  </div>
);

const KanbanColumn = ({ title, icon, count, color, leads }) => (
  <div className="flex-shrink-0 w-72">
    {/* Header columna */}
    <div className="flex items-center gap-2 mb-3">
      <span>{icon}</span>
      <span className="font-medium text-white">{title}</span>
      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-xs text-neutral-400">
        {count}
      </span>
    </div>
    
    {/* Cards */}
    <div className="space-y-2">
      {leads.map(lead => (
        <KanbanCard key={lead.id} lead={lead} />
      ))}
    </div>
    
    {/* Afegir nou */}
    <button className="
      w-full mt-2 p-3 rounded-xl border border-dashed border-white/10
      text-neutral-500 hover:text-white hover:border-white/20
      transition-colors flex items-center justify-center gap-2
    ">
      <span>+</span>
      <span>Afegir lead</span>
    </button>
  </div>
);

const KanbanCard = ({ lead }) => (
  <div className="
    p-4 rounded-xl bg-[#1a1a1a] border border-white/5
    hover:border-white/10 transition-all cursor-grab
    group
  ">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center text-orange-400 text-sm font-medium">
          {lead.initials}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{lead.name}</p>
          <p className="text-neutral-500 text-xs">{lead.email}</p>
        </div>
      </div>
    </div>
    
    <div className="mt-3 flex items-center gap-2">
      <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-neutral-400">
        {lead.eventType}
      </span>
      <span className="text-xs text-neutral-500">{lead.eventDate}</span>
    </div>
    
    <div className="mt-3 flex items-center justify-between">
      <span className="text-white font-medium">{lead.value}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400">
          💬
        </button>
        <button className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400">
          📧
        </button>
      </div>
    </div>
  </div>
);
```

### 6. MODAL/DRAWER ELEGANT

```tsx
const SlideOver = ({ isOpen, onClose, title, children }) => (
  <>
    {/* Backdrop */}
    <div 
      className={`
        fixed inset-0 bg-black/60 backdrop-blur-sm z-40
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onClick={onClose}
    />
    
    {/* Panel */}
    <div className={`
      fixed right-0 top-0 bottom-0 w-full max-w-lg
      bg-[#141414] border-l border-white/5
      z-50 transform transition-transform duration-300 ease-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/5 text-neutral-400"
        >
          ✕
        </button>
      </div>
      
      {/* Contingut */}
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        {children}
      </div>
    </div>
  </>
);
```

### 7. FORM INPUTS ELEGANTS

```tsx
// Input amb label flotant i efectes
const Input = ({ label, type = 'text', icon, error, ...props }) => (
  <div className="relative">
    <input
      type={type}
      placeholder=" "
      className={`
        peer w-full px-4 py-3 
        ${icon ? 'pl-11' : ''}
        bg-[#1a1a1a] border rounded-xl
        text-white placeholder-transparent
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-orange-500/50
        ${error 
          ? 'border-red-500/50 focus:border-red-500' 
          : 'border-white/10 hover:border-white/20 focus:border-orange-500'
        }
      `}
      {...props}
    />
    {icon && (
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
        {icon}
      </span>
    )}
    <label className={`
      absolute left-4 top-1/2 -translate-y-1/2
      text-neutral-500 transition-all duration-200
      peer-focus:top-0 peer-focus:text-xs peer-focus:text-orange-500 peer-focus:bg-[#1a1a1a] peer-focus:px-2
      peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#1a1a1a] peer-[:not(:placeholder-shown)]:px-2
      ${icon ? 'left-11' : ''}
    `}>
      {label}
    </label>
    {error && (
      <p className="mt-1 text-xs text-red-400">{error}</p>
    )}
  </div>
);

// Select elegant
const Select = ({ label, options, ...props }) => (
  <div className="relative">
    <select
      className="
        w-full px-4 py-3 pr-10
        bg-[#1a1a1a] border border-white/10 rounded-xl
        text-white appearance-none
        transition-all duration-200
        hover:border-white/20 focus:border-orange-500
        focus:outline-none focus:ring-2 focus:ring-orange-500/50
      "
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
      ▼
    </span>
  </div>
);
```

### 8. TOAST NOTIFICATIONS

```tsx
const Toast = ({ type, message, onClose }) => {
  const styles = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    info: 'border-blue-500/50 bg-blue-500/10',
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`
      fixed bottom-4 right-4 z-50
      flex items-center gap-3 px-4 py-3
      rounded-xl border backdrop-blur-xl
      animate-slide-up
      ${styles[type]}
    `}>
      <span className="text-lg">{icons[type]}</span>
      <p className="text-white">{message}</p>
      <button onClick={onClose} className="ml-2 text-neutral-400 hover:text-white">
        ✕
      </button>
    </div>
  );
};
```

---

## 📱 RESPONSIVE

```tsx
// Sidebar mòbil
const MobileSidebar = ({ isOpen, onClose }) => (
  <>
    {/* Backdrop */}
    <div 
      className={`
        lg:hidden fixed inset-0 bg-black/60 z-40
        transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onClick={onClose}
    />
    
    {/* Sidebar */}
    <aside className={`
      lg:hidden fixed left-0 top-0 bottom-0 w-64
      bg-[#0a0a0a] z-50
      transform transition-transform
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* ... contingut sidebar */}
    </aside>
  </>
);

// Header mòbil
const MobileHeader = ({ onMenuClick }) => (
  <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-white/5 z-30 px-4 flex items-center justify-between">
    <button onClick={onMenuClick} className="p-2 text-white">
      ☰
    </button>
    <span className="text-white font-semibold">Òrbita Admin</span>
    <button className="p-2 text-white">
      🔔
    </button>
  </header>
);
```

---

## 🎬 ANIMACIONS

```css
/* globals.css */

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slide-up {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide in right */
@keyframes slide-in-right {
  from { 
    opacity: 0;
    transform: translateX(20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scale in */
@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse subtle */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Classes */
.animate-fade-in { animation: fade-in 0.2s ease-out; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }

/* Stagger children */
.stagger-children > * {
  animation: slide-up 0.3s ease-out backwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
```

---

## 📊 DASHBOARD COMPLET

```tsx
export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-500">Benvingut, Carles 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon="📥" label="Exportar" />
          <Button variant="primary" icon="+" label="Nova reserva" />
        </div>
      </div>

      {/* Mètriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <MetricCard ... />
        <MetricCard ... />
        <MetricCard ... />
        <MetricCard ... />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendari */}
        <div className="lg:col-span-2">
          <CalendarView />
        </div>
        
        {/* Pròxims events */}
        <div>
          <UpcomingEvents />
        </div>
      </div>

      {/* Leads i activitat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads />
        <ActivityFeed />
      </div>
    </div>
  );
}
```

---

Vols que ho afegeixi tot al ZIP? 🚀
