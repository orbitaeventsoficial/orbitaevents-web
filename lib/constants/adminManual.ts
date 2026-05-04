export type AdminManualTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface AdminManualCapability {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: AdminManualTone;
  signals: string[];
}

export interface AdminManualSection {
  icon: string;
  title: string;
  summary: string;
  capabilities: AdminManualCapability[];
}

export interface AdminManualPrinciple {
  title: string;
  description: string;
}

export interface AdminManualSnapshotSection {
  title: string;
  description: string;
  items: string[];
}

export interface AdminManualRealityCheck {
  question: string;
  answer: string;
}

export interface AdminAutomationFrontier {
  title: string;
  why: string;
  today: string;
  target: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface AdminManualVisualGovernanceItem {
  title: string;
  description: string;
  href: string;
  status: 'ALIGNED' | 'SECOND_WAVE';
  signals: string[];
}

export interface AdminManualVisualGovernanceSection {
  title: string;
  description: string;
  status: 'ALIGNED' | 'SECOND_WAVE';
  items: AdminManualVisualGovernanceItem[];
}

export const ADMIN_MANUAL_PRINCIPLES: AdminManualPrinciple[] = [
  {
    title: 'Comença pel problema, no pel mòdul',
    description: 'Si vols vendre més, entra per leads, clients, campanyes o reporting. Si vols operar millor, entra per reserves, calendari, tasques o capacitat.',
  },
  {
    title: 'Cada pantalla ha de respondre: què passa i què faig ara?',
    description: 'La màquina és potent quan converteix dades en següents accions: contactar, reservar, cobrar, revisar, publicar o reactivar.',
  },
  {
    title: 'El zenit és coherència',
    description: 'CRM, reserves, finances, social, inbox i reporting han de parlar el mateix llenguatge i no duplicar fonts de veritat.',
  },
];

export const ADMIN_MANUAL_SNAPSHOT: AdminManualSnapshotSection[] = [
  {
    title: 'Què té la web pública',
    description: 'L’aparador i la captació que veu el client final.',
    items: [
      'web pública multiidioma amb serveis, packs, portfolio, ressenyes i calendari',
      'configurador per demanar pressupost i convertir una visita en lead',
      'formularis, WhatsApp i proves socials per captar contactes',
      'SEO local i contingut per fer visible el negoci a Google',
    ],
  },
  {
    title: 'Què té l’admin',
    description: 'El sistema intern per vendre, operar, cobrar i mantenir control.',
    items: [
      'Leads, Sales Ops i Customer Hub per treballar captació i relació comercial',
      'Bookings, Calendari, Tasques i Inbox per executar operativa diària',
      'Finances, Reporting, Packs, Inventari i Post-event per controlar marge i qualitat',
      'Crons, Salut, Features, Scripts i Activity per governar la màquina',
    ],
  },
  {
    title: 'Què fa automàticament',
    description: 'Coses que el sistema calcula, genera o executa sense esperar que hi pensis cada vegada.',
    items: [
      'cron diari de tasques automàtiques, lifecycle de clients, post-event, reviews, pricing, invoices i comercial',
      'follow-ups urgents, reactivació comercial assistida i senyals de risc',
      'scoring, health score, lifecycle i diversos resums executius',
      'reserva automàtica quan es confirma un lead i diversos auto-triggers lligats al workflow',
    ],
  },
  {
    title: 'Què t’avisa o et posa senyals',
    description: 'Com el sistema et crida l’atenció quan hi ha coses importants.',
    items: [
      'badges i comptadors dins l’admin, inclòs unread a Inbox',
      'panell de crons i estat de salut per detectar errors o retards',
      'alertes urgents de follow-up via email o WhatsApp en casos concrets',
      'calendari sincronitzat i senyals operatives dins dashboards i hubs',
    ],
  },
  {
    title: 'Què continua sent manual',
    description: 'Parts on el sistema ajuda molt però l’última decisió o execució continua depenent de tu.',
    items: [
      'enviar molts missatges i pressupostos continua requerint confirmació o llançament explícit',
      'algunes automatitzacions es poden forçar des de l’admin, però no s’han d’assumir com a completament autònomes',
      'no hi ha promesa general de push mòbil natiu per a tot; hi ha avisos i alertes en canals concrets',
      'moltes eines existeixen, però no totes estan igual de polides o tancades a nivell de producte',
    ],
  },
];

export const ADMIN_MANUAL_REALITY_CHECKS: AdminManualRealityCheck[] = [
  {
    question: 'M’avisarà al mòbil de tot el que sigui important?',
    answer: 'No de tot. Hi ha alertes i senyals reals dins l’admin, i alguns casos urgents poden sortir per email o WhatsApp, però no has de pressuposar push natiu universal si no està indicat explícitament.',
  },
  {
    question: 'Es traurà dades i feina sol?',
    answer: 'En part sí: hi ha crons, scoring, follow-ups, tasques automàtiques, lifecycle, post-event i altres processos que treballen sols. Però el sistema continua sent assistit, no màgic: moltes decisions comercials i operatives encara passen per tu.',
  },
  {
    question: 'Com sé si una funció existeix o no?',
    answer: 'Has d’entrar pel manual i pel mapa de capacitats, no pel record. Si una funcionalitat és important, ha de quedar descrita aquí en llenguatge d’usuari i amb el mòdul on es fa servir.',
  },
  {
    question: 'Si no la faig servir sovint, la recordaré?',
    answer: 'Probablement no. Per això aquest manual ha de funcionar com a memòria externa del producte: què hi ha, per a què serveix i què és automàtic o manual.',
  },
];

export const ADMIN_MANUAL_AUTOMATION_FRONTIER: AdminAutomationFrontier[] = [
  {
    title: 'Inbox i seguiments comercials',
    why: 'És on encara es perd més disciplina si l’operador ha de recordar massa coses.',
    today: 'Hi ha follow-ups canònics, plantilles intel·ligents i alertes urgents, però molt seguiment encara depèn de llançar redactors o seqüències manualment.',
    target: 'Cadències automàtiques de nurturing, drafts preparats i següent pas comercial generat sense haver d’entrar a pensar cada cas des de zero.',
    priority: 'CRITICAL',
  },
  {
    title: 'Post-event i reputació',
    why: 'És feina repetitiva, sensible al temps i fàcil d’oblidar quan hi ha molta operativa.',
    today: 'Existeixen crons i enviaments post-event, però encara hi ha pendents visibles per forçar manualment i marge clar per automatitzar més recordatoris i seguiment.',
    target: 'Cicle post-event gairebé autònom: correu, recordatori, ressenya, testimonial i següent acció sense persecució manual.',
    priority: 'CRITICAL',
  },
  {
    title: 'Customer Hub i reactivació',
    why: 'El sistema ja detecta risc i prepara accions, però encara et fa confirmar massa passos intermedis.',
    today: 'Hi ha reactivació assistida, drafts i tasques deduplicades, però la creació continua sent explícita i el següent pas encara no és totalment automàtic.',
    target: 'Hub que proposa, prepara i deixa encarrilat el retorn comercial, deixant manual només l’aprovació final quan toca.',
    priority: 'HIGH',
  },
  {
    title: 'Bookings, checklist i cobraments',
    why: 'És operativa repetitiva i temporal: el sistema hauria de vigilar molt abans que tu.',
    today: 'Ja hi ha checklist, tasques automàtiques, calendar sync i senyals de cobrament, però encara hi ha massa revisió humana de seguiment i tancament.',
    target: 'Reserva que genera sola preparació, avisos, seguiment de cobrament i post-event amb menys intervenció manual.',
    priority: 'HIGH',
  },
  {
    title: 'Alertes fora de l’admin',
    why: 'Si només veus el problema quan entres al panell, arribes tard a molts casos crítics.',
    today: 'Hi ha badges, dashboards, cron health i alguns avisos urgents per email o WhatsApp, però no una capa universal d’alerta executiva fora del panell.',
    target: 'Sistema que treu fora del dashboard les alertes realment crítiques i només et demana decisió, no vigilància constant.',
    priority: 'HIGH',
  },
  {
    title: 'Sincronitzacions i accions de manteniment',
    why: 'Els botons de “sincronitzar” o “executar cron ara” acostumen a indicar deute d’automatització o d’observabilitat.',
    today: 'Encara hi ha diversos punts de forçat manual: emails cron, packs sync, algunes execucions d’automatismes i comprovacions operatives.',
    target: 'Sincronitzacions programades i fiables, amb excepció manual només per reintents, debugging o operacions sensibles.',
    priority: 'MEDIUM',
  },
];

export const ADMIN_MANUAL_VISUAL_GOVERNANCE: AdminManualVisualGovernanceSection[] = [
  {
    title: 'Ja parla en mode propietari',
    description: 'Workspaces on la lectura executiva ja separa què vigila el sistema, què et reclama decisió i quin és el següent pas.',
    status: 'ALIGNED',
    items: [
      {
        title: 'Dashboard',
        description: 'Centre de comandament amb lectura executiva abans del detall.',
        href: '/admin',
        status: 'ALIGNED',
        signals: ['automàtic', 'manual', 'següent pas', 'semàfors'],
      },
      {
        title: 'Leads',
        description: 'La cua comercial ja obre amb tensió, decisió i proper moviment visibles.',
        href: '/admin/leads',
        status: 'ALIGNED',
        signals: ['SLA', 'prioritat', 'risc', 'acció següent'],
      },
      {
        title: 'Customer Hub',
        description: 'Capçalera i resum superior ja treballen com a cockpit de propietari.',
        href: '/admin/clientes',
        status: 'ALIGNED',
        signals: ['risc comercial', 'reactivació', 'manual', 'què toca ara'],
      },
      {
        title: 'Bookings',
        description: 'Llista i fitxa individual ja obren amb lectura de cobrament, preparació i risc.',
        href: '/admin/bookings',
        status: 'ALIGNED',
        signals: ['cobrament', 'preparació', 'risc', 'següent pas'],
      },
      {
        title: 'Tasks',
        description: 'La cua ja mostra tensió operativa i què demana intervenció abans de la llista.',
        href: '/admin/tasks',
        status: 'ALIGNED',
        signals: ['vençudes', 'bloquejades', 'VIP', 'reactivació'],
      },
      {
        title: 'Inbox',
        description: 'La safata ja resumeix seguiments urgents i estat del canal abans del detall.',
        href: '/admin/inbox',
        status: 'ALIGNED',
        signals: ['follow-up urgent', 'noves entrades', 'IMAP', 'resposta pendent'],
      },
      {
        title: 'Manual',
        description: 'La memòria externa del producte ja explica què existeix, què és automàtic i què continua sent manual.',
        href: '/admin/manual',
        status: 'ALIGNED',
        signals: ['què hi ha avui', 'automàtic', 'manual', 'frontera'],
      },
    ],
  },
  {
    title: 'Segona onada visual',
    description: 'Pantalles on el criteri s’ha d’estendre, però adaptat al seu tipus de workflow i sense copiar una franja per inèrcia.',
    status: 'SECOND_WAVE',
    items: [
      {
        title: 'Sales Ops',
        description: 'Necessita un cockpit clar de pipeline, colls d’ampolla i disciplina comercial.',
        href: '/admin/sales-ops',
        status: 'SECOND_WAVE',
        signals: ['pipeline', 'dormants', 'SLA', 'colls d’ampolla'],
      },
      {
        title: 'Reporting i finances',
        description: 'Han de mostrar tensió, desviació i decisió executiva abans de taules i gràfiques.',
        href: '/admin/reporting',
        status: 'SECOND_WAVE',
        signals: ['tendència', 'marge', 'desviació', 'decisió'],
      },
      {
        title: 'Crons i Salut',
        description: 'Necessiten semàfor i excepcions crítiques molt més evidents que el detall tècnic.',
        href: '/admin/crons',
        status: 'SECOND_WAVE',
        signals: ['retard', 'error', 'impacte', 'reintents'],
      },
      {
        title: 'Social i portfolio',
        description: 'Han de llegir-se com a màquina de marca activa, no només com a llista de continguts.',
        href: '/admin/social',
        status: 'SECOND_WAVE',
        signals: ['cadència', 'peça següent', 'actius', 'canal'],
      },
      {
        title: 'Editors i configuració',
        description: 'No necessiten la mateixa franja completa, però sí jerarquia visual, estat i CTA principal molt nets.',
        href: '/admin/settings',
        status: 'SECOND_WAVE',
        signals: ['estat', 'impacte', 'canvi sensible', 'CTA principal'],
      },
    ],
  },
];

export const ADMIN_MANUAL_SECTIONS: AdminManualSection[] = [
  {
    icon: '🎯',
    title: 'Captació i vendes',
    summary: 'Tot el que converteix una consulta en oportunitat, pressupost, reserva i diners.',
    capabilities: [
      {
        title: 'Gestionar entrades i prioritzar leads',
        description: 'Veure qui acaba d’entrar, quin risc o potencial té i quin és el següent pas comercial.',
        href: '/admin/leads',
        cta: 'Obrir Entrades',
        tone: 'warning',
        signals: ['estat del lead', 'prioritat', 'temps pendent', 'origen'],
      },
      {
        title: 'Fer seguiment comercial disciplinat',
        description: 'Usar Sales Ops, SLA, seqüències i reengagement per no deixar leads refredar-se.',
        href: '/admin/sales-ops',
        cta: 'Obrir Sales Ops',
        tone: 'info',
        signals: ['SLA', 'seguiment', 'dormants', 'negociació'],
      },
      {
        title: 'Crear pressupostos i convertir-los',
        description: 'Preparar propostes, revisar imports i convertir oportunitats en reserva real.',
        href: '/admin/presupuestos',
        cta: 'Obrir Pressupostos',
        tone: 'success',
        signals: ['proposta', 'import', 'estat', 'client'],
      },
    ],
  },
  {
    icon: '👥',
    title: 'Clients i relacions',
    summary: 'La memòria del negoci: historial, recurrència, preferències, referrals i reactivació.',
    capabilities: [
      {
        title: 'Veure la fitxa 360 del client',
        description: 'Centralitzar reserves, comunicacions, tasques, pressupostos, privacitat i valor del client.',
        href: '/admin/clientes',
        cta: 'Obrir Clients',
        tone: 'info',
        signals: ['historial', 'valor', 'timeline', 'proper pas'],
      },
      {
        title: 'Reactivar clients dormants',
        description: 'Detectar clients amb valor que fa temps que no contacten i preparar accions de retorn.',
        href: '/admin/clientes/reactivation',
        cta: 'Obrir Reactivació',
        tone: 'warning',
        signals: ['dormant', 'VIP', 'últim contacte', 'missatge suggerit'],
      },
      {
        title: 'Aprofitar referrals',
        description: 'Veure qui porta negoci, qui pot recomanar i com convertir clients contents en captació.',
        href: '/admin/clientes/referrals',
        cta: 'Obrir Referrals',
        tone: 'success',
        signals: ['referidor', 'valor generat', 'candidats', 'xarxa'],
      },
    ],
  },
  {
    icon: '📋',
    title: 'Operacions i reserves',
    summary: 'El sistema que evita caos: calendaris, execució, tasques, inventari, marges i capacitat.',
    capabilities: [
      {
        title: 'Controlar reserves actives',
        description: 'Gestionar cada esdeveniment amb estat, documents, cobraments, inventari i checklist.',
        href: '/admin/bookings',
        cta: 'Obrir Reserves',
        tone: 'success',
        signals: ['data', 'estat', 'pack', 'marge'],
      },
      {
        title: 'Veure càrrega i col·lisions',
        description: 'Entendre quants bolos hi ha, on hi ha saturació i si el calendari aguanta.',
        href: '/admin/calendario/capacity',
        cta: 'Obrir Capacitat',
        tone: 'danger',
        signals: ['col·lisions', 'càrrega', 'disponibilitat', 'dies crítics'],
      },
      {
        title: 'Treballar per tasques, no per memòria',
        description: 'Ordenar accions pendents per urgència, estat, prioritat i bloqueig.',
        href: '/admin/tasks',
        cta: 'Obrir Tasques',
        tone: 'warning',
        signals: ['vençut', 'avui', 'bloquejat', 'VIP'],
      },
    ],
  },
  {
    icon: '📣',
    title: 'Comunicació, social i contingut',
    summary: 'La part que fa créixer marca, confiança i recurrència sense perdre coherència.',
    capabilities: [
      {
        title: 'Gestionar inbox i plantilles',
        description: 'Llegir correu, respondre amb context i aprofitar plantilles intel·ligents segons estat.',
        href: '/admin/inbox',
        cta: 'Obrir Inbox',
        tone: 'info',
        signals: ['correu', 'context lead', 'plantilla', 'resposta'],
      },
      {
        title: 'Planificar xarxes socials',
        description: 'Convertir bookings, testimonials i portfolio en contingut planificat i mesurable.',
        href: '/admin/social',
        cta: 'Obrir Social',
        tone: 'success',
        signals: ['post', 'plataforma', 'estat', 'calendari'],
      },
      {
        title: 'Mantenir l’aparador públic',
        description: 'Actualitzar portfolio, blog, ressenyes i imatges perquè el web vengui millor.',
        href: '/admin/portfolio',
        cta: 'Obrir Portfolio',
        tone: 'warning',
        signals: ['casos', 'prova social', 'imatges', 'SEO'],
      },
    ],
  },
  {
    icon: '💶',
    title: 'Finances i decisió',
    summary: 'Marge, cobraments, rendibilitat, pricing i reporting per dirigir el negoci amb números.',
    capabilities: [
      {
        title: 'Controlar salut econòmica',
        description: 'Veure cobraments pendents, rendibilitat i senyals de tresoreria.',
        href: '/admin/economia',
        cta: 'Obrir Finances',
        tone: 'danger',
        signals: ['cobraments', 'marge', 'tresoreria', 'risc'],
      },
      {
        title: 'Llegir reporting executiu',
        description: 'Analitzar facturació, conversió, recurrència, origen i tendència mensual.',
        href: '/admin/reporting',
        cta: 'Obrir Reporting',
        tone: 'info',
        signals: ['facturació', 'conversió', 'origen', 'tendència'],
      },
      {
        title: 'Ajustar pricing i catàleg',
        description: 'Revisar packs, preus, descomptes i oferta perquè la venda mantingui marge.',
        href: '/admin/pricing',
        cta: 'Obrir Preus',
        tone: 'success',
        signals: ['pack', 'preu', 'descompte', 'marge'],
      },
    ],
  },
  {
    icon: '🛠️',
    title: 'Sistema, qualitat i control',
    summary: 'La part que manté la màquina fiable: crons, salut, features, scripts, RGPD i auditoria.',
    capabilities: [
      {
        title: 'Vigilar automatismes i crons',
        description: 'Comprovar que els processos programats funcionen i no queden invisibles.',
        href: '/admin/crons',
        cta: 'Obrir Crons',
        tone: 'warning',
        signals: ['cron', 'última execució', 'estat', 'error'],
      },
      {
        title: 'Controlar salut del sistema',
        description: 'Detectar incidències, avisos i punts febles abans que afectin operativa.',
        href: '/admin/salut',
        cta: 'Obrir Salut',
        tone: 'danger',
        signals: ['incidència', 'alerta', 'check', 'prioritat'],
      },
      {
        title: 'Governar textos, privacitat i features',
        description: 'Mantenir copy, RGPD i activació de funcionalitats sota control.',
        href: '/admin/settings',
        cta: 'Obrir Configuració',
        tone: 'neutral',
        signals: ['settings', 'RGPD', 'features', 'copy'],
      },
    ],
  },
];

export type AdminManualRoadmapPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AdminManualRoadmapStatus = 'PENDING' | 'DONE';

export interface AdminManualRoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: AdminManualRoadmapPriority;
  impact: string;
  effort: string;
  area: string;
  status: AdminManualRoadmapStatus;
  doneCanvi?: number;
  doneNote?: string;
}

