/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN SYSTEM - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file defines the proportional design system for the admin panel.
 * The admin uses a COMPACT system (data-dense UI), while the public web
 * uses a SPACIOUS system (marketing-oriented UI).
 *
 * ADMIN SYSTEM (this file):
 * - Typography: Smaller scales (text-lg max for H1)
 * - Spacing: Tighter (p-3 to p-6)
 * - Purpose: Data management, dense information
 *
 * PUBLIC WEB SYSTEM (see globals.css):
 * - Typography: Larger scales (text-4xl to text-7xl for H1)
 * - Spacing: Generous (py-20 to py-28 for sections)
 * - Purpose: Marketing, conversion, visual impact
 *
 * PROPORTIONAL SCALE:
 * Base unit: 4px (Tailwind default)
 * - xs: 0.25rem (4px)  - micro spacing
 * - sm: 0.5rem (8px)   - tight spacing
 * - md: 1rem (16px)    - base spacing
 * - lg: 1.5rem (24px)  - comfortable spacing
 * - xl: 2rem (32px)    - section spacing
 *
 * RESPONSIVE BREAKPOINTS:
 * - Mobile: < 640px (default)
 * - sm: 640px (small tablets)
 * - md: 768px (tablets)
 * - lg: 1024px (desktop)
 * - xl: 1280px (large desktop)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Background colors
export const bg = {
  primary: 'bg-[#111315]',
  secondary: 'bg-[#1a1e22]',
  card: 'bg-[#f4f1e8]',
  elevated: 'bg-[#ebe4d6]',
  input: 'bg-[#f7f2e8]',
} as const;

// Border colors
export const border = {
  subtle: 'border-[#e0d6c3]',
  default: 'border-[#d4c7b2]',
  focus: 'focus:border-[#b8871e]',
} as const;

// Text colors
export const text = {
  primary: 'text-[#2f2b26]',
  secondary: 'text-[#3b342d]',
  muted: 'text-[#6f6457]',
  accent: 'text-[#b8871e]',
} as const;

// Accent gradients for stat cards
export const accent = {
  cyan: 'from-amber-500/10 to-orange-600/5',
  emerald: 'from-emerald-500/10 to-emerald-600/5',
  rose: 'from-rose-500/10 to-rose-600/5',
  amber: 'from-amber-500/10 to-amber-600/5',
  purple: 'from-stone-500/10 to-amber-600/5',
  sky: 'from-orange-500/10 to-amber-600/5',
} as const;

// Accent border colors
export const accentBorder = {
  cyan: 'border-amber-500/20',
  emerald: 'border-emerald-500/20',
  rose: 'border-rose-500/20',
  amber: 'border-amber-500/20',
  purple: 'border-stone-500/20',
  sky: 'border-orange-500/20',
} as const;

// Badge colors (semi-transparent for dark theme)
export const badge = {
  blue: 'bg-blue-500/20 text-blue-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  purple: 'bg-purple-500/20 text-purple-300',
  orange: 'bg-amber-500/20 text-amber-300',
  green: 'bg-emerald-500/20 text-emerald-300',
  red: 'bg-rose-500/20 text-rose-300',
  gray: 'bg-slate-500/20 text-slate-300',
} as const;

// Common component classes
export const card = {
  base: 'rounded-2xl border border-[#d4c7b2] bg-[#f4f1e8] backdrop-blur-sm',
  header: 'bg-[#ebe4d6] border-b border-[#d4c7b2]',
  hover: 'hover:bg-[#efe6d7]',
} as const;

export const button = {
  primary: 'rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-white shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-orange-500 active:from-amber-700 active:to-orange-700',
  secondary: 'rounded-xl border border-[#d4c7b2] bg-[#f7f2e8] px-4 py-2 text-[#3b342d] hover:bg-[#efe6d7]',
  ghost: 'rounded-xl bg-transparent px-4 py-2 text-[#6f6457] hover:bg-[#efe6d7] hover:text-[#3b342d]',
} as const;

export const input = {
  base: 'rounded-xl border border-[#d4c7b2] bg-[#f7f2e8] px-4 py-2 text-[#2f2b26] placeholder:text-[#8c8172] focus:border-[#b8871e] focus:ring-1 focus:ring-[#b8871e]',
} as const;

// Table styles
export const table = {
  header: 'bg-[#efe6d7] border-b border-[#d4c7b2]',
  row: 'border-b border-[#e0d6c3] hover:bg-[#f1eadf]',
  cell: 'px-4 py-3',
} as const;

