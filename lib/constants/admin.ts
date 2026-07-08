import { getAllPacks } from '@/app/config/packs-config';
import { SITE_CONFIG } from '@/app/config/site-config';

export const ADMIN_SHORTCUT_ROUTES: Record<string, string> = {
  '1': '/admin/leads',
  '2': '/admin/clientes',
  '3': '/admin/tasks',
  '4': '/admin/bookings',
  m: '/admin/inbox',
};

export const ADMIN_KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const;

export const ADMIN_PAGE_LABELS: Record<string, string> = {
  leads: 'Entrades',
  marketing: 'Màrqueting',
  bookings: 'Reserves',
  tasks: 'Tasques',
  packs: 'Packs',
  analytics: 'Analítica',
  'sales-ops': 'Operativa de vendes',
  catalog: 'Catàleg',
  emails: 'Correus automàtics',
  inbox: 'Safata (IMAP)',
  calendario: 'Calendari',
  settings: 'Configuració',
  studio: 'Studio',
  integrations: 'Integracions',
  quotes: 'Plantilla pressupostos',
  inventory: 'Inventari',
  clientes: 'Clients',
  mensajes: 'Missatges',
  ressenyes: 'Ressenyes',
  faq: 'PMF',
  pricing: 'Preus',
  salut: 'Salut',
  presupuestos: 'Editor PDF pressupost',
  coverage: 'Cobertura',
  features: 'Features',
  stats: 'Estadístiques',
  blog: 'Blog',
  'text-manager': 'Textos PRO',
  'css-manager': 'CSS PRO',
  'post-event': 'Post-esdeveniment',
  'google-reviews': 'Ressenyes de Google',
  portfolio: 'Portfolio',
  'image-manager': 'Gestor d\'imatges',
};

export const ADMIN_CHANGE_COUNTER = 1747;

export const ADMIN_BOOKING_DEPOSIT_DUE_DAYS = 30;
export const ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS = 7;

/**
 * Màximes d'Economia (#1390): brúixola de gestió sempre visible al top del dashboard i
 * d'Economia (ticker rotatiu). Recorden la doctrina del propietari: el transport és cost,
 * no negoci; el marge viu al producte propi; el temps (dissabtes) és el recurs escàs.
 * Font única — es canvien AQUÍ, no al JSX.
 */
export const ADMIN_ECONOMY_MAXIMS = [
  'El marge és el que fas, no el que condueixes.',
  'Tens 50 dissabtes l’any: gasta’ls en el que et fa ric.',
  'Ven el teu talent, no els teus quilòmetres.',
  'Lluny, només amb producte teu.',
  'El transport no és negoci: és cost. El marge viu al producte.',
  'Cap taxista s’ha fet ric fent carreres llargues barates.',
  'El pitjor client és el que et té ocupat sense marge.',
  'Un «no» a un mal bolo és un èxit, no un fracàs.',
  'Els euros es recuperen; els dissabtes, no.',
  'Cada quilòmetre et fa xofer; cada bolo teu et fa empresari.',
  'Si el pressupost honest espanta, el bolo no era teu.',
  'Facturar és vanitat; el marge, seny; el temps, el rei.',
  'Ocupat no és el mateix que rendible.',
  'Cada «sí» a un mal bolo és un «no» a un de bo.',
  'Competeix en el que ningú més sap fer, no en preu.',
  'El descompte d’avui el pagues tota la temporada.',
  'Un preu sense marge és una feina que et fa pobre.',
  'Coneix el teu cost, o el client el decidirà per tu.',
  'Cobra pel valor, no per les hores.',
  'Créixer en vendes perdent marge és córrer cap enrere.',
  'El teu preu diu què vals: no en demanis perdó.',
  'La feina barata sempre surt cara.',
  'El marge és oxigen; el volum sol, asfíxia.',
  'Primer els números, després l’emoció.',
  'No hi ha clients dolents: hi ha preus mal posats.',
  'La caixa és la reina; cobra abans, paga després.',
] as const;