export const ADMIN_MANUAL_ROADMAP: AdminManualRoadmapItem[] = [
  {
    id: 'lead-nurturing-engine',
    title: 'Motor de nurturing automàtic de leads',
    description: 'Seqüències automàtiques (dia 1, 3, 7, 14) que envien plantilles personalitzades segons estat i comportament. Ja tenim `nurturingStep` al schema i `inboxTemplateService` — falta el cron + motor.',
    priority: 'CRITICAL',
    impact: 'Recupera 15-25% de leads que no responen al primer contacte.',
    effort: 'Mitjà — servei + cron + UI de seqüències',
    area: 'Captació i vendes',
    status: 'DONE',
    doneNote: '`commercialSequenceService.ts` executa cadència 5 passos (1d/3d/7d/14d/30d) amb email/WA, integrat al cron `commercialDailyAutomation`.',
  },
  {
    id: 'forecast-per-status',
    title: 'Forecast predictiu per estat del pipeline',
    description: 'Substituir el `budget × 0.3` actual per probabilitats reals per estat: NEW 5%, CONTACTED 15%, QUOTE_SENT 35%, NEGOTIATING 60%, WON 100%. Calibrar amb dades històriques.',
    priority: 'HIGH',
    impact: 'Previsió de facturació fiable per decisions de tresoreria i capacitat.',
    effort: 'Baix — actualitzar `dailyBriefService` i `reportingService`',
    area: 'Finances i decisió',
    status: 'DONE',
    doneCanvi: 115,
    doneNote: '`loadDailyBrief` usa `LEAD_SCORING_STATUS_PROBABILITY` per estat en lloc de `budget × 0.3` fix. Ampliat al Canvi #454 amb banda ±1σ a `pipelineForecast`.',
  },
  {
    id: 'command-palette',
    title: 'Command palette global (Cmd+K)',
    description: 'Cercador universal que permet saltar a qualsevol pàgina, lead, client, reserva o acció en <2 segons. Accelera molt la velocitat operativa quan tens 20+ pàgines.',
    priority: 'HIGH',
    impact: 'Redueix clics per tasca al 30-50%. Experiència premium.',
    effort: 'Mitjà — component + índex de cerca',
    area: 'UX transversal',
    status: 'DONE',
    doneCanvi: 380,
    doneNote: 'Base funcional al Canvi #102; lògica extreta a capa pura `adminCommandPaletteService.ts` amb 13 tests al Canvi #380.',
  },
  {
    id: 'ab-testing-templates',
    title: 'A/B testing i mètriques de plantilles d\'email',
    description: 'Per cada plantilla de `inboxTemplateService`, trackejar obertures, clics i respostes. Mostrar quines plantilles funcionen millor per estat i tipus d\'event.',
    priority: 'HIGH',
    impact: 'Optimització contínua del copy comercial basada en dades.',
    effort: 'Mitjà — tracking pixel + dashboard',
    area: 'Comunicació',
    status: 'DONE',
    doneCanvi: 133,
    doneNote: '`emailTrackingService.ts` ampliat amb click tracking (clickedAt/clickCount), link wrapping, report amb best/worst performer. Ruta `/api/tracking/click/[token]`, API `/api/admin/email-tracking`. Migració schema. 33 tests.',
  },
  {
    id: 'attribution-multitouch',
    title: 'Attribution multi-touch del journey',
    description: 'Capturar tots els touchpoints d\'un lead (primer touch, assists, last touch) en comptes de només `lead.source`. Permet decidir bé on invertir en màrqueting.',
    priority: 'HIGH',
    impact: 'Decisions d\'inversió en captació basades en ROI real per canal.',
    effort: 'Alt — schema + tracking + reporting',
    area: 'Captació i vendes',
    status: 'DONE',
    doneCanvi: 131,
    doneNote: '`generateMultiTouchReport` + `loadMultiTouchReport` amb journeys, crèdits per canal (first/assist/last touch), insights i veredicte. Dashboard connectat al model multi-touch (Canvis #128 + #131). 12 tests nous.',
  },
  {
    id: 'lead-scoring-dynamic',
    title: 'Scoring dinàmic automàtic de leads',
    description: 'Score calculat (budget × urgència × tipus d\'event × engagement) que prioritza la cua de feina sola. Reemplaça el `priority` manual amb una heurística.',
    priority: 'MEDIUM',
    impact: 'L\'admin treballa sempre pel lead més prometedor sense pensar-hi.',
    effort: 'Baix — funció pura + columna',
    area: 'Captació i vendes',
    status: 'DONE',
    doneNote: '`commercialScoring.ts` calcula score 0-100 + probabilitat + band. Cron `commercialDailyAutomation` actualitza `cachedScore` diari en lots.',
  },
  {
    id: 'kpi-anomaly-detection',
    title: 'Detector d\'anomalies al Daily Brief',
    description: 'Comparar KPIs actuals vs mitjana 30 dies. Si es desvien >2σ, afegir bandera "això és anormal" (ex: "leads avui: 2 vs mitjana 8 — ⚠️ baix").',
    priority: 'MEDIUM',
    impact: 'Detecció precoç de problemes (tràfic caigut, conversió baixa).',
    effort: 'Baix — agregació + comparació',
    area: 'Executive cockpit',
    status: 'DONE',
    doneCanvi: 115,
    doneNote: '`dailyAnomalyService.ts` compara 5 KPIs vs mitjana 30d, threshold 50%. Panel `AnomalyPanel` al dashboard quan hi ha desviacions.',
  },
  {
    id: 'capacity-conflict-alerts',
    title: 'Alertes de conflicte de capacitat operativa',
    description: 'Quan dos events cauen el mateix dia, avisar de conflictes de staff/inventari crític abans que sigui tard. Creuament amb `calendario/capacity`.',
    priority: 'MEDIUM',
    impact: 'Evita incidències operatives el dia de l\'event.',
    effort: 'Mitjà — servei de detecció + UI',
    area: 'Operacions',
    status: 'DONE',
    doneCanvi: 116,
    doneNote: '`capacityConflictService.ts` detecta col·lisions d\'inventari entre reserves. Panel `CapacityConflictPanel` al dashboard. Alertes integrades al `commercialDailyAutomationService` (Canvi #129).',
  },
  {
    id: 'push-notifications-critical',
    title: 'Notificacions push/email per alertes CRITICAL',
    description: 'Si el Daily Brief té alertes CRITICAL (SLA trencat, pagaments vençuts, follow-ups urgents), enviar push o email diari a les 9h encara que no entris al dashboard.',
    priority: 'MEDIUM',
    impact: 'Cap alerta crítica passa desapercebuda.',
    effort: 'Baix — cron + email template',
    area: 'Executive cockpit',
    status: 'DONE',
    doneCanvi: 115,
    doneNote: '`commercialDailyAutomationService` envia alertes CRITICAL per email i WhatsApp al resum diari. Ampliat amb alertes urgents push pel Canvi #144 (`urgentFollowUpAlertService`).',
  },
  {
    id: 'weekly-benchmark',
    title: 'Benchmark automàtic setmanal',
    description: 'Informe comparatiu setmana vs setmana anterior: leads +12%, conversió -3%, facturació +18%. Email automàtic cada dilluns.',
    priority: 'MEDIUM',
    impact: 'Visibilitat regular de tendències sense entrar al reporting.',
    effort: 'Baix — agregació + email',
    area: 'Reporting',
    status: 'DONE',
    doneCanvi: 126,
    doneNote: 'Servei + ruta + catàleg `ADMIN_CRON_PREFIXES` + job GitHub Actions `daily-crons.yml`. Test de route nou (4 tests) + fix `if:` del job que mai s\'executava.',
  },
  {
    id: 'decision-audit-trail',
    title: 'Audit trail de decisions administratives',
    description: 'Log de qui va perdre un lead i per què (motiu estructurat). Ajuda a auditar patrons de pèrdua i millorar procés comercial.',
    priority: 'LOW',
    impact: 'Aprenentatge continu del pipeline perdut.',
    effort: 'Baix — afegir taula + UI',
    area: 'Captació i vendes',
    status: 'DONE',
    doneCanvi: 408,
    doneNote: 'Backend (#358) + analítica agregada (#360) + endpoint HTTP (#363) + wiring `statusRouteHandler` (#370) + panell `Sales Ops` (#372) + formulari Lead Hub (#375) + bloqueig kanban/llistat (#377) + lectura visual (#383) + migració desplegada a Railway (#408).',
  },
  {
    id: 'marketing-analytics-hub',
    title: 'Marketing Analytics Hub amb integracions externes',
    description: 'Mòdul `/admin/marketing` que connecta amb Google Ads, Meta Ads, Google Analytics 4 i Google Business Profile via API. Mostra per canal: inversió, impressions, clics, cost per lead (CPL), cost per adquisició (CAC), conversió a client, ROI. Diagnostica automàticament: "estàs pagant 40€/lead però només converteixen 1 de 10 — el públic no és el correcte" o "la campanya X té CTR baix — canvia el creative". Recomanació d\'acció concreta basada en regles.',
    priority: 'CRITICAL',
    impact: 'Converteix el màrqueting de "disparar a cegues" a decisió basada en dades. Pots saber exactament quin euro et porta quin client.',
    effort: 'Alt — OAuth + 4 APIs externes + servei d\'anàlisi + UI dashboard + regles de diagnòstic',
    area: 'Captació i vendes',
    status: 'PENDING',
  },
];


