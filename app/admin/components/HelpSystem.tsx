'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

// ═══════════════════════════════════════════════════════════════════════════
// GLOSSARI COMPLET
// Totes les definicions de termes de l'admin
// ═══════════════════════════════════════════════════════════════════════════

export type HelpItem = {
  id: string;
  term: string;
  description: string;
  example?: string;
  category: 'leads' | 'clients' | 'bookings' | 'quotes' | 'tasks' | 'analytics' | 'general';
};

export const HELP_GLOSSARY: HelpItem[] = [
  // LEADS / ENTRADES
  {
    id: 'lead',
    term: 'Entrada',
    description: 'Persona que ha preguntat però encara NO és client. Pot convertir-se en reserva o perdre\'s.',
    example: 'Una persona que omple el formulari de contacte és una entrada.',
    category: 'leads',
  },
  {
    id: 'lead-status',
    term: 'Estat entrada',
    description: 'En quin punt del procés de venda està: Nova → Contactada → Pressupost → Negociació → Guanyada/Perduda.',
    category: 'leads',
  },
  {
    id: 'lead-score',
    term: 'Puntuació',
    description: 'Nota automàtica de 0 a 100 que indica la probabilitat que l\'entrada es converteixi en reserva.',
    example: '85+ = molt probable, 50-84 = possible, <50 = poc probable',
    category: 'leads',
  },
  {
    id: 'lead-source',
    term: 'Origen',
    description: 'D\'on ha vingut el contacte: Web, Instagram, WhatsApp, Wallapop, Referit...',
    category: 'leads',
  },
  {
    id: 'lead-priority',
    term: 'Prioritat',
    description: 'Urgència de resposta. Alta = respondre avui. Mitjana = aquesta setmana. Baixa = quan puguis.',
    category: 'leads',
  },
  {
    id: 'utm-source',
    term: 'UTM Source',
    description: 'D\'on ve el tràfic: google, instagram, facebook, email...',
    example: 'Si ve de Google Ads, utm_source=google',
    category: 'analytics',
  },
  {
    id: 'utm-medium',
    term: 'UTM Medium',
    description: 'Tipus de canal: cpc (pagat), organic, social, email, referral...',
    category: 'analytics',
  },
  {
    id: 'utm-campaign',
    term: 'UTM Campaign',
    description: 'Nom de la campanya específica, per exemple "bodas-2026" o "blackfriday".',
    category: 'analytics',
  },
  {
    id: 'landing-page',
    term: 'Landing',
    description: 'La pàgina exacta on estava l\'usuari quan va omplir el formulari.',
    category: 'analytics',
  },

  // CLIENTS
  {
    id: 'customer',
    term: 'Client',
    description: 'Persona ja registrada al sistema. Pot tenir múltiples esdeveniments i un historial complet.',
    category: 'clients',
  },
  {
    id: 'customer-status',
    term: 'Estat client',
    description: 'Situat del client: Entrada → Negociació → Confirmat → Post-Esdeveniment → (o Perdut).',
    category: 'clients',
  },
  {
    id: 'total-spent',
    term: 'Total gastat',
    description: 'Suma de tots els imports que el client ha pagat històricament.',
    category: 'clients',
  },
  {
    id: 'lifetime-value',
    term: 'Valor del client',
    description: 'Valor total que el client aporta, incloent recomanacions i repeticions.',
    category: 'clients',
  },

  // RESERVES / BOOKINGS
  {
    id: 'booking',
    term: 'Reserva',
    description: 'Esdeveniment confirmat amb data, horari i condicions acordades.',
    category: 'bookings',
  },
  {
    id: 'booking-status',
    term: 'Estat reserva',
    description: 'Pendent (sense confirmar) → Confirmada (amb senyal) → Preparant → Completada → Cancel·lada.',
    category: 'bookings',
  },
  {
    id: 'deposit',
    term: 'Senyal / Dipòsit',
    description: 'Pagament inicial (normalment 30%) per confirmar la reserva i bloquejar la data.',
    category: 'bookings',
  },
  {
    id: 'event-date',
    term: 'Data esdeveniment',
    description: 'Dia en què es farà l\'esdeveniment.',
    category: 'bookings',
  },

  // PRESSUPOSTOS / QUOTES
  {
    id: 'quote',
    term: 'Pressupost',
    description: 'Document amb la proposta econòmica que envies al client abans de confirmar.',
    category: 'quotes',
  },
  {
    id: 'quote-status',
    term: 'Estat pressupost',
    description: 'Esborrany → Enviat → Llegit → Acceptat/Rebutjat/Caducat.',
    category: 'quotes',
  },
  {
    id: 'quote-validity',
    term: 'Validesa',
    description: 'Dies que el pressupost és vàlid. Després caduca automàticament.',
    category: 'quotes',
  },
  {
    id: 'discount',
    term: 'Descompte',
    description: 'Reducció aplicada al preu. Pot ser % o import fix.',
    category: 'quotes',
  },
  {
    id: 'margin',
    term: 'Marge',
    description: 'Diferència entre el que cobres i el que et costa. El teu benefici real.',
    example: 'Si cobres 1000€ i et costa 600€, el marge és 400€ (40%).',
    category: 'quotes',
  },

  // TASQUES
  {
    id: 'task',
    term: 'Tasca',
    description: 'Acció pendent de fer: trucar, enviar pressupost, confirmar detalls...',
    category: 'tasks',
  },
  {
    id: 'task-due',
    term: 'Venciment',
    description: 'Data límit per completar la tasca.',
    category: 'tasks',
  },

  // ANALÍTICA
  {
    id: 'conversion-rate',
    term: 'Taxa conversió',
    description: 'De cada 100 entrades, quantes acaben reservant. Objectiu: >20%.',
    example: '25 reserves de 100 entrades = 25% conversió.',
    category: 'analytics',
  },
  {
    id: 'cac',
    term: 'CAC',
    description: 'Cost d\'Adquisició de Client. Quant gastes en màrqueting per aconseguir un client.',
    example: 'Si gastes 500€ en ads i aconsegueixes 10 clients, CAC = 50€.',
    category: 'analytics',
  },
  {
    id: 'pipeline-value',
    term: 'Valor pipeline',
    description: 'Suma de tots els pressupostos pendents. El que podries facturar si tot es tanca.',
    category: 'analytics',
  },

  // GENERAL
  {
    id: 'gdpr',
    term: 'GDPR',
    description: 'Llei de protecció de dades. El client ha d\'acceptar que guardis les seves dades.',
    category: 'general',
  },
  {
    id: 'locale',
    term: 'Idioma preferit',
    description: 'Idioma en què el client vol rebre comunicacions: Català, Castellà o Anglès.',
    category: 'general',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

type HelpContextValue = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
  activeItem: HelpItem | null;
  setActiveItem: (item: HelpItem | null) => void;
  showLegend: boolean;
  setShowLegend: (value: boolean) => void;
  getHelp: (id: string) => HelpItem | undefined;
  searchHelp: (query: string) => HelpItem[];
};

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [activeItem, setActiveItem] = useState<HelpItem | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) setShowLegend(true);
      return next;
    });
  }, []);

  const getHelp = useCallback((id: string) => {
    return HELP_GLOSSARY.find((item) => item.id === id);
  }, []);

  const searchHelp = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return HELP_GLOSSARY.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.includes(q)
    );
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      toggle,
      setEnabled,
      activeItem,
      setActiveItem,
      showLegend,
      setShowLegend,
      getHelp,
      searchHelp,
    }),
    [enabled, toggle, activeItem, showLegend, getHelp, searchHelp]
  );

  return (
    <HelpContext.Provider value={value}>
      {children}
      {enabled && <HelpLegendPanel />}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp must be used within HelpProvider');
  return ctx;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELP TRIGGER - Botó d'ajuda per la capçalera
// ═══════════════════════════════════════════════════════════════════════════

export function HelpToggleButton() {
  const { enabled, toggle } = useHelp();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
        enabled
          ? 'border-amber-400/70 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20'
          : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-amber-500/30 hover:text-slate-100'
      }`}
      aria-pressed={enabled}
    >
      <span className="text-base">{enabled ? '💡' : '❓'}</span>
      <span className="hidden sm:inline">
        {enabled ? 'Ajuda ACTIVA' : 'Ajuda'}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELP TOOLTIP - Tooltip que apareix al hover d'un element
// ═══════════════════════════════════════════════════════════════════════════

type HelpTooltipProps = {
  id: string;
  children: ReactNode;
  inline?: boolean;
};

export function HelpTooltip({ id, children, inline = false }: HelpTooltipProps) {
  const { enabled, getHelp, setActiveItem } = useHelp();
  const [showTip, setShowTip] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const item = getHelp(id);

  useEffect(() => setMounted(true), []);

  const handleMouseEnter = useCallback(() => {
    if (!enabled || !item) return;
    setShowTip(true);
    setActiveItem(item);
    
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [enabled, item, setActiveItem]);

  const handleMouseLeave = useCallback(() => {
    setShowTip(false);
  }, []);

  if (!item) return <>{children}</>;

  const wrapper = (
    <span
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${inline ? 'inline' : 'inline-block'} ${
        enabled ? 'cursor-help underline decoration-amber-500/50 decoration-dotted underline-offset-4' : ''
      }`}
    >
      {children}
      {enabled && (
        <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] text-amber-400">
          ?
        </span>
      )}
    </span>
  );

  const tooltip =
    mounted && showTip && enabled ? (
      createPortal(
        <div
          className="fixed z-[99999] max-w-xs rounded-xl border border-amber-500/30 bg-slate-900 p-3 shadow-2xl"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="text-sm font-semibold text-amber-300">{item.term}</p>
          <p className="mt-1 text-xs text-slate-300">{item.description}</p>
          {item.example && (
            <p className="mt-2 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-400">
              💡 {item.example}
            </p>
          )}
        </div>,
        document.body
      )
    ) : null;

  return (
    <>
      {wrapper}
      {tooltip}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELP LEGEND PANEL - Panell lateral amb tot el glossari
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_LABELS: Record<HelpItem['category'], { label: string; icon: string }> = {
  leads: { label: 'Entrades', icon: '📥' },
  clients: { label: 'Clients', icon: '👤' },
  bookings: { label: 'Reserves', icon: '📅' },
  quotes: { label: 'Pressupostos', icon: '📄' },
  tasks: { label: 'Tasques', icon: '✅' },
  analytics: { label: 'Analítica', icon: '📊' },
  general: { label: 'General', icon: '⚙️' },
};

function HelpLegendPanel() {
  const { showLegend, setShowLegend, setEnabled, activeItem } = useHelp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpItem['category'] | 'all'>('all');

  const filteredItems = useMemo(() => {
    let items = HELP_GLOSSARY;
    
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.term.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }
    
    return items;
  }, [selectedCategory, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, HelpItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  if (!showLegend) return null;

  return createPortal(
    <div className="fixed inset-y-0 right-0 z-[99998] flex flex-col w-80 border-l border-slate-700 bg-slate-900/98 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">💡 Glossari d'Ajuda</h2>
          <p className="text-[11px] text-slate-400">Passa el ratolí pels camps per veure ajuda</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowLegend(false);
            setEnabled(false);
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-slate-700/50 p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cercar terme..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1 border-b border-slate-700/50 p-3">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Tot
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedCategory(key as HelpItem['category'])}
            className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {CATEGORY_LABELS[category as HelpItem['category']]?.icon}{' '}
              {CATEGORY_LABELS[category as HelpItem['category']]?.label}
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-2.5 transition-colors ${
                    activeItem?.id === item.id
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-200">{item.term}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.description}</p>
                  {item.example && (
                    <p className="mt-1.5 rounded bg-slate-900/50 px-2 py-1 text-[10px] text-slate-500">
                      💡 {item.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No s'han trobat termes
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 p-3">
        <p className="text-[10px] text-slate-500 text-center">
          Prem Esc o el botó ✕ per tancar
        </p>
      </div>
    </div>,
    document.body
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD LABEL AMB AJUDA INTEGRADA
// Component per usar en formularis
// ═══════════════════════════════════════════════════════════════════════════

type FieldLabelProps = {
  htmlFor?: string;
  helpId?: string;
  required?: boolean;
  children: ReactNode;
};

export function FieldLabel({ htmlFor, helpId, required, children }: FieldLabelProps) {
  if (helpId) {
    return (
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-300">
        <HelpTooltip id={helpId} inline>
          {children}
          {required && <span className="ml-1 text-rose-400">*</span>}
        </HelpTooltip>
      </label>
    );
  }

  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-300">
      {children}
      {required && <span className="ml-1 text-rose-400">*</span>}
    </label>
  );
}