// Status colors for leads/bookings (dark theme)
export const statusColors = {
  NEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Nova' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Contactada' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'En negociació' },
  WON: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Guanyada' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Perduda' },
  PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Pendent' },
  CONFIRMED: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Confirmada' },
  PREPARING: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Preparant' },
  COMPLETED: { bg: 'bg-teal-500/20', text: 'text-teal-300', label: 'Completada' },
  CANCELLED: { bg: 'bg-rose-500/20', text: 'text-rose-300', label: 'Cancel·lada' },
} as const;

// Priority colors
export const priorityColors = {
  LOW: 'bg-slate-500/20 text-slate-300',
  MEDIUM: 'bg-blue-500/20 text-blue-300',
  HIGH: 'bg-orange-500/20 text-orange-300',
  URGENT: 'bg-rose-500/20 text-rose-300',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY SYSTEM - Proportional sizes
// ═══════════════════════════════════════════════════════════════════════════

export const typography = {
  // Page titles
  h1: 'text-xl sm:text-2xl font-semibold tracking-tight',
  // Section titles
  h2: 'text-lg sm:text-xl font-semibold',
  // Card titles
  h3: 'text-base sm:text-lg font-semibold',
  // Subsection titles
  h4: 'text-sm sm:text-base font-medium',
  // Body text
  body: 'text-sm sm:text-base',
  // Small body text
  bodySmall: 'text-xs sm:text-sm',
  // Labels and captions
  label: 'text-xs font-medium uppercase tracking-wider',
  // Metadata (dates, IDs, etc.)
  meta: 'text-xs',
  // Badge text
  badge: 'text-xs font-medium',
  // Stats/numbers
  stat: 'text-2xl sm:text-3xl font-bold',
  statSmall: 'text-xl sm:text-2xl font-bold',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING SYSTEM - Proportional padding and gaps
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
  // Page padding
  page: 'p-4 sm:p-6',
  pageX: 'px-4 sm:px-6',
  pageY: 'py-4 sm:py-6',
  // Section spacing
  section: 'py-6 sm:py-8',
  sectionGap: 'space-y-6 sm:space-y-8',
  // Card padding
  card: 'p-4 sm:p-6',
  cardCompact: 'p-3 sm:p-4',
  cardHeader: 'px-4 sm:px-6 py-3 sm:py-4',
  // Grid gaps
  grid: 'gap-4 sm:gap-6',
  gridCompact: 'gap-3 sm:gap-4',
  gridTight: 'gap-2 sm:gap-3',
  // List item spacing
  listItem: 'px-4 sm:px-6 py-3 sm:py-4',
  listItemCompact: 'px-3 sm:px-4 py-2 sm:py-3',
  // Form spacing
  formGroup: 'space-y-4 sm:space-y-6',
  formField: 'space-y-1.5 sm:space-y-2',
  // Button spacing
  buttonGap: 'gap-2 sm:gap-3',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER SYSTEM - Max widths and responsive containers
// ═══════════════════════════════════════════════════════════════════════════

export const container = {
  // Full width with max constraint
  page: 'w-full max-w-7xl mx-auto',
  // Narrower content (forms, detail views)
  content: 'w-full max-w-4xl mx-auto',
  // Compact content (single column)
  narrow: 'w-full max-w-2xl mx-auto',
  // Wide content (dashboards, tables)
  wide: 'w-full max-w-screen-2xl mx-auto',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS SYSTEM - Consistent rounding
// ═══════════════════════════════════════════════════════════════════════════

export const radius = {
  sm: 'rounded-lg',      // 8px - buttons, badges
  md: 'rounded-xl',      // 12px - inputs, small cards
  lg: 'rounded-2xl',     // 16px - cards, sections
  xl: 'rounded-3xl',     // 24px - large cards, modals
  full: 'rounded-full',  // pills, avatars
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// GRID LAYOUTS - Responsive column patterns
// ═══════════════════════════════════════════════════════════════════════════

export const grid = {
  // Stats grid (2 cols mobile, 4-6 cols desktop)
  stats: 'grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
  // Cards grid (1 col mobile, 2-3 cols desktop)
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // Form grid (1 col mobile, 2 cols desktop)
  form: 'grid grid-cols-1 md:grid-cols-2',
  // Dashboard layout
  dashboard: 'grid grid-cols-1 lg:grid-cols-3',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRESETS - Complete component class combinations
// ═══════════════════════════════════════════════════════════════════════════

export const components = {
  // Metric/Stat card
  metricCard: 'rounded-2xl border p-4 sm:p-5 backdrop-blur-sm bg-gradient-to-br',
  // Data card
  dataCard: 'rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6',
  // Table container
  tableContainer: 'rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden',
  // Form section
  formSection: 'rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 space-y-4 sm:space-y-6',
  // Page header
  pageHeader: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
} as const;