export interface AdminMarketingPlaybookItem {
  cadence: string;
  title: string;
  objective: string;
  how: string;
  adminHref: string;
  adminLabel: string;
  signals: string[];
}

export const ADMIN_MARKETING_PLAYBOOK: AdminMarketingPlaybookItem[] = [
  {
    cadence: 'Cada dia',
    title: 'Respondre leads abans que es refredin',
    objective: 'Reduir temps de resposta i pujar conversió dels leads nous.',
    how: 'Entrar a leads, prioritzar calents, usar plantilla de primer contacte i deixar següent acció creada.',
    adminHref: '/admin/leads',
    adminLabel: 'Entrades',
    signals: ['NEW >4h', 'SLA', 'prioritat', 'follow-up'],
  },
  {
    cadence: 'Dilluns',
    title: 'Planificar contingut setmanal',
    objective: 'Arribar a clients nous amb prova social, casos reals i contingut útil.',
    how: 'Crear 3-5 posts: un testimoni, un event recent, un consell, un behind the scenes i una oferta o recordatori.',
    adminHref: '/admin/social',
    adminLabel: 'Social',
    signals: ['posts pendents', 'portfolio nou', 'testimonials', 'calendari'],
  },
  {
    cadence: 'Dimarts',
    title: 'Reactivar oportunitats dormants',
    objective: 'Recuperar leads i clients que ja coneixen la marca però no han tancat.',
    how: 'Filtrar reengagement, enviar missatge curt amb context i crear tasca de seguiment si no responen.',
    adminHref: '/admin/leads/reengagement',
    adminLabel: 'Reengagement leads',
    signals: ['quote no reply', 'negotiation cold', 'long dormant'],
  },
  {
    cadence: 'Dimecres',
    title: 'Demanar ressenyes i referrals',
    objective: 'Convertir clients contents en reputació i nous contactes.',
    how: 'Revisar post-event i clients satisfets, demanar ressenya, detectar referidors i registrar oportunitats.',
    adminHref: '/admin/clientes/referrals',
    adminLabel: 'Referrals',
    signals: ['NPS alt', 'event completat', 'referidor', 'valor generat'],
  },
  {
    cadence: 'Dijous',
    title: 'Revisar canals i ROI',
    objective: 'Entendre què porta negoci i deixar de disparar a cegues.',
    how: 'Mirar reporting, leads per origen, conversió i marge; decidir quin canal reforçar la setmana següent.',
    adminHref: '/admin/reporting',
    adminLabel: 'Reporting',
    signals: ['origen', 'conversió', 'marge', 'tendència'],
  },
  {
    cadence: 'Divendres',
    title: 'Preparar campanya curta',
    objective: 'Sortir al mercat amb una acció concreta: temporada, corporatius, casaments, aniversari o last minute.',
    how: 'Triar segment, missatge, canal i CTA. Millor una campanya petita ben feta que una gran sense seguiment.',
    adminHref: '/admin/campaigns',
    adminLabel: 'Campanyes',
    signals: ['segment', 'lifecycle', 'tags', 'CTA'],
  },
];

