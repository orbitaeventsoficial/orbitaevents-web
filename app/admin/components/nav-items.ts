type BadgeColor = 'orange' | 'blue' | 'green' | 'red';

export interface NavItem {
  icon: string;
  label: string;
  href: string;
  description?: string;
  badge?: string;
  badgeColor?: BadgeColor;
}

export interface NavSection {
  title: string;
  defaultOpen: boolean;
  items: NavItem[];
}

export function getPriorityItems(newLeadsCount: number): NavItem[] {
  return [
    { icon: '📥', label: 'Entrades', href: '/admin/leads', description: "Revisa noves consultes, prioritza-les i converteix-les en clients o reserves.", badge: newLeadsCount > 0 ? String(newLeadsCount) : undefined, badgeColor: 'orange' },
    { icon: '👤', label: 'Clients', href: '/admin/clientes', description: "Consulta l'historial complet de cada client, reserves, pressupostos i comunicacions." },
    { icon: '📋', label: 'Reserves', href: '/admin/bookings', description: "Gestiona l'execució dels esdeveniments, cobraments, marges i estat operatiu." },
    { icon: '📝', label: 'Tasques', href: '/admin/tasks', description: 'Organitza la feina pendent del dia i no deixis passos crítics sense seguir.' },
    { icon: '📅', label: 'Calendari', href: '/admin/calendario', description: 'Visualitza la càrrega real de feina per dies, setmanes i mesos.' },
  ];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operacions',
    defaultOpen: true,
    items: [
      { icon: '📄', label: 'Pressupostos', href: '/admin/presupuestos', description: 'Crea, edita i envia propostes comercials abans de convertir-les en reserva.' },
      { icon: '🧮', label: 'Calculadora costos', href: '/admin/cost-calculator', description: 'Simula costos, marges i preus abans de prendre decisions comercials.' },
      { icon: '💶', label: 'Finances', href: '/admin/economia', description: 'Controla cobraments, rendibilitat, tresoreria i salut econòmica del negoci.' },
      { icon: '🩺', label: 'Salut', href: '/admin/salut', description: 'Detecta incidències crítiques, avisos i punts de risc operatiu abans que escalin.' },
      { icon: '🤝', label: "Col·laboradors", href: '/admin/collaborators', description: 'Gestiona equip extern, disponibilitat, tarifes i relació amb col·laboradors.' },
      { icon: '📥', label: 'Safata (IMAP)', href: '/admin/inbox', description: 'Llegeix, classifica i respon correus entrants des del panell.', badge: 'IMAP', badgeColor: 'blue' },
      { icon: '📊', label: 'Sales Ops', href: '/admin/sales-ops', description: 'Executa seqüències comercials, SLA i automatismes de seguiment.' },
      { icon: '💤', label: 'Reactivació', href: '/admin/clientes/reactivation', description: "Clients dormants, en risc o d'alt valor amb missatge suggerit per contactar-los." },
      { icon: '🔥', label: 'Reengagement leads', href: '/admin/leads/reengagement', description: 'Leads dormants, pressupostos sense resposta i negociacions refredades.' },
      { icon: '🎁', label: 'Referrals', href: '/admin/clientes/referrals', description: 'Top referrers, valor generat i candidats per preguntar.' },
      { icon: '📣', label: 'Campanyes', href: '/admin/campaigns', description: 'Comunicacions massives suggerides per segment CRM (dormants, upsell, temporada).' },
      { icon: '📊', label: 'Capacitat', href: '/admin/calendario/capacity', description: 'Visió global de càrrega operativa per dia amb col·lisions i disponibilitat.' },
      { icon: '🗓️', label: 'Cuadrant', href: '/admin/cuadrant', description: 'Qui treballa cada bolo, hores ocupades, solapaments i repartiment de pasta.' },
      { icon: '⚡', label: 'Entrada ràpida', href: '/admin/intake', description: 'Crea una nova entrada ràpidament quan reps una consulta fora del flux habitual.' },
    ],
  },
  {
    title: 'Producte',
    defaultOpen: false,
    items: [
      { icon: '🎵', label: 'Packs', href: '/admin/packs', description: 'Defineix què vens, el contingut dels packs i com es presenten comercialment.' },
      { icon: '📦', label: 'Inventari', href: '/admin/inventory', description: 'Controla equip tècnic, estat, manteniment i disponibilitat per reserva.' },
      { icon: '💰', label: 'Preus', href: '/admin/pricing', description: 'Ajusta criteris i referències de pricing per mantenir marge i coherència.' },
      { icon: '🎟️', label: 'Descomptes', href: '/admin/discount-codes', description: 'Gestiona codis promocionals i valida el seu impacte comercial.' },
      { icon: '📋', label: 'Catàleg', href: '/admin/catalog', description: "Consulta i estructura l'oferta global que connecta packs, inventari i preus." },
      { icon: '📝', label: 'Qüestionaris', href: '/admin/questionnaires', description: 'Crea i gestiona qüestionaris pre-event que els clients omplen al portal.' },
    ],
  },
  {
    title: 'Contingut',
    defaultOpen: false,
    items: [
      { icon: '📰', label: 'Blog', href: '/admin/blog', description: 'Publica i mantén contingut editorial per captar trànsit i confiança.' },
      { icon: '✅', label: 'Ressenyes', href: '/admin/ressenyes', description: 'Revisa testimonis interns i controla què es mostra al web.' },
      { icon: '⭐', label: 'Ressenyes Google', href: '/admin/google-reviews', description: 'Supervisa la prova social externa i la reputació pública de la marca.' },
      { icon: '🤖', label: 'Correus', href: '/admin/emails', description: 'Controla automatismes, enviaments i seguiment de comunicacions.', badge: 'AUTO', badgeColor: 'green' },
      { icon: '✉️', label: 'Plantilles email', href: '/admin/email-templates', description: "Edita els missatges base perquè l'operativa i la comunicació siguin coherents." },
      { icon: '🖼️', label: 'Portfolio', href: '/admin/portfolio', description: "Mantén l'aparador visual de la marca i els casos que ajuden a vendre." },
      { icon: '📱', label: 'Social', href: '/admin/social', description: 'Planifica, programa i publica contingut a xarxes socials.' },
    ],
  },
  {
    title: 'Avançat',
    defaultOpen: false,
    items: [
      { icon: '📝', label: 'Post-esdeveniment', href: '/admin/post-event', description: 'Tanca el cicle després de cada bolo amb informes, feedback i correus finals.' },
      { icon: '📈', label: 'Analítica', href: '/admin/analytics', description: 'Llegeix patrons de negoci i trànsit per decidir millor on actuar.' },
      { icon: '📊', label: 'Reporting Executiu', href: '/admin/reporting', description: 'Facturació, marge, conversió per origen, recurrència i tendència mensual.' },
      { icon: '❓', label: 'FAQ', href: '/admin/faq', description: 'Edita respostes freqüents per reduir dubtes i càrrega comercial repetitiva.' },
      { icon: '✏️', label: 'Textos', href: '/admin/text-manager', description: 'Centralitza i mantén els textos reutilitzables del projecte.' },
      { icon: '🖼️', label: 'Imatges', href: '/admin/image-manager', description: 'Govern central de placements visuals i overrides manuals compartits.' },
      { icon: '🔒', label: 'Privacitat RGPD', href: '/admin/privacy', description: 'Controla consentiments i traçabilitat legal de dades i comunicacions.' },
    ],
  },
  {
    title: 'Configuració',
    defaultOpen: false,
    items: [
      { icon: '📖', label: 'Manual', href: '/admin/manual', description: 'Guia de possibilitats per entendre què pot fer tota la maquinària i on actuar.' },
      { icon: '🗺️', label: 'Atles organisme', href: '/admin/docs/organisme', description: 'Mapa viu del sistema sencer (front + back): òrgans, connexions i estudi de dinamització.' },
      { icon: '🎯', label: 'Meta + Full de ruta', href: '/admin/docs/full-de-ruta', description: 'La idealització del producte (zenit) i el camí per fases per arribar-hi.' },
      { icon: '⚙️', label: 'General', href: '/admin/settings', description: "Ajusta la configuració base del sistema i del comportament global de l'admin." },
      { icon: '📊', label: 'Estadístiques web', href: '/admin/stats', description: 'Segueix mètriques públiques del web sense entrar a eines externes.' },
      { icon: '🗺️', label: 'Cobertura', href: '/admin/coverage', description: "Defineix on opera l'empresa i com es trasllada això a filtres i vendes." },
      { icon: '🎛️', label: 'Features', href: '/admin/features', description: 'Activa o desactiva funcionalitats per controlar desplegaments amb seguretat.' },
      { icon: '📡', label: 'Activitat', href: '/admin/activity', description: "Audita accions recents de sistema i d'administració." },
      { icon: '🔄', label: 'Crons', href: '/admin/crons', description: "Revisa automatismes programats i comprova si s'executen correctament." },
      { icon: '🎨', label: 'Tema admin', href: '/admin/css-manager', description: "Ajusta l'aspecte visual del panell d'administració." },
      { icon: '🛠️', label: 'Scripts i eines', href: '/admin/scripts', description: 'Executa eines internes i operacions de suport quan calgui.' },
    ],
  },
];