export const ADMIN_DOSSIER_GENERATOR_COPY = {
  page: {
    kicker: 'Dossier directe',
    title: 'Configuració del bolo',
    description: 'Lead o client, serveis i enviament.',
    railCustomer: 'Lead/client',
    railCatalog: 'serveis',
    railSaved: 'dossiers',
  },
  draftSuggestions: {
    title: 'Dossiers a preparar',
    description: 'Leads oberts sense dossier actiu. Obre el generador preomplert; no envia res.',
    rail: 'cua segura',
    prepareAction: 'Preparar dossier',
    createDraftAction: 'Crear esborrany',
    draftBadge: 'Esborrany',
    leadAction: 'Obrir lead',
    scoreLabel: 'Prioritat',
    serviceLinesLabel: 'línies de bolo',
    eventNoDate: 'Sense data',
    eventToday: 'Avui',
    eventTomorrow: 'Demà',
    eventInDays: 'dies',
  },
  client: {
    title: 'Dades del client',
    hint: 'Tria un lead, un client existent o omple les dades abans de crear el flux CRM.',
    leadSearchLabel: 'Cerca lead existent',
    customerSearchLabel: 'Cerca client existent',
    linkedLeadLabel: 'Lead vinculat',
    linkedCustomerLabel: 'Client vinculat',
    changeLeadAction: 'Canviar lead',
    changeCustomerAction: 'Canviar client',
    intakeTitle: 'Text rebut',
    intakeHint: 'Enganxa un WhatsApp, email o nota comercial i omplo els camps abans de crear res.',
    intakeLabel: 'WhatsApp / email / nota',
    intakePlaceholder: 'Ex: Hola, soc la Cristina. Necessitem DJ el 11/07/2026 de 18:00 a 20:00 a Arenys de Munt per 150 persones. Tel...',
    intakeAction: 'Extreure dades',
    intakeWorking: 'Extraient...',
    intakeEmpty: 'Enganxa primer el text rebut.',
    intakeSuccess: 'Dades extretes. Revisa-les abans de crear el dossier.',
    intakeFallbackQuota: 'Extracció local parcial: quota IA limitada ara mateix.',
    intakeFallbackUnavailable: 'Extracció local parcial: IA no disponible.',
    eventSummaryLabel: 'Resum del bolo',
    eventSummaryPlaceholder: '2026-07-11 · 18:00-20:00 · Arenys de Munt · 150 pax',
    introLabel: 'Missatge d’obertura',
    introHint: 'opcional',
    introPlaceholder: 'Gràcies per contactar amb nosaltres...',
  },
  conflict: {
    kicker: 'Possible client existent',
    body: 'No es crearà cap client nou ni cap lead nou fins que triïs què s’ha de fer.',
    noContact: 'Client sense contacte principal',
    linkAction: 'Vincular aquest client',
    reviewAction: 'Revisar coincidència',
    toast: 'Aquest client ja existeix. Tria què vols fer abans de crear el dossier.',
  },
  bolo: {
    title: 'El bolo',
    hint: 'Serveis contractats i imports orientatius abans de crear el dossier.',
    totalLabel: 'Total bolo',
    empty: 'Cap servei seleccionat.',
    marginTitle: 'Marge abans d’enviar',
    marginHint: 'Estimació interna amb serveis, cost de partner, CAC i desplaçament.',
    revenueLabel: 'Ingressos',
    directCostLabel: 'Cost + CAC',
    netMarginLabel: 'Marge net',
    subcontractedLabel: 'Markup partner',
  },
  catalog: {
    title: 'Catàleg disponible',
    hint: 'Tria només els serveis que formaran part del dossier final.',
    serviceCountLabel: 'serveis',
    audiences: {
      infantil: {
        title: 'Infantils',
        subtitle: 'Casals, escoles, festes familiars i propostes per a mainada.',
        empty: 'Cap servei infantil actiu.',
      },
      adult: {
        title: 'Adults i general',
        subtitle: 'Bingo, batalla, DJ, material i serveis transversals.',
        empty: 'Cap servei adult o general actiu.',
      },
    },
    groups: {
      orbita: {
        title: 'Serveis d’Òrbita',
        subtitle: 'Serveis propis i formats comercials base.',
      },
      masquerade: {
        title: 'Serveis de Masquerade',
        subtitle: 'Animació, personatges i extres presencials de Masquerade.',
      },
      tino: {
        title: 'Serveis lloguer Tino',
        subtitle: 'Material de lloguer gestionat per Òrbita.',
      },
      altres: {
        title: 'Altres proveïdors',
        subtitle: 'Productes d’altres col·laboradors homologats.',
      },
    },
  },
  actions: {
    createCrmFlow: 'Crear lead i client en desar',
    createLeadForCustomer: 'Crear lead vinculat al client',
    sendOnSave: 'Enviar per email en desar',
  },
} as const;

export const ADMIN_DETAIL_PAGE_LABELS: Record<string, string> = {
  inventory: 'Fitxa inventari',
  bookings: 'Fitxa reserva',
  leads: 'Fitxa entrada',
  clientes: 'Fitxa client',
  packs: 'Fitxa pack',
};

export const BOOKING_ACTIVITY_ACTION_LABELS: Record<string, { icon: string; label: string }> = {
  CREATE: { icon: '🆕', label: 'Reserva creada' },
  UPDATE: { icon: '✏️', label: 'Reserva actualitzada' },
  DELETE: { icon: '🗑️', label: 'Reserva eliminada' },
  STATUS_CHANGE: { icon: '🔄', label: 'Canvi d\'estat' },
  COMM_SENT: { icon: '📤', label: 'Comunicació enviada' },
  COMM_RESPONDED: { icon: '📥', label: 'Resposta rebuda' },
  PAYMENT_RECORDED: { icon: '💰', label: 'Pagament registrat' },
  INVENTORY_ASSIGNED: { icon: '📦', label: 'Inventari assignat' },
  CALENDAR_SYNC: { icon: '📅', label: 'Sincronitzat calendari' },
  PORTAL_ACCESS: { icon: '🔗', label: 'Accés portal' },
  CONTRACT_SIGNED: { icon: '✍️', label: 'Contracte signat' },
  INVOICE_CREATED: { icon: '🧾', label: 'Factura creada' },
};


export const ADMIN_ACTIVITY_ACTION_META: Record<string, { label: string; icon: string; tone: string }> = {
  COMM_SENT: { label: 'Email enviat', icon: '📤', tone: 'admin-tone-text-info' },
  COMM_RESPONDED: { label: 'Resposta rebuda', icon: '📩', tone: 'admin-tone-text-success' },
  COMM_SEQUENCE_EXEC: { label: 'Sequencia comercial', icon: '🔗', tone: 'admin-tone-text-info' },
  COMM_SEQUENCE_BATCH: { label: 'Batch sequencies', icon: '📦', tone: 'admin-tone-text-info' },
  SEND_POST_EVENT_EMAIL: { label: 'Email post-event', icon: '🎉', tone: 'admin-tone-text-violet' },
  PAYMENT_REMINDER_SENT: { label: 'Recordatori pagament', icon: '💰', tone: 'admin-tone-text-warning' },
  PAYMENT_RECORDED: { label: 'Pagament registrat', icon: '💰', tone: 'admin-tone-text-success' },
  AUTOMATION_DAILY_SUMMARY_SENT: { label: 'Resum diari', icon: '📋', tone: 'admin-tone-text-info' },
  AUTOMATION_SLA_ENFORCED: { label: 'SLA aplicat', icon: '⏱️', tone: 'admin-tone-text-danger' },
  AUTOMATION_RUN_ALL: { label: 'Automatitzacio completa', icon: '🤖', tone: 'admin-tone-text-info' },
  AUTOMATION_FUEL_REFRESH: { label: 'Preu combustible', icon: '⛽', tone: 'admin-tone-text-warning' },
  PACK_PRICING_CHECK: { label: 'Check preus packs', icon: '💶', tone: 'admin-tone-text-success' },
  AUTOFIX_OK: { label: 'Autofix OK', icon: '✅', tone: 'admin-tone-text-success' },
  AUTOFIX_FAILED: { label: 'Autofix fallat', icon: '⚠️', tone: 'admin-tone-text-warning' },
  AUTOFIX_CRASH: { label: 'Autofix crash', icon: '💥', tone: 'admin-tone-text-danger' },
  CALENDAR_SYNC: { label: 'Sync calendari', icon: '📅', tone: 'admin-tone-text-info' },
  CALENDAR_SYNC_ERROR: { label: 'Error sync calendari', icon: '❌', tone: 'admin-tone-text-danger' },
  PORTAL_AUTO_CREATED: { label: 'Portal client creat', icon: '🔑', tone: 'admin-tone-text-violet' },
  DOCUMENT_PROPOSAL_SENT: { label: 'Pressupost enviat', icon: '📄', tone: 'admin-tone-text-info' },
  DOCUMENT_DOSSIER_SENT: { label: 'Dossier enviat', icon: '📤', tone: 'admin-tone-text-info' },
  DOCUMENT_DOSSIER_COMPOSITE_PDF_GENERATED: { label: 'PDF dossier generat', icon: '📎', tone: 'admin-tone-text-info' },
  DOCUMENT_CONTRACT_GENERATED: { label: 'Contracte generat', icon: '📝', tone: 'admin-tone-text-info' },
  DOCUMENT_CONTRACT_SENT: { label: 'Contracte enviat', icon: '📤', tone: 'admin-tone-text-info' },
  DOCUMENT_CONTRACT_SIGNED: { label: 'Contracte signat', icon: '✍️', tone: 'admin-tone-text-success' },
  DOCUMENT_CONTRACT_CANCELLED: { label: 'Contracte cancel·lat', icon: '⛔', tone: 'admin-tone-text-warning' },
  DOCUMENT_CONTRACT_SIGNED_PDF_GENERATED: { label: 'PDF signat generat', icon: '📎', tone: 'admin-tone-text-success' },
  CREATE: { label: 'Creat', icon: '➕', tone: 'admin-tone-text-success' },
  UPDATE: { label: 'Actualitzat', icon: '✏️', tone: 'admin-tone-text-info' },
  DELETE: { label: 'Eliminat', icon: '🗑️', tone: 'admin-tone-text-danger' },
};