// ── Pla de captació per fases — per qui arrenca des de zero ─────────────
export type AdminMarketingPhase = 'FASE_0' | 'FASE_1' | 'FASE_2' | 'FASE_3';

export interface AdminMarketingPhaseAction {
  id: string;
  title: string;
  description: string;
  phase: AdminMarketingPhase;
  cost: string;
  effort: string;
}

export const ADMIN_MARKETING_PHASE_LABEL: Record<AdminMarketingPhase, string> = {
  FASE_0: 'Fase 0 · Fundació',
  FASE_1: 'Fase 1 · Captació gratuïta',
  FASE_2: 'Fase 2 · Captació pagada',
  FASE_3: 'Fase 3 · Sistematització',
};

export const ADMIN_MARKETING_PHASE_SUMMARY: Record<AdminMarketingPhase, string> = {
  FASE_0: 'Abans de gastar res: definir què vens, a qui i com es troba.',
  FASE_1: 'Primers clients sense invertir diners (només temps).',
  FASE_2: 'Escalar amb publicitat quan els orgànics ja funcionin.',
  FASE_3: 'Convertir el negoci en una màquina de captació sostenible.',
};

export const ADMIN_MARKETING_PHASES: AdminMarketingPhaseAction[] = [
  // ── FASE 0 ────────────────────────────────────────────────────────────
  {
    id: 'icp-definition',
    title: 'Definir client ideal (ICP)',
    description: 'Tipus d\'event dominant (bodes, corporatius, festes privades), ubicació, pressupost mig, què busquen. Sense això, cap canal funcionarà.',
    phase: 'FASE_0',
    cost: 'Gratis',
    effort: '2-3 hores de reflexió',
  },
  {
    id: 'value-proposition',
    title: 'Proposta de valor en 1 frase',
    description: 'Format: "Ajudem a [X] a [Y] sense [dolor]". Ha de ser clara i diferencial. Si no la tens, res convencerà.',
    phase: 'FASE_0',
    cost: 'Gratis',
    effort: '1 hora',
  },
  {
    id: 'google-business-profile',
    title: 'Google Business Profile',
    description: 'Fitxa gratuïta amb fotos, horaris, ressenyes. Apareixes a Google Maps quan algú cerca "events [ciutat]". Obligatori i fàcil.',
    phase: 'FASE_0',
    cost: 'Gratis',
    effort: '1 hora configuració',
  },
  {
    id: 'web-optimization',
    title: 'Optimitzar el web actual',
    description: 'Testimonials visibles, galeria de portfolio forta, WhatsApp/form ben clars, pàgina dedicada per cada tipus d\'event principal.',
    phase: 'FASE_0',
    cost: 'Gratis',
    effort: '1-2 setmanes',
  },
  // ── FASE 1 ────────────────────────────────────────────────────────────
  {
    id: 'seo-local-pages',
    title: 'Pàgines SEO locals',
    description: 'Crear pàgines per ciutat + tipus d\'event (`/events-corporatius-barcelona`). Contingut útil real, no spam. Tràfic orgànic gratuït.',
    phase: 'FASE_1',
    cost: 'Gratis',
    effort: '2-4 hores per pàgina',
  },
  {
    id: 'google-reviews',
    title: 'Campanya de ressenyes Google',
    description: 'Demanar ressenya a cada client content (automatitzable amb flux post-event). 10 ressenyes = confiança visible a Maps.',
    phase: 'FASE_1',
    cost: 'Gratis',
    effort: '15 min per client',
  },
  {
    id: 'instagram-organic',
    title: 'Instagram/TikTok orgànic',
    description: '3 posts/setmana de bolos reals: before/after, setup, moments clau. El workspace Social ja està al repo — cal usar-lo.',
    phase: 'FASE_1',
    cost: 'Gratis',
    effort: '2-3 hores/setmana',
  },
  {
    id: 'whatsapp-business',
    title: 'WhatsApp Business',
    description: 'Catàleg de serveis + respostes automàtiques + missatge de benvinguda. Lliure i molt eficaç per captar directament.',
    phase: 'FASE_1',
    cost: 'Gratis',
    effort: '1 hora',
  },
  {
    id: 'personal-network',
    title: 'Activar xarxa personal',
    description: 'Avisar 50 contactes rellevants que el negoci existeix. El primer client real sol venir d\'aquí. No t\'ho saltis.',
    phase: 'FASE_1',
    cost: 'Gratis',
    effort: '1 setmana de missatges',
  },
  {
    id: 'partner-network',
    title: 'Partners estratègics',
    description: 'Contactar restaurants, fotògrafs, DJs, event planners. Comissió o intercanvi. El `referralsService` del CRM ho centralitza.',
    phase: 'FASE_1',
    cost: 'Gratis o comissió',
    effort: '1-2 setmanes',
  },
  // ── FASE 2 ────────────────────────────────────────────────────────────
  {
    id: 'google-ads',
    title: 'Google Ads (Search / Performance Max)',
    description: 'Campanyes amb keywords locals ("empresa events Barcelona"). Pressupost inicial: 150-300€/mes. ROI mesurable al CRM.',
    phase: 'FASE_2',
    cost: '150-300€/mes',
    effort: '1 setmana setup + 30min/setmana',
  },
  {
    id: 'meta-ads',
    title: 'Meta Ads (Instagram/Facebook)',
    description: 'Anuncis a públic local interessat en events. Carousel amb portfolio real. Format visual que funciona molt bé.',
    phase: 'FASE_2',
    cost: '200-400€/mes',
    effort: '1 setmana setup + 1h/setmana',
  },
  {
    id: 'remarketing',
    title: 'Remarketing visitants web',
    description: 'Qui visita el web sense contactar, re-impactar 7 dies a Instagram/Google. Molt barat i efectiu (ja tenen intent).',
    phase: 'FASE_2',
    cost: '50-100€/mes',
    effort: '2-3 hores setup',
  },
  // ── FASE 3 ────────────────────────────────────────────────────────────
  {
    id: 'content-marketing',
    title: 'Content marketing / Blog',
    description: 'Articles tipus "Com organitzar un event corporatiu" o "10 errors en una boda". Tràfic orgànic constant a llarg termini.',
    phase: 'FASE_3',
    cost: 'Gratis (temps)',
    effort: '3-4 hores per article',
  },
  {
    id: 'email-marketing',
    title: 'Email màrqueting / Newsletter',
    description: 'Newsletter trimestral a clients anteriors + prospects. El `inboxTemplateService` ja serveix com a base.',
    phase: 'FASE_3',
    cost: 'Gratis (fins a cert volum)',
    effort: '2-3 hores per newsletter',
  },
  {
    id: 'referral-program',
    title: 'Programa de referrals actiu',
    description: 'El que tens a `/admin/clientes/referrals` — activar-lo amb incentiu real (descompte, servei extra, regal).',
    phase: 'FASE_3',
    cost: 'Cost de l\'incentiu',
    effort: '1 setmana definició',
  },
  {
    id: 'formal-partnerships',
    title: 'Partnerships formals',
    description: 'Acords signats amb 3-5 partners clau que porten leads regularment. Contracte clar, comissions acordades.',
    phase: 'FASE_3',
    cost: 'Comissions',
    effort: '1 mes negociació',
  },
];

