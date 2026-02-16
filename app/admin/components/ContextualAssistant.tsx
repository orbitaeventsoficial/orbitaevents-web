'use client';

/**
 * ADMIN CONTEXTUAL ASSISTANT
 * ==========================
 * Assistent intel·ligent que detecta la pàgina actual
 * i mostra consells contextuals per millorar el flux de treball.
 */

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// CONSELLS PER PÀGINA
// ═══════════════════════════════════════════════════════════════════════════

type Tip = {
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon: string;
};

type PageContext = {
  title: string;
  tips: Tip[];
  shortcuts: { keys: string[]; description: string }[];
};

const PAGE_CONTEXTS: Record<string, PageContext> = {
  '/admin/leads': {
    title: 'Entrades',
    tips: [
      {
        icon: '⚡',
        title: 'Respon ràpid',
        description: 'Les entrades contactades en <2h tenen un 80% més de probabilitat de tancar.',
        action: { label: 'Veure pendents', href: '/admin/leads?status=NEW' },
      },
      {
        icon: '🎯',
        title: 'Prioritza bé',
        description: 'Marca com URGENT les entrades amb data d\'esdeveniment propera (<30 dies).',
      },
      {
        icon: '📞',
        title: 'WhatsApp primer',
        description: 'El 73% dels clients prefereixen WhatsApp sobre email per primer contacte.',
      },
    ],
    shortcuts: [
      { keys: ['N'], description: 'Nova entrada' },
      { keys: ['F'], description: 'Filtrar' },
      { keys: ['⌘', 'K'], description: 'Cerca global' },
    ],
  },
  '/admin/leads/[id]': {
    title: 'Fitxa d\'entrada',
    tips: [
      {
        icon: '📝',
        title: 'Afegeix notes',
        description: 'Cada interacció hauria de quedar documentada per no perdre context.',
      },
      {
        icon: '📄',
        title: 'Envia pressupost',
        description: 'Si l\'entrada és qualificada, envia pressupost en <24h.',
        action: { label: 'Crear pressupost', href: '/admin/presupuestos' },
      },
      {
        icon: '✅',
        title: 'Crea tasques',
        description: 'Programa un seguiment si no hi ha resposta en 48h.',
      },
    ],
    shortcuts: [
      { keys: ['E'], description: 'Editar' },
      { keys: ['P'], description: 'Pressupost' },
      { keys: ['T'], description: 'Nova tasca' },
    ],
  },
  '/admin/clientes': {
    title: 'Clients',
    tips: [
      {
        icon: '⭐',
        title: 'Demana ressenyes',
        description: 'Després de cada esdeveniment, envia sol·licitud de ressenya a Google.',
        action: { label: 'Sol·licitar ressenyes', href: '/admin/post-event' },
      },
      {
        icon: '🔄',
        title: 'Clients recurrents',
        description: 'El 30% dels clients repeteixen. Fes seguiment anual!',
      },
    ],
    shortcuts: [
      { keys: ['N'], description: 'Nou client' },
      { keys: ['⌘', 'K'], description: 'Cerca client' },
    ],
  },
  '/admin/bookings': {
    title: 'Reserves',
    tips: [
      {
        icon: '💰',
        title: 'Cobra senyals',
        description: 'No confirmar sense el 30% de senyal. Protegeix el teu temps!',
      },
      {
        icon: '📋',
        title: 'Prepara amb temps',
        description: 'Revisa els detalls de cada reserva 1 setmana abans.',
      },
      {
        icon: '📧',
        title: 'Confirmació automàtica',
        description: 'El sistema envia recordatoris 7 i 1 dies abans.',
      },
    ],
    shortcuts: [
      { keys: ['C'], description: 'Calendari' },
      { keys: ['N'], description: 'Nova reserva' },
    ],
  },
  '/admin/presupuestos': {
    title: 'Pressupostos',
    tips: [
      {
        icon: '⏱️',
        title: 'Validesa curta',
        description: 'Pressupostos amb 7 dies de validesa tanquen 40% més que els de 30 dies.',
      },
      {
        icon: '💎',
        title: 'Mostra valor',
        description: 'Inclou sempre fotos i vídeos d\'esdeveniments anteriors.',
      },
      {
        icon: '📊',
        title: 'Revisa marges',
        description: 'Assegura\'t de mantenir mínim 35% de marge net.',
        action: { label: 'Veure marges', href: '/admin/rentabilidad' },
      },
    ],
    shortcuts: [
      { keys: ['P'], description: 'Vista prèvia PDF' },
      { keys: ['E'], description: 'Enviar per email' },
    ],
  },
  '/admin/tasks': {
    title: 'Tasques',
    tips: [
      {
        icon: '📅',
        title: 'Revisa cada matí',
        description: 'Dedica 5 minuts a revisar les tasques del dia.',
      },
      {
        icon: '⏰',
        title: 'Data límit',
        description: 'Les tasques sense data límit tenen menys probabilitat de completar-se.',
      },
    ],
    shortcuts: [
      { keys: ['N'], description: 'Nova tasca' },
      { keys: ['D'], description: 'Marcar feta' },
    ],
  },
  '/admin/analytics': {
    title: 'Analítica',
    tips: [
      {
        icon: '📈',
        title: 'Conversió sana',
        description: 'Una taxa de conversió del 20-30% és excel·lent per al sector.',
      },
      {
        icon: '💸',
        title: 'CAC sota control',
        description: 'El cost d\'adquisició no hauria de superar el 15% del valor mitjà de reserva.',
      },
    ],
    shortcuts: [],
  },
  '/admin': {
    title: 'Dashboard',
    tips: [
      {
        icon: '🎯',
        title: 'Focus diari',
        description: 'Comença pel que té més impacte: entrades noves i seguiments pendents.',
        action: { label: 'Veure entrades noves', href: '/admin/leads?status=NEW' },
      },
      {
        icon: '📊',
        title: 'Revisa mètriques',
        description: 'Consulta l\'analítica setmanalment per detectar tendències.',
        action: { label: 'Anar a analítica', href: '/admin/analytics' },
      },
    ],
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Cerca global' },
      { keys: ['?'], description: 'Ajuda' },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export function ContextualAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Obtenir context de la pàgina actual
  const context = useMemo(() => {
    if (!pathname) return null;
    
    // Match exacte o pattern amb [id]
    for (const [pattern, ctx] of Object.entries(PAGE_CONTEXTS)) {
      if (pathname === pattern) return ctx;
      
      // Check for dynamic routes
      const regexPattern = pattern.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(pathname)) return ctx;
    }

    // Fallback to dashboard if no match
    return PAGE_CONTEXTS['/admin'];
  }, [pathname]);

  // Carregar dismissed tips del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin.dismissed.tips');
    if (saved) {
      try {
        setDismissed(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const dismissTip = (tipTitle: string) => {
    const newDismissed = [...dismissed, tipTitle];
    setDismissed(newDismissed);
    localStorage.setItem('admin.dismissed.tips', JSON.stringify(newDismissed));
  };

  const visibleTips = context?.tips.filter((tip) => !dismissed.includes(tip.title)) || [];

  if (!context || visibleTips.length === 0) return null;

  return (
    <>
      {/* Botó flotant */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full
          shadow-lg transition-all
          ${isOpen 
            ? 'bg-amber-500 text-white rotate-45' 
            : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
          }
        `}
      >
        {isOpen ? '✕' : '💡'}
      </button>

      {/* Panel de consells */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/98 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="sticky top-0 border-b border-slate-700/50 bg-slate-900 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-200">
              💡 Consells: {context.title}
            </h3>
            <p className="text-[11px] text-slate-500">
              Recomanacions per aquesta secció
            </p>
          </div>

          {/* Tips */}
          <div className="p-3 space-y-2">
            {visibleTips.map((tip, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{tip.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{tip.description}</p>
                    
                    {tip.action && (
                      <a
                        href={tip.action.href}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300"
                      >
                        {tip.action.label} →
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissTip(tip.title)}
                    className="text-slate-500 hover:text-slate-300"
                    title="No mostrar més"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Shortcuts */}
          {context.shortcuts.length > 0 && (
            <div className="border-t border-slate-700/50 px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Dreceres de teclat
              </p>
              <div className="space-y-1.5">
                {context.shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, j) => (
                        <kbd
                          key={j}
                          className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-700/50 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('admin.dismissed.tips');
                setDismissed([]);
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Restaurar tots els consells
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING CHECKLIST (per nous usuaris)
// ═══════════════════════════════════════════════════════════════════════════

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  completed?: boolean;
};

const ONBOARDING_CHECKLIST: ChecklistItem[] = [
  {
    id: 'profile',
    title: 'Configura el teu perfil',
    description: 'Afegeix el logo i les dades de l\'empresa',
    href: '/admin/settings',
  },
  {
    id: 'packs',
    title: 'Crea els teus packs',
    description: 'Defineix els serveis que ofereixes',
    href: '/admin/packs',
  },
  {
    id: 'email',
    title: 'Connecta el correu',
    description: 'Configura IMAP per rebre consultes',
    href: '/admin/settings/integrations',
  },
  {
    id: 'first-lead',
    title: 'Registra la primera entrada',
    description: 'Afegeix un contacte manualment o espera una consulta',
    href: '/admin/leads',
  },
  {
    id: 'first-quote',
    title: 'Envia el primer pressupost',
    description: 'Crea i envia un pressupost professional',
    href: '/admin/presupuestos',
  },
];

export function OnboardingChecklist() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin.onboarding.completed');
    const wasDismissed = localStorage.getItem('admin.onboarding.dismissed');
    
    if (saved) {
      try {
        setCompleted(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const markComplete = (id: string) => {
    const newCompleted = [...completed, id];
    setCompleted(newCompleted);
    localStorage.setItem('admin.onboarding.completed', JSON.stringify(newCompleted));
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('admin.onboarding.dismissed', 'true');
  };

  const pendingItems = ONBOARDING_CHECKLIST.filter((item) => !completed.includes(item.id));
  const progress = Math.round((completed.length / ONBOARDING_CHECKLIST.length) * 100);

  if (dismissed || pendingItems.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-amber-200">
            🚀 Comença amb Òrbita Admin
          </h3>
          <p className="mt-1 text-xs text-amber-200/60">
            {progress}% completat · {pendingItems.length} passos pendents
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-amber-200/50 hover:text-amber-200"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 rounded-full bg-amber-950/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Next item */}
      {pendingItems[0] && (
        <div className="mt-4 flex items-center gap-3">
          <a
            href={pendingItems[0].href}
            onClick={() => markComplete(pendingItems[0].id)}
            className="flex-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 transition-all hover:bg-amber-500/20"
          >
            <p className="text-sm font-medium text-amber-100">
              {pendingItems[0].title}
            </p>
            <p className="mt-0.5 text-xs text-amber-200/60">
              {pendingItems[0].description}
            </p>
          </a>
          <button
            type="button"
            onClick={() => markComplete(pendingItems[0].id)}
            className="rounded-lg border border-amber-500/30 bg-amber-500/20 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-500/30"
          >
            Fet ✓
          </button>
        </div>
      )}
    </div>
  );
}