export const CUSTOMER_TIMELINE_FILTER_OPTIONS = [
  { key: 'all', label: 'Tot', icon: '📋' },
  { key: 'documents', label: 'Documents', icon: '📎' },
  { key: 'proposals', label: 'Pressupostos', icon: '📄' },
  { key: 'bookings', label: 'Reserves', icon: '📅' },
  { key: 'tasks', label: 'Tasques', icon: '✅' },
  { key: 'comms', label: 'Comunicacions', icon: '💬' },
] as const;

export const CUSTOMER_TIMELINE_EVENT_META: Record<string, { filter: 'proposals' | 'bookings' | 'tasks' | 'comms'; icon: string; toneClass: string }> = {
  PROPOSAL_CREATED: { filter: 'proposals', icon: '📄', toneClass: 'border-l-[var(--o-info)]' },
  PROPOSAL_SENT: { filter: 'proposals', icon: '📤', toneClass: 'border-l-[var(--o-info)]' },
  PROPOSAL_ACCEPTED: { filter: 'proposals', icon: '✅', toneClass: 'border-l-[var(--o-success)]' },
  BOOKING_CREATED: { filter: 'bookings', icon: '📅', toneClass: 'border-l-[var(--ax-vip)]' },
  BOOKING_CONFIRMED: { filter: 'bookings', icon: '🎉', toneClass: 'border-l-[var(--o-success)]' },
  TASK_CREATED: { filter: 'tasks', icon: '📝', toneClass: 'border-l-[var(--o-warning)]' },
  TASK_DONE: { filter: 'tasks', icon: '✓', toneClass: 'border-l-[var(--o-success)]' },
  MESSAGE_SENT: { filter: 'comms', icon: '✉️', toneClass: 'border-l-[var(--ax-vip)]' },
  EMAIL_RECEIVED: { filter: 'comms', icon: '📩', toneClass: 'border-l-[var(--ax-vip)]' },
  WHATSAPP_SENT: { filter: 'comms', icon: '💬', toneClass: 'border-l-[var(--ax-vip)]' },
  PHONE_CALL: { filter: 'comms', icon: '📞', toneClass: 'border-l-[var(--ax-vip)]' },
  NOTE_ADDED: { filter: 'comms', icon: '📌', toneClass: 'border-l-[var(--o-admin-line-2)]' },
  ACTIVITY: { filter: 'comms', icon: '•', toneClass: 'border-l-[var(--o-admin-line)]' },
};


export const ADMIN_FAB_ITEMS = [
  { icon: '👥', label: 'Entrada rapida', href: '/admin/leads' },
  { icon: '📋', label: 'Reserva', href: '/admin/bookings/new' },
  { icon: '📝', label: 'Tasca', href: '/admin/tasks/new' },
  { icon: '📄', label: 'Pressupost', href: '/admin/presupuestos' },
] as const;

