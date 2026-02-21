export type LeadColorOption = {
  key: string;
  label: string;
  baseVar: string;
  bgVar: string;
  borderVar: string;
  textVar: string;
  badgeClass: string;
  chipClass: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '').trim();
  const normalized = value.length === 3
    ? value.split('').map((char) => `${char}${char}`).join('')
    : value;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return [r, g, b];
}

function buildToneVars(baseHex: string) {
  const [r, g, b] = hexToRgb(baseHex);
  return {
    base: baseHex,
    bg: `rgba(${r}, ${g}, ${b}, 0.22)`,
    border: `rgba(${r}, ${g}, ${b}, 0.58)`,
    text: `rgb(${r}, ${g}, ${b})`,
  };
}

export const STATUS_COLOR_OPTIONS: LeadColorOption[] = [
  {
    key: 'NEW',
    label: 'Entrada nova',
    baseVar: '--lead-status-new-base',
    bgVar: '--lead-status-new-bg',
    borderVar: '--lead-status-new-border',
    textVar: '--lead-status-new-text',
    badgeClass: 'border border-[var(--lead-status-new-border)] bg-[var(--lead-status-new-bg)] text-[var(--lead-status-new-text)]',
    chipClass: 'border border-[var(--lead-status-new-border)] bg-[var(--lead-status-new-bg)] text-[var(--lead-status-new-text)]',
  },
  {
    key: 'CONTACTED',
    label: 'Contactat',
    baseVar: '--lead-status-contacted-base',
    bgVar: '--lead-status-contacted-bg',
    borderVar: '--lead-status-contacted-border',
    textVar: '--lead-status-contacted-text',
    badgeClass: 'border border-[var(--lead-status-contacted-border)] bg-[var(--lead-status-contacted-bg)] text-[var(--lead-status-contacted-text)]',
    chipClass: 'border border-[var(--lead-status-contacted-border)] bg-[var(--lead-status-contacted-bg)] text-[var(--lead-status-contacted-text)]',
  },
  {
    key: 'QUOTE_SENT',
    label: 'Pressupost enviat',
    baseVar: '--lead-status-quote-base',
    bgVar: '--lead-status-quote-bg',
    borderVar: '--lead-status-quote-border',
    textVar: '--lead-status-quote-text',
    badgeClass: 'border border-[var(--lead-status-quote-border)] bg-[var(--lead-status-quote-bg)] text-[var(--lead-status-quote-text)]',
    chipClass: 'border border-[var(--lead-status-quote-border)] bg-[var(--lead-status-quote-bg)] text-[var(--lead-status-quote-text)]',
  },
  {
    key: 'NEGOTIATING',
    label: 'Negociació',
    baseVar: '--lead-status-negotiating-base',
    bgVar: '--lead-status-negotiating-bg',
    borderVar: '--lead-status-negotiating-border',
    textVar: '--lead-status-negotiating-text',
    badgeClass: 'border border-[var(--lead-status-negotiating-border)] bg-[var(--lead-status-negotiating-bg)] text-[var(--lead-status-negotiating-text)]',
    chipClass: 'border border-[var(--lead-status-negotiating-border)] bg-[var(--lead-status-negotiating-bg)] text-[var(--lead-status-negotiating-text)]',
  },
  {
    key: 'WON',
    label: 'Guanyat!',
    baseVar: '--lead-status-won-base',
    bgVar: '--lead-status-won-bg',
    borderVar: '--lead-status-won-border',
    textVar: '--lead-status-won-text',
    badgeClass: 'border border-[var(--lead-status-won-border)] bg-[var(--lead-status-won-bg)] text-[var(--lead-status-won-text)]',
    chipClass: 'border border-[var(--lead-status-won-border)] bg-[var(--lead-status-won-bg)] text-[var(--lead-status-won-text)]',
  },
  {
    key: 'LOST',
    label: 'Perdut',
    baseVar: '--lead-status-lost-base',
    bgVar: '--lead-status-lost-bg',
    borderVar: '--lead-status-lost-border',
    textVar: '--lead-status-lost-text',
    badgeClass: 'border border-[var(--lead-status-lost-border)] bg-[var(--lead-status-lost-bg)] text-[var(--lead-status-lost-text)]',
    chipClass: 'border border-[var(--lead-status-lost-border)] bg-[var(--lead-status-lost-bg)] text-[var(--lead-status-lost-text)]',
  },
];

