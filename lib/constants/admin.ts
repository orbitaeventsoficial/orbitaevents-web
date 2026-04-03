import { getAllPacks } from '@/app/config/packs-config';

export const ADMIN_SHORTCUT_ROUTES: Record<string, string> = {
  '1': '/admin/leads',
  '2': '/admin/tasks',
  '3': '/admin/emails',
  '4': '/admin/bookings',
  c: '/admin/calendario',
};

export const ADMIN_PAGE_LABELS: Record<string, string> = {
  leads: 'Entrades',
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
  CREATE: { label: 'Creat', icon: '➕', tone: 'admin-tone-text-success' },
  UPDATE: { label: 'Actualitzat', icon: '✏️', tone: 'admin-tone-text-info' },
  DELETE: { label: 'Eliminat', icon: '🗑️', tone: 'admin-tone-text-danger' },
};


export const CUSTOMER_TIMELINE_FILTER_OPTIONS = [
  { key: 'all', label: 'Tot', icon: '📋' },
  { key: 'proposals', label: 'Pressupostos', icon: '📄' },
  { key: 'bookings', label: 'Reserves', icon: '📅' },
  { key: 'tasks', label: 'Tasques', icon: '✅' },
  { key: 'comms', label: 'Comunicacions', icon: '💬' },
] as const;

export const CUSTOMER_TIMELINE_EVENT_META: Record<string, { filter: 'proposals' | 'bookings' | 'tasks' | 'comms'; icon: string; borderClass: string }> = {
  PROPOSAL_CREATED: { filter: 'proposals', icon: '📄', borderClass: 'border-l-cyan-500' },
  PROPOSAL_SENT: { filter: 'proposals', icon: '📤', borderClass: 'border-l-cyan-400' },
  PROPOSAL_ACCEPTED: { filter: 'proposals', icon: '✅', borderClass: 'border-l-emerald-500' },
  BOOKING_CREATED: { filter: 'bookings', icon: '📅', borderClass: 'border-l-indigo-500' },
  BOOKING_CONFIRMED: { filter: 'bookings', icon: '🎉', borderClass: 'border-l-emerald-400' },
  TASK_CREATED: { filter: 'tasks', icon: '📝', borderClass: 'border-l-amber-500' },
  TASK_DONE: { filter: 'tasks', icon: '✓', borderClass: 'border-l-emerald-500' },
  MESSAGE_SENT: { filter: 'comms', icon: '✉️', borderClass: 'border-l-violet-500' },
  EMAIL_RECEIVED: { filter: 'comms', icon: '📩', borderClass: 'border-l-violet-400' },
  WHATSAPP_SENT: { filter: 'comms', icon: '💬', borderClass: 'border-l-green-500' },
  PHONE_CALL: { filter: 'comms', icon: '📞', borderClass: 'border-l-sky-500' },
  NOTE_ADDED: { filter: 'comms', icon: '📌', borderClass: 'border-l-white/20' },
  ACTIVITY: { filter: 'comms', icon: '•', borderClass: 'border-l-white/10' },
};


export const ADMIN_FAB_ITEMS = [
  { icon: '👥', label: 'Entrada rapida', href: '/admin/leads' },
  { icon: '📋', label: 'Reserva', href: '/admin/bookings/new' },
  { icon: '📝', label: 'Tasca', href: '/admin/tasks/new' },
  { icon: '📄', label: 'Pressupost', href: '/admin/presupuestos' },
] as const;

export const ADMIN_MOBILE_PRIMARY_NAV = [
  { icon: '📊', label: 'Tauler', href: '/admin' },
  { icon: '📥', label: 'Entrades', href: '/admin/leads', badgeKey: 'newLeads' },
  { icon: '📋', label: 'Reserves', href: '/admin/bookings' },
  { icon: '📅', label: 'Calendari', href: '/admin/calendario' },
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
};

export const ADMIN_ACTIVITY_CATEGORY_MAP: Record<string, string> = {
  COMM_SENT: 'comms',
  COMM_RESPONDED: 'comms',
  COMM_SEQUENCE_EXEC: 'comms',
  COMM_SEQUENCE_BATCH: 'comms',
  SEND_POST_EVENT_EMAIL: 'comms',
  PAYMENT_REMINDER_SENT: 'comms',
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
  commissionPct: number;
  pricingModel: 'NET_PLUS_COMMISSION' | 'DISCOUNT';
  notes: string;
} = {
  name: '',
  company: '',
  email: '',
  phone: '',
  commissionPct: 10,
  pricingModel: 'DISCOUNT',
  notes: '',
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
} as const;

export const ADMIN_CRON_PREFIXES = [
  { id: 'commercial', label: 'Comercial diari', prefix: 'automation.commercial', frequency: 'Diari' },
  { id: 'fuel', label: 'Preu combustible', prefix: 'automation.fuel', frequency: 'Diari' },
  { id: 'invoiceSync', label: 'Sync factures', prefix: 'automation.invoiceSync', frequency: 'Diari' },
  { id: 'packPricing', label: 'Revisió preus packs', prefix: 'automation.packPricing', frequency: 'Diari' },
  { id: 'postEvent', label: 'Emails post-event', prefix: 'automation.postEvent', frequency: 'Diari' },
  { id: 'reviewsSync', label: 'Ressenyes Google', prefix: 'automation.reviewsSync', frequency: 'Diari' },
] as const;

export const ADMIN_HEALTH_ACTIVE_LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] as const;
export const ADMIN_HEALTH_ACTIVE_BOOKING_STATUSES = ['CONFIRMED', 'PREPARING'] as const;
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