// ── Mètriques de màrqueting ─────────────────────────────────────────────
export interface AdminMarketingMetric {
  name: string;
  description: string;
}

export const ADMIN_MARKETING_METRICS: AdminMarketingMetric[] = [
  {
    name: 'CAC (Customer Acquisition Cost)',
    description: 'Cost d\'aconseguir un client per canal. Sense mesurar-ho, no saps on invertir. Fórmula: despesa del canal / clients aconseguits del canal.',
  },
  {
    name: 'LTV (Lifetime Value)',
    description: 'Valor d\'un client al llarg del temps. Ja el calcula `customerInsightsService` (integrat a `/admin/clientes/[id]`).',
  },
  {
    name: 'Ratio LTV:CAC',
    description: 'Ha de ser >3 per ser rendible. Si és <2, el canal no funciona. Entre 3 i 5 és saludable. >5 probablement estàs infrainvertint.',
  },
  {
    name: 'Attribution per canal',
    description: 'Quin canal porta quins leads. Millor canal = més inversió. Encara no està implementat al CRM (veure §6.15 HIGH).',
  },
];

// ── Criteri de canals i Google Ads ──────────────────────────────────────
export type AdminMarketingChannelPriority = 'OBLIGATORI' | 'FORT' | 'CONDICIONAL' | 'MES_ENDAVANT';