export const ADMIN_MOBILE_PRIMARY_NAV = [
  { icon: '📥', label: 'Entrades', href: '/admin/leads', badgeKey: 'newLeads' },
  { icon: '👤', label: 'Clients', href: '/admin/clientes' },
  { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
  { icon: '📝', label: 'Tasques', href: '/admin/tasks' },
] as const;


export const ADMIN_SCRIPT_CATEGORY_INFO = {
  seed: { label: 'Dades inicials', icon: '🌱', tone: 'ap-kpi--success' },
  sync: { label: 'Sincronització', icon: '🔄', tone: 'ap-kpi--info' },
  check: { label: 'Verificació', icon: '🔍', tone: 'admin-tone-border-info admin-tone-bg-info' },
  report: { label: 'Informes', icon: '📊', tone: 'admin-tone-border-violet admin-tone-bg-violet' },
  fix: { label: 'Correcció', icon: '🔧', tone: 'ap-kpi--warning' },
  audit: { label: 'Auditoria', icon: '🛡️', tone: 'ap-kpi--danger' },
} as const;


export const ADMIN_EMAIL_TEMPLATE_SOURCE_BADGE = {
  db: { label: 'Personalitzat', className: 'ap-badge ap-badge--success' },
  default: { label: 'Per defecte', className: 'ap-badge' },
} as const;

export const ADMIN_CRON_HEALTH_CONFIG = {
  ok: { dot: 'bg-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5', label: 'OK' },
  warning: { dot: 'bg-amber-400', bg: 'border-amber-500/20 bg-amber-500/5', label: 'Retardat' },
  error: { dot: 'bg-rose-400', bg: 'border-rose-500/20 bg-rose-500/5', label: 'Error' },
  unknown: { dot: 'bg-white/30', bg: '', label: 'Mai executat' },
} as const;

export const ADMIN_PROTOCOL_VALIDATION_STYLE = {
  validated: 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-200',
  pending: 'border-amber-500/40 bg-amber-500/[0.08] text-amber-200',
} as const;

export const ADMIN_ACTIVITY_STATS_CARDS = [
  {
    key: 'comms',
    label: 'Comunicacions',
    icon: '✉️',
    cardTone: 'ap-card--info',
    textTone: 'admin-tone-text-info',
  },
  {
    key: 'automation',
    label: 'Automatitzacions',
    icon: '⚡',
    cardTone: 'ap-card--warning',
    textTone: 'admin-tone-text-warning',
  },
  {
    key: 'system',
    label: 'Sistema',
    icon: '🔄',
    cardTone: 'admin-tone-border-info admin-tone-bg-info',
    textTone: 'admin-tone-text-info',
  },
  {
    key: 'crud',
    label: 'Operacions',
    icon: '📝',
    cardTone: 'ap-card--success',
    textTone: 'admin-tone-text-success',
  },
] as const;

export const ADMIN_ACTIVITY_ENTITY_LINKS: Record<string, string> = {
  booking: '/admin/bookings',
  lead: '/admin/leads',
  pack: '/admin/packs',
  customer: '/admin/clientes',
  proposal: '/admin/presupuestos',
};

export const ADMIN_ACTIVITY_CATEGORY_MAP: Record<string, string> = {
  COMM_SENT: 'comms',
  COMM_RESPONDED: 'comms',
  COMM_SEQUENCE_EXEC: 'comms',
  COMM_SEQUENCE_BATCH: 'comms',
  SEND_POST_EVENT_EMAIL: 'comms',
  PAYMENT_REMINDER_SENT: 'comms',
  PAYMENT_RECORDED: 'system',
  AUTOMATION_DAILY_SUMMARY_SENT: 'automation',
  AUTOMATION_SLA_ENFORCED: 'automation',
  AUTOMATION_RUN_ALL: 'automation',
  AUTOMATION_FUEL_REFRESH: 'automation',
  PACK_PRICING_CHECK: 'automation',
  AUTOFIX_OK: 'automation',
  AUTOFIX_FAILED: 'automation',
  AUTOFIX_CRASH: 'automation',
  CALENDAR_SYNC: 'system',
  CALENDAR_SYNC_ERROR: 'system',
  PORTAL_AUTO_CREATED: 'system',
  DOCUMENT_PROPOSAL_SENT: 'comms',
  DOCUMENT_DOSSIER_SENT: 'comms',
  DOCUMENT_DOSSIER_COMPOSITE_PDF_GENERATED: 'system',
  DOCUMENT_CONTRACT_GENERATED: 'system',
  DOCUMENT_CONTRACT_SENT: 'comms',
  DOCUMENT_CONTRACT_SIGNED: 'system',
  DOCUMENT_CONTRACT_CANCELLED: 'system',
  DOCUMENT_CONTRACT_SIGNED_PDF_GENERATED: 'system',
  CREATE: 'crud',
  UPDATE: 'crud',
  DELETE: 'crud',
};

export const ADMIN_CUSTOMER_START_PROCESSES = [
  { type: 'review_request', icon: '⭐', label: 'Demanar Opinió', desc: 'Envia un correu demanant una opinió' },
  { type: 'post_event', icon: '🎉', label: 'Post-esdeveniment complet', desc: 'Canvas 10/10 + Gràcies + Demanar opinió' },
  { type: 'welcome', icon: '👋', label: 'Benvinguda', desc: 'Email de benvinguda + Info empresa' },
  { type: 'promo', icon: '🎁', label: 'Promoció', desc: 'Envia oferta o descompte especial' },
] as const;

export const ADMIN_COLLABORATOR_EMPTY_FORM: {
  name: string;
  company: string;
  email: string;
  phone: string;
  specialty: string;
  roles: string[];
  commissionPct: number;
  pricingModel: 'NET_PLUS_COMMISSION' | 'DISCOUNT';
  costPerHour: number | '';
  notes: string;
} = {
  name: '',
  company: '',
  email: '',
  phone: '',
  specialty: '',
  roles: ['PROVIDER'],
  commissionPct: 0,
  pricingModel: 'DISCOUNT',
  costPerHour: '',
  notes: '',
};

export const COLLABORATOR_ROLE_OPTIONS = [
  { value: 'PROVIDER', label: 'Proveïdor / servei extern' },
  { value: 'REFERRER', label: 'Porta bolos' },
  { value: 'EQUIPMENT_RENTAL', label: 'Lloguer de material' },
  { value: 'CLIENT_PARTNER', label: 'Ens contracta com a partner' },
  { value: 'CREW', label: 'Equip / tècnic / DJ extern' },
] as const;

// Equip intern d'Òrbita que pot ser responsable d'un lead. Negoci petit: llista
// tancada. NO hi van col·laboradors externs (això és "Bolo passat per").
// Ajustar amb els noms reals de l'equip.
export const TEAM_MEMBERS = ['Carles'] as const;

// Rol d'una persona DINS d'un proveïdor (no confondre amb els roles del proveïdor).
export const COLLABORATOR_MEMBER_ROLE_OPTIONS = [
  { value: 'BOSS', label: 'Cap / responsable' },
  { value: 'MAGICIAN', label: 'Mag' },
  { value: 'ANIMATOR', label: 'Animador/a' },
  { value: 'DJ', label: 'DJ' },
  { value: 'TECH', label: 'Tècnic/a' },
  { value: 'OTHER', label: 'Altres' },
] as const;

export function getCollaboratorMemberRoleLabel(role: string): string {
  return COLLABORATOR_MEMBER_ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

// Marge per defecte sobre el cost net en revendre productes de col·laboradors.
export const COLLABORATOR_DEFAULT_MARKUP = 0.20;

// Categoria dels productes de col·laborador que són extres (no s'oferten com a capítol
// propi al dossier: pintacares, globoflèxia, tècnic de so... van inclosos o com a afegit).
export const COLLABORATOR_EXTRA_CATEGORY = 'Extra';

export const ADMIN_COLLABORATOR_PRODUCT_EMPTY_FORM: {
  name: string;
  description: string;
  category: string;
  crew: string;
  durationLabel: string;
  costPrice: number | '';
  sellPrice: number | '';
  includes: string;
  imageUrl: string;
  isActive: boolean;
  visibleInDossier: boolean;
  visibleInBooking: boolean;
} = {
  name: '',
  description: '',
  category: '',
  crew: '',
  durationLabel: '',
  costPrice: '',
  sellPrice: '',
  includes: '',
  imageUrl: '',
  isActive: true,
  visibleInDossier: true,
  visibleInBooking: true,
};

export const ADMIN_FEATURE_DEFINITIONS = [
  { key: 'features.reviews_enabled', label: 'Ressenyes públiques', description: 'Mostrar la secció de ressenyes i Google Reviews al web', icon: 'star' },
  { key: 'features.calendar_enabled', label: 'Calendari de disponibilitat', description: 'Mostrar calendari amb dates disponibles/ocupades', icon: 'calendar' },
  { key: 'features.offers_enabled', label: 'Ofertes especials', description: 'Mostrar secció d’ofertes i promocions', icon: 'gift' },
  { key: 'features.livechat_enabled', label: 'Live Chat', description: 'Activar xat en viu per a suport immediat', icon: 'chat' },
  { key: 'features.blog_enabled', label: 'Blog', description: 'Mostrar secció de blog i articles', icon: 'note' },
  { key: 'features.configurator_enabled', label: 'Configurador d’esdeveniments', description: 'Activar configurador interactiu d’esdeveniments', icon: 'controls' },
] as const;

export const ADMIN_STATS_DEFINITIONS = [
  { key: 'stats.events_completed', label: "Esdeveniments Realitzats", description: "Total d'esdeveniments completats amb èxit", icon: 'party' },
  { key: 'stats.people_entertained', label: "Persones Entretingudes", description: "Total de convidats en tots els esdeveniments", icon: 'people' },
  { key: 'stats.years_experience', label: "Anys d'Experiència", description: "Anys des del primer esdeveniment (calculat automàticament)", icon: 'calendar' },
  { key: 'stats.satisfaction_percent', label: "Satisfacció (%)", description: "Percentatge de clients satisfets", icon: 'star' },
  { key: 'stats.rating_average', label: "Valoració Mitjana", description: "Valoració mitjana d'1-5 estrelles", icon: 'sparkle' },
] as const;



export const ADMIN_EMAIL_TEMPLATE_SLUGS = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  ADMIN_BOOKING_NOTIFICATION: 'admin_booking_notification',
  POST_EVENT: 'post_event',
  PAYMENT_REMINDER: 'payment_reminder',
  TESTIMONIAL_APPROVED: 'testimonial_approved',
  TESTIMONIAL_RECEIVED: 'testimonial_received',
  TESTIMONIAL_REMINDER: 'testimonial_reminder',
  WELCOME: 'welcome',
} as const;

export type AdminEmailTemplateSlug = typeof ADMIN_EMAIL_TEMPLATE_SLUGS[keyof typeof ADMIN_EMAIL_TEMPLATE_SLUGS];

export const ADMIN_EMAIL_TEMPLATE_VARIABLES: Record<AdminEmailTemplateSlug, string[]> = {
  booking_confirmation: ['clientName', 'reference', 'eventDate', 'eventType', 'packName', 'location', 'total', 'depositAmount', 'startTime', 'endTime'],
  admin_booking_notification: ['clientName', 'clientEmail', 'clientPhone', 'reference', 'eventDate', 'eventType', 'packName', 'location', 'total'],
  post_event: ['clientName', 'packName', 'eventDate', 'reviewUrl', 'googleReviewUrl'],
  payment_reminder: ['clientName', 'reference', 'pendingAmount', 'eventDate', 'daysUntilEvent'],
  testimonial_approved: ['clientName', 'discountCode', 'discountAmount'],
  testimonial_received: ['clientName'],
  testimonial_reminder: ['clientName', 'reviewUrl'],
  welcome: ['clientName'],
};

export const ADMIN_EMAIL_TEMPLATE_DESCRIPTIONS: Record<AdminEmailTemplateSlug, string> = {
  booking_confirmation: 'Confirmació de reserva al client',
  admin_booking_notification: "Notificació de nova reserva a l'admin",
  post_event: 'Email post-event demanant ressenya',
  payment_reminder: 'Recordatori de pagament pendent',
  testimonial_approved: 'Testimoni aprovat + codi descompte',
  testimonial_received: 'Confirmació recepció testimoni',
  testimonial_reminder: 'Recordatori per deixar ressenya',
  welcome: 'Benvinguda al nou client',
};

export const PACK_PRICING_MODEL_DEFAULTS = {
  marginTargetPct: 0.55,
  laborCostPerHour: 22,
  specialistMultiplier: 1.35,
  fixedPackCost: 35,
  alertDivergencePct: 20,
  socialSecurityPct: 0.32,
  withholdingPct: 0.15,
  specialistServices: ['bodas', 'empresas'],
  supportOperatorMinGuests: 150,
  supportOperatorMinDjHours: 6,
  supportOperatorMinWatts: 6000,
} as const;

export const ADMIN_CANVAS_PRESET_SIZES = {
  story: { width: 1080, height: 1920, label: 'Story (9:16)' },
  post: { width: 1080, height: 1080, label: 'Post (1:1)' },
  landscape: { width: 1920, height: 1080, label: 'Horitzontal (16:9)' },
} as const;

export const ADMIN_CANVAS_TEMPLATES = [
  {
    name: 'Promo Event',
    width: 1080,
    height: 1920,
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    elements: [
      { id: 't1', type: 'shape', x: 0, y: 0, width: 1080, height: 1920, shapeType: 'rect', fill: 'rgba(6,182,212,0.08)' },
      { id: 't2', type: 'text', x: 80, y: 200, width: 920, height: 120, text: 'ORBITA EVENTS', fontSize: 72, fontWeight: 'bold', color: '#06b6d4', textAlign: 'center' },
      { id: 't3', type: 'text', x: 80, y: 400, width: 920, height: 200, text: 'El teu event\ncom mai l\'has\nimaginat', fontSize: 96, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      { id: 't4', type: 'shape', x: 390, y: 700, width: 300, height: 4, shapeType: 'rect', fill: '#06b6d4', borderRadius: 2 },
      { id: 't5', type: 'text', x: 80, y: 780, width: 920, height: 100, text: 'DJ · Il·luminació · So Professional', fontSize: 36, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
      { id: 't6', type: 'shape', x: 240, y: 1400, width: 600, height: 80, shapeType: 'rect', fill: '#06b6d4', borderRadius: 40 },
      { id: 't7', type: 'text', x: 240, y: 1415, width: 600, height: 50, text: 'RESERVA ARA', fontSize: 32, fontWeight: 'bold', color: '#000000', textAlign: 'center' },
      { id: 't8', type: 'text', x: 80, y: 1700, width: 920, height: 40, text: 'www.orbitaevents.com', fontSize: 28, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    ],
  },
  {
    name: 'Oferta Flash',
    width: 1080,
    height: 1080,
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #1c1917 100%)',
    elements: [
      { id: 'o1', type: 'text', x: 80, y: 80, width: 920, height: 60, text: 'OFERTA LIMITADA', fontSize: 36, fontWeight: 'bold', color: '#f97316', textAlign: 'center' },
      { id: 'o2', type: 'text', x: 80, y: 250, width: 920, height: 200, text: '-15%', fontSize: 200, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      { id: 'o3', type: 'text', x: 80, y: 500, width: 920, height: 80, text: 'en tots els packs', fontSize: 48, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
      { id: 'o4', type: 'shape', x: 340, y: 640, width: 400, height: 4, shapeType: 'rect', fill: '#f97316', borderRadius: 2 },
      { id: 'o5', type: 'text', x: 80, y: 700, width: 920, height: 60, text: 'Codi: FLASH15', fontSize: 40, fontWeight: 'bold', color: '#f97316', textAlign: 'center' },
      { id: 'o6', type: 'text', x: 80, y: 820, width: 920, height: 50, text: 'Vàlid fins diumenge', fontSize: 32, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
      { id: 'o7', type: 'text', x: 80, y: 960, width: 920, height: 40, text: 'ORBITA EVENTS · orbitaevents.com', fontSize: 24, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
    ],
  },
  {
    name: 'Testimoni',
    width: 1080,
    height: 1920,
    bg: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
    elements: [
      { id: 'r1', type: 'text', x: 80, y: 200, width: 920, height: 60, text: '★★★★★', fontSize: 56, color: '#eab308', textAlign: 'center' },
      { id: 'r2', type: 'text', x: 100, y: 400, width: 880, height: 400, text: '"La millor festa de\nla nostra vida.\nGràcies Òrbita!"', fontSize: 56, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
      { id: 'r3', type: 'shape', x: 440, y: 900, width: 200, height: 4, shapeType: 'rect', fill: 'rgba(255,255,255,0.2)', borderRadius: 2 },
      { id: 'r4', type: 'text', x: 80, y: 970, width: 920, height: 50, text: '— Maria i Joan, Boda 2026', fontSize: 32, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
      { id: 'r5', type: 'text', x: 80, y: 1600, width: 920, height: 60, text: 'ORBITA EVENTS', fontSize: 40, fontWeight: 'bold', color: '#06b6d4', textAlign: 'center' },
      { id: 'r6', type: 'text', x: 80, y: 1700, width: 920, height: 40, text: 'Reserva el teu event · orbitaevents.com', fontSize: 24, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    ],
  },
  {
    name: 'Buit',
    width: 1080,
    height: 1080,
    bg: '#0a0a0a',
    elements: [],
  },
] as const;

export const ADMIN_WEATHER_EMOJI = {
  Clear: '\u2600\uFE0F',
  Clouds: '\u2601\uFE0F',
  Rain: '\uD83C\uDF27\uFE0F',
  Drizzle: '\uD83C\uDF26\uFE0F',
  Thunderstorm: '\u26C8\uFE0F',
  Snow: '\u2744\uFE0F',
} as const;

export const ADMIN_WEATHER_EMOJI_CA = {
  'cel serè': '\u2600\uFE0F',
  ennuvolat: '\u2601\uFE0F',
  pluja: '\uD83C\uDF27\uFE0F',
  plugim: '\uD83C\uDF26\uFE0F',
  tempesta: '\u26C8\uFE0F',
  neu: '\u2744\uFE0F',
  boira: '\uD83C\uDF2B\uFE0F',
} as const;

export const ADMIN_WEATHER_DEFAULT_EMOJI = '\uD83C\uDF24\uFE0F';

export const PROFITABILITY_MODEL_DEFAULTS = {
  packCostRatio: 0.36,
  extraCostRatio: 0.28,
  extraHourCostRatio: 0.2,
  // Cost intern dels serveis propis d'Òrbita (DJ, tècnic...) sobre el seu preu de
  // venda: temps, equip i operativa. El DJ no és cost 0; el marge ha de ser real.
  orbitaServiceCostRatio: 0.25,
  fixedOperationalCost: 45,
  channelCac: {
    WEBSITE: 22,
    CONFIGURATOR: 18,
    PHONE: 12,
    WHATSAPP: 10,
    INSTAGRAM: 35,
    WALLAPOP: 16,
    REFERRAL: 8,
    GOOGLE: 28,
    OTHER: 20,
    UNKNOWN: 20,
  },
} as const;

export const ADMIN_INBOX_FALLBACK_PACK_OPTIONS = [
  { id: 'disco-basico', label: 'Bàsic (Festes)', price: 350 },
  { id: 'disco-completo', label: 'Complet (Festes)', price: 400 },
  { id: 'disco-premium', label: 'Premium (Festes)', price: 700 },
  { id: 'bodas-premium', label: 'Premium (Bodes)', price: 800 },
  { id: 'empresas-evento', label: 'Estàndard (Empreses)', price: 850 },
] as const;

export const ADMIN_EXTRA_SERVICE_LABELS = {
  bodas: 'Bodes',
  fiestas: 'Festes',
  discomovil: 'Discomòbil',
  empresas: 'Empreses',
  animacion: 'Animació',
} as const;

export const ADMIN_EXTRA_CATEGORY_OPTIONS = [
  { value: 'effects', label: 'Efectes' },
  { value: 'visual', label: 'Visual' },
  { value: 'time', label: 'Temps' },
  { value: 'sound', label: 'So' },
  { value: 'lighting', label: 'Il·luminació' },
  { value: 'other', label: 'Altres' },
] as const;

export const ADMIN_LEAD_TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: true,
  createdBy: true,
  completedAt: true,
} as const;

export function getAdminLeadPackOptions() {
  const allPacks = getAllPacks();
  const manual = { value: 'manual', label: 'Manual / Personalitzat ✍️', price: 0, hours: 0 };
  const packOptions = allPacks.map((p) => ({
    value: p.slug,
    label: `${p.name} (${p.service}) ${p.badge || ''}`.trim(),
    price: p.priceValue,
    hours: p.durationHours,
  }));
  return [manual, ...packOptions];
}

export const ADMIN_PDF_STUDIO_SECTION_LABELS = {
  config: 'Configuració',
  client: 'Client i esdeveniment',
  brand: 'Marca i identitat',
  pack: 'Pack i condicions',
  'extras-catalog': 'Extres del catàleg',
  'extras-custom': 'Extres personalitzats',
  contract: 'Dades del contracte',
} as const;

export const ADMIN_PDF_STUDIO_DEFAULT_SECTION_ORDER = [
  'config', 'client', 'brand', 'pack', 'extras-catalog', 'extras-custom', 'contract',
] as const;

export const ADMIN_PDF_STUDIO_DRAFT_KEY = 'admin.presupuestos.pdfstudio.draft.v1';
export const ADMIN_PDF_STUDIO_CUSTOM_PACK_ID = '__custom_pack__';
export const ADMIN_PDF_STUDIO_OPERATOR_EXTRA_ID = '__operator_extra_pdf__';

export const ADMIN_PDF_STUDIO_COPY = {
  ca: {
    hours: 'hores',
    customServiceName: 'Servei personalitzat',
    customExtraDescription: 'Extra personalitzat',
    defaultClientName: 'Client',
    sendQuote: 'Envia pressupost',
    sendingQuote: 'Enviant...',
    noDate: 'Sense data',
    noSchedule: 'Sense horari',
    noLocation: 'Sense ubicació',
    clientLabel: 'Client',
  },
  es: {
    hours: 'horas',
    customServiceName: 'Servicio personalizado',
    customExtraDescription: 'Extra personalizado',
    defaultClientName: 'Cliente',
    sendQuote: 'Enviar presupuesto',
    sendingQuote: 'Enviando...',
    noDate: 'Sin fecha',
    noSchedule: 'Sin horario',
    noLocation: 'Sin ubicación',
    clientLabel: 'Cliente',
  },
  en: {
    hours: 'hours',
    customServiceName: 'Custom service',
    customExtraDescription: 'Custom extra',
    defaultClientName: 'Client',
    sendQuote: 'Send quote',
    sendingQuote: 'Sending...',
    noDate: 'No date',
    noSchedule: 'No schedule',
    noLocation: 'No location',
    clientLabel: 'Client',
  },
} as const;

export const ADMIN_PDF_STUDIO_SERVICE_LABELS = {
  bodas: 'Bodes',
  fiestas: 'Festes',
  discomovil: 'Discomòbil',
  empresas: 'Empreses',
  animacion: 'Animació',
} as const;

export const ADMIN_CRON_PREFIXES = [
  { id: 'customerLifecycle', label: 'Lifecycle clients CRM', prefix: 'crm.customer-lifecycle', frequency: 'Diari' },
  { id: 'taskAutomation', label: 'Tasques automàtiques', prefix: 'automation.tasks', frequency: 'Diari' },
  { id: 'commercial', label: 'Comercial diari', prefix: 'automation.commercial', frequency: 'Diari' },
  { id: 'fuel', label: 'Preu combustible', prefix: 'automation.fuel', frequency: 'Diari' },
  { id: 'invoiceSync', label: 'Sync factures', prefix: 'automation.invoiceSync', frequency: 'Diari' },
  { id: 'packPricing', label: 'Revisió preus packs', prefix: 'automation.packPricing', frequency: 'Diari' },
  { id: 'postEvent', label: 'Emails post-event', prefix: 'automation.postEvent', frequency: 'Diari' },
  { id: 'reviewsSync', label: 'Ressenyes Google', prefix: 'automation.reviewsSync', frequency: 'Diari' },
  { id: 'weeklyBenchmark', label: 'Benchmark setmanal', prefix: 'benchmark.weekly', frequency: 'Setmanal (dl)' },
  { id: 'urgentFollowUpAlerts', label: 'Alertes follow-up urgents', prefix: 'alerts.urgentFollowUp', frequency: '4x diari' },
  { id: 'leadReengagement', label: 'Reengagement leads dormants', prefix: 'automation.leadReengagement', frequency: 'Diari' },
  { id: 'dossierTrashPurge', label: 'Purga paperera dossiers', prefix: 'dossier.trash-purge', frequency: 'Diari' },
  { id: 'calendarSync', label: 'Google Calendar complet', prefix: 'automation.calendarSync', frequency: 'Cada 15 min' },
] as const;

export const ADMIN_HEALTH_ACTIVE_LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] as const;
export const ADMIN_HEALTH_ACTIVE_BOOKING_STATUSES = ['CONFIRMED', 'PREPARING'] as const;
export const ADMIN_MANUAL_SEQUENCE_STEP_OPTIONS = [
  { step: 1, label: 'Pas 1 · primer seguiment', delayHours: 24 },
  { step: 2, label: 'Pas 2 · recordatori pressupost', delayHours: 72 },
  { step: 3, label: 'Pas 3 · urgència suau', delayHours: 168 },
  { step: 4, label: 'Pas 4 · última disponibilitat', delayHours: 336 },
  { step: 5, label: 'Pas 5 · tancament', delayHours: 720 },
] as const;
export const ADMIN_SALUT_STATUS_FILTER_OPTIONS = [
  { id: 'all', label: 'Tot' },
  { id: 'critical', label: 'Crítics' },
  { id: 'warning', label: 'Per revisar' },
  { id: 'ok', label: 'Correctes' },
] as const;

export const ADMIN_SALUT_FOCUS_FILTER_OPTIONS = [
  { id: 'all', label: 'Tot' },
  { id: 'inventory', label: 'Inventari' },
  { id: 'packs', label: 'Packs' },
  { id: 'extras', label: 'Extres' },
  { id: 'leads', label: 'Leads' },
  { id: 'bookings', label: 'Reserves' },
  { id: 'tasks', label: 'Tasques' },
] as const;

export const ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS = [
  { id: 'all', label: 'Tots els cobraments' },
  { id: 'deposit-pending', label: 'Bestreta pendent' },
  { id: 'overdue', label: 'Cobraments vençuts' },
  { id: 'due-soon', label: 'Vencen aviat' },
] as const;

// ─── Pack Editor Tabs ────────────────────────────────────────────────────

export type PackEditorTab = 'economic' | 'content' | 'texts' | 'publish';

export const ADMIN_PACK_EDITOR_TABS: ReadonlyArray<{ id: PackEditorTab; label: string; icon: string }> = [
  { id: 'economic', label: 'Economia', icon: '💰' },
  { id: 'content', label: 'Contingut', icon: '🎛️' },
  { id: 'texts', label: 'Textos', icon: '🌐' },
  { id: 'publish', label: 'Publicació', icon: '✅' },
] as const;

// ─── PDF Studio Defaults ────────────────────────────────────────────────

export const ADMIN_PDF_STUDIO_DEFAULTS: Record<string, string> = {
  conditionsText: `Reserva amb 30% per bloquejar la data.\nPagament final 7 dies abans de l'esdeveniment.\nDesplaçament inclòs fins a 25 km des de Granollers.`,
  whyChooseUs: 'Equip tecnic professional, resposta rapida i proposta adaptada perque tot surti perfecte sense complicacions.',
  brandTagline: 'El teu esdeveniment. El teu estil. La teva nit perfecta.',
  cancellationPolicy: 'Cancel·lació fins a 30 dies: 100% devolució. 15-30 dies: 50%. Menys de 15 dies: no reemborsable.',
  brandName: SITE_CONFIG.business.name,
  brandWebsite: SITE_CONFIG.web.domain,
};

// ─── Dashboard Pilot Steps (static config) ──────────────────────────────

export const ADMIN_DASHBOARD_PILOT_STEPS = [
  { id: 'leads', step: 'Pas 1', title: 'Respondre entrades', href: '/admin/leads', cta: 'Anar a entrades' },
  { id: 'tasks', step: 'Pas 2', title: 'Executar tasques', href: '/admin/tasks', cta: 'Veure tasques' },
  { id: 'postevent', step: 'Pas 3', title: 'Tancar post-esdeveniment', href: '/admin/emails', cta: 'Gestionar' },
  { id: 'bookings', step: 'Pas 4', title: 'Preparar reserves', href: '/admin/bookings', cta: 'Veure reserves' },
] as const;

// ─── Dashboard Insight Colors ─────────────────────────────────────────

export const ADMIN_DASHBOARD_INSIGHT_COLORS: Record<string, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  danger: 'bg-red-500/10 border-red-500/20 text-red-400',
  info: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
};

// ─── Pricing Tabs ───────────────────────────────────────────────────────

export type PricingTab = 'overview' | 'tarifes' | 'extras' | 'packs' | 'inventory';

export const ADMIN_PRICING_TABS: ReadonlyArray<{ key: PricingTab; label: string; icon: string }> = [
  { key: 'overview',  label: 'Resum',     icon: '📊' },
  { key: 'tarifes',   label: 'Tarifes',   icon: '🎯' },
  { key: 'extras',    label: 'Extras',    icon: '✨' },
  { key: 'packs',     label: 'Packs',     icon: '📦' },
  { key: 'inventory', label: 'Inventari', icon: '🔧' },
] as const;

// ─── Health Status Visual Mapping (semàfor compartit) ───────────────────

export type HealthStatus = 'critical' | 'warning' | 'ok';

export const ADMIN_HEALTH_STATUS_TONE: Record<HealthStatus, string> = {
  critical: 'border-rose-500/20 bg-rose-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  ok: 'border-emerald-500/20 bg-emerald-500/5',
};

export const ADMIN_HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  critical: 'Cal actuar',
  warning: 'Convé revisar',
  ok: 'Correcte',
};

export const ADMIN_HEALTH_STATUS_DOT: Record<HealthStatus, string> = {
  critical: 'bg-rose-400',
  warning: 'bg-amber-400',
  ok: 'bg-emerald-400',
};

export const ADMIN_HEALTH_STATUS_ORDER: Record<HealthStatus, number> = {
  critical: 0,
  warning: 1,
  ok: 2,
};
export const ADMIN_WEEKDAY_SHORT_LABELS = ['Dg', 'Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds'] as const;

// ─── Chart & dataviz colors (fonts de veritat per admin) ─────────────────────

// Paleta canònica de la seqüència de colors per charts (donut, bars, llegendes)
export const ADMIN_CHART_COLORS = [
  '#22d3ee', // 0: cyan
  '#f59e0b', // 1: amber
  '#34d399', // 2: emerald
  '#f472b6', // 3: pink
  '#818cf8', // 4: indigo
  '#fb7185', // 5: rose
] as const;

// Colors nomenats per les sèries del dashboard principal
export const ADMIN_CHART_SERIES_COLORS = {
  ga4Sessions: '#22d3ee',
  ga4Users:    '#60a5fa',
  leads:       '#34d399',
  leadsWon:    '#fbbf24',
  bookings:    '#f472b6',
  revenue:     '#a78bfa',
  prevBar:     '#94a0af',
  trendDots:   '#67e8f9',
  trendLine:   'rgba(34,211,238,0.95)',
} as const;

// Colors estructurals SVG (eixos, graelles, pistes de donut, línies base)
export const ADMIN_SVG_COLORS = {
  donutTrack:    'rgba(255,255,255,0.06)',
  gridLine:      'rgba(255,255,255,0.05)',
  axisLabel:     'rgba(255,255,255,0.35)',
  emptyGradient: 'rgba(255,255,255,0.08)',
  baselineLine:  'rgba(255,255,255,0.12)',
} as const;