export const PRIORITY_COLOR_OPTIONS: LeadColorOption[] = [
  {
    key: 'LOW',
    label: 'Baixa',
    baseVar: '--lead-priority-low-base',
    bgVar: '--lead-priority-low-bg',
    borderVar: '--lead-priority-low-border',
    textVar: '--lead-priority-low-text',
    badgeClass: 'border border-[var(--lead-priority-low-border)] bg-[var(--lead-priority-low-bg)] text-[var(--lead-priority-low-text)]',
    chipClass: 'border border-[var(--lead-priority-low-border)] bg-[var(--lead-priority-low-bg)] text-[var(--lead-priority-low-text)]',
  },
  {
    key: 'MEDIUM',
    label: 'Mitjana',
    baseVar: '--lead-priority-medium-base',
    bgVar: '--lead-priority-medium-bg',
    borderVar: '--lead-priority-medium-border',
    textVar: '--lead-priority-medium-text',
    badgeClass: 'border border-[var(--lead-priority-medium-border)] bg-[var(--lead-priority-medium-bg)] text-[var(--lead-priority-medium-text)]',
    chipClass: 'border border-[var(--lead-priority-medium-border)] bg-[var(--lead-priority-medium-bg)] text-[var(--lead-priority-medium-text)]',
  },
  {
    key: 'HIGH',
    label: 'Alta',
    baseVar: '--lead-priority-high-base',
    bgVar: '--lead-priority-high-bg',
    borderVar: '--lead-priority-high-border',
    textVar: '--lead-priority-high-text',
    badgeClass: 'border border-[var(--lead-priority-high-border)] bg-[var(--lead-priority-high-bg)] text-[var(--lead-priority-high-text)]',
    chipClass: 'border border-[var(--lead-priority-high-border)] bg-[var(--lead-priority-high-bg)] text-[var(--lead-priority-high-text)]',
  },
  {
    key: 'URGENT',
    label: 'Urgent',
    baseVar: '--lead-priority-urgent-base',
    bgVar: '--lead-priority-urgent-bg',
    borderVar: '--lead-priority-urgent-border',
    textVar: '--lead-priority-urgent-text',
    badgeClass: 'border border-[var(--lead-priority-urgent-border)] bg-[var(--lead-priority-urgent-bg)] text-[var(--lead-priority-urgent-text)]',
    chipClass: 'border border-[var(--lead-priority-urgent-border)] bg-[var(--lead-priority-urgent-bg)] text-[var(--lead-priority-urgent-text)]',
  },
];

export const DEFAULT_BASE_COLORS: Record<string, string> = {
  NEW: '#22d3ee',
  CONTACTED: '#fbbf24',
  QUOTE_SENT: '#a78bfa',
  NEGOTIATING: '#fb923c',
  WON: '#86efac',
  LOST: '#94a3b8',
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

const ALL_OPTIONS = [...STATUS_COLOR_OPTIONS, ...PRIORITY_COLOR_OPTIONS];

export const LEAD_COLOR_DEFAULT_VARS: Record<string, string> = ALL_OPTIONS.reduce((acc, option) => {
  const base = DEFAULT_BASE_COLORS[option.key] || '#94a3b8';
  const tones = buildToneVars(base);
  acc[option.baseVar] = tones.base;
  acc[option.bgVar] = tones.bg;
  acc[option.borderVar] = tones.border;
  acc[option.textVar] = tones.text;
  return acc;
}, {} as Record<string, string>);