export interface AdminMarketingChannel {
  platform: string;
  priority: AdminMarketingChannelPriority;
  role: string;
  whenToUse: string;
  whatToMeasure: string[];
  nextAction: string;
}

export const ADMIN_MARKETING_CHANNEL_PRIORITY_LABEL: Record<AdminMarketingChannelPriority, string> = {
  OBLIGATORI: 'Obligatori',
  FORT: 'Prioritat forta',
  CONDICIONAL: 'Condicional',
  MES_ENDAVANT: 'Més endavant',
};

export const ADMIN_MARKETING_CHANNELS: AdminMarketingChannel[] = [
  {
    platform: 'Google Business Profile',
    priority: 'OBLIGATORI',
    role: 'Captació local gratuïta i confiança immediata a Google Maps.',
    whenToUse: 'Sempre. És el primer lloc on mirarà molta gent quan cerqui serveis d\'events a prop.',
    whatToMeasure: ['trucades', 'clics web', 'rutes', 'ressenyes', 'posició local'],
    nextAction: 'Completar fitxa, fotos reals, categories correctes i demanar ressenyes després de cada event.',
  },
  {
    platform: 'Google Ads Search',
    priority: 'FORT',
    role: 'Capturar gent amb intenció activa: ja està buscant DJ, discomòbil, events o serveis per empresa.',
    whenToUse: 'Quan el web/form/WhatsApp ja converteix mínimament i pots mesurar leads per campanya.',
    whatToMeasure: ['impressions', 'CTR', 'CPC', 'leads', 'CPA', 'qualitat del lead'],
    nextAction: 'Començar petit, keywords locals i d\'alta intenció, negatives fortes i UTM obligatori.',
  },
  {
    platform: 'Instagram / Facebook orgànic',
    priority: 'FORT',
    role: 'Marca, prova social i confiança visual. La gent compra millor si veu events reals.',
    whenToUse: 'Cada setmana, sobretot amb material de bolos, testimonials, setups i moments humans.',
    whatToMeasure: ['posts publicats', 'saves', 'respostes', 'clics a WhatsApp', 'leads amb origen social'],
    nextAction: 'Publicar 3-5 peces/setmana des de Social i reutilitzar portfolio/testimonials.',
  },
  {
    platform: 'Meta Ads',
    priority: 'CONDICIONAL',
    role: 'Demanda latent i remarketing visual: impactar gent local que encara no està buscant activament.',
    whenToUse: 'Quan tens creativitats bones i una oferta clara. Especialment útil per remarketing.',
    whatToMeasure: ['CPM', 'CTR', 'clics', 'leads', 'CPA', 'comentaris/missatges'],
    nextAction: 'Primer remarketing a visitants web; després públics locals per tipus d\'event.',
  },
  {
    platform: 'WhatsApp Business',
    priority: 'OBLIGATORI',
    role: 'Canal de conversió ràpida i fricció baixa. Molts leads no volen formularis llargs.',
    whenToUse: 'Sempre, connectat al web, fitxa Google, Instagram i plantilles de resposta.',
    whatToMeasure: ['clics WhatsApp', 'temps resposta', 'converses', 'reserves tancades'],
    nextAction: 'Catàleg, missatge benvinguda, etiquetes i tracking UTM/click quan sigui possible.',
  },
  {
    platform: 'SEO local i blog',
    priority: 'FORT',
    role: 'Captació gratuïta a llarg termini per ciutat, tipus d\'event i dubtes habituals.',
    whenToUse: 'Sempre que hi hagi capacitat de crear pàgines útils, no spam.',
    whatToMeasure: ['impressions Search Console', 'clics orgànics', 'posició', 'leads orgànics'],
    nextAction: 'Crear pàgines locals i articles útils connectats a packs, portfolio i CTA.',
  },
  {
    platform: 'TikTok / Reels curt',
    priority: 'CONDICIONAL',
    role: 'Abast barat i descoberta de marca si hi ha vídeo real i ritme de publicació.',
    whenToUse: 'Només si tens material visual constant i pots mantenir format vertical.',
    whatToMeasure: ['views', 'retenció', 'comentaris', 'clics perfil', 'leads atribuïts'],
    nextAction: 'Provar clips curts de muntatge, abans/després, errors comuns i moments de festa.',
  },
  {
    platform: 'Partners i referrals',
    priority: 'OBLIGATORI',
    role: 'Canal de confiança: restaurants, fotògrafs, DJs, planners, escoles i empreses locals.',
    whenToUse: 'Sempre. És menys escalable que ads però sovint converteix millor.',
    whatToMeasure: ['partners actius', 'leads referits', 'conversió', 'marge', 'comissió'],
    nextAction: 'Crear 10 contactes prioritaris i fer seguiment mensual al CRM/referrals.',
  },
];

export interface AdminGoogleAdsDecisionRule {
  metric: string;
  question: string;
  green: string;
  warning: string;
  danger: string;
  action: string;
}

export const ADMIN_GOOGLE_ADS_DECISION_RULES: AdminGoogleAdsDecisionRule[] = [
  {
    metric: 'Impressions i entrega',
    question: 'S\'està arribant a prou gent amb la pasta que hi poses?',
    green: 'La campanya gasta pressupost de forma estable i acumula impressions suficients per aprendre.',
    warning: 'Gasta poc o té poques impressions: segment, keywords o ubicació massa estrets.',
    danger: 'No entrega o quasi no gasta: revisar aprovacions, keywords, puja màxima, zona i configuració.',
    action: 'Si no hi ha impressions, no escalis pressupost: arregla entrega abans.',
  },
  {
    metric: 'CTR',
    question: 'La gent fa clic quan veu l\'anunci?',
    green: '>6% en Search local d\'alta intenció.',
    warning: '3-6%: acceptable però millorable.',
    danger: '<3%: missatge, keyword o oferta no encaixen.',
    action: 'Reescriure titulars, fer anuncis més locals i separar grups per intenció.',
  },
  {
    metric: 'CPC',
    question: 'Cada visita costa massa?',
    green: 'CPC assumible respecte marge esperat i CPA objectiu.',
    warning: 'CPC alt però amb leads bons: optimitzar qualitat i negatives.',
    danger: 'CPC alt i sense leads: pausar keywords cares o massa genèriques.',
    action: 'Prioritzar long-tail local, keywords d\'event concret i negatives agressives.',
  },
  {
    metric: 'Conversió landing',
    question: 'Els clics es converteixen en leads?',
    green: '>5% de clics acaben en lead.',
    warning: '2-5%: revisar CTA, confiança, formulari i WhatsApp.',
    danger: '<2%: el problema és landing/oferta/tracking, no només Ads.',
    action: 'Millorar hero, prova social, packs, CTA visible, formulari curt i WhatsApp.',
  },
  {
    metric: 'CPA / CPL',
    question: 'Quant costa cada lead i si surt a compte?',
    green: 'Per sota del CPA objectiu definit per marge.',
    warning: '1-1,5x CPA objectiu: optimitzar abans d\'escalar.',
    danger: '>1,5x CPA objectiu: pausar o replantejar campanya.',
    action: 'Definir CPA objectiu inicial com 5-10% del marge brut esperat per reserva.',
  },
  {
    metric: 'Qualitat del lead',
    question: 'Els leads que arriben són bons o només omplen formulari?',
    green: 'Leads amb pressupost, data, ubicació i intenció clara.',
    warning: 'Molts leads incomplets o freds.',
    danger: 'Leads sense pressupost, fora zona o sense encaix.',
    action: 'Afegir negatives, formulari amb qualificació i copy que filtri millor.',
  },
  {
    metric: 'ROI / marge atribuït',
    question: 'La inversió torna diners reals?',
    green: 'Canal amb reserves i marge atribuït per sobre del cost.',
    warning: 'Hi ha leads però no està clara l\'atribució.',
    danger: 'Es gasta sense saber quins clients venen del canal.',
    action: 'Arreglar UTM, origen, first/last touch i reporting abans d\'augmentar pressupost.',
  },
];
export const ADMIN_MANUAL_AUDIT_CATEGORIES = [
  'overflow i contenidors',
  'hardcoded visual',
  'copy visible mal ubicat',
  'enums interns visibles',
  'mojibake',
  'duplicació de domini',
  'capes barrejades',
  'responsive fals',
  'accessibilitat',
  'semàfors incoherents',
  'estats buits pobres',
  'accions confuses',
  'tests absents',
  'migracions arriscades',
  'performance visual',
  'noms legacy',
  'docs/checklist desfasats',
] as const;
