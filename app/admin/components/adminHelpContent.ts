export type HelpCopy = {
  title: string;
  desc: string;
};

export function helpAttrs(help?: HelpCopy) {
  if (!help) return {};

  return {
    'data-help-title': help.title,
    'data-help-desc': help.desc,
  };
}

export const ADMIN_LAYOUT_HELP = {
  menuButton: {
    title: 'Menú admin',
    desc: 'Obre la navegació principal de l\'admin per canviar ràpidament de secció.',
  },
  helpToggle: {
    title: 'Mode ajuda',
    desc: 'Activa un mode d\'inspecció que bloqueja accions i explica què fa cada peça important de l\'admin.',
  },
  search: {
    title: 'Cerca global',
    desc: 'Obre el cercador ràpid per localitzar pantalles, registres o accions sense navegar manualment.',
  },
  notifications: {
    title: 'Notificacions',
    desc: 'Mostra avisos pendents i accessos ràpids a incidències o tasques que requereixen atenció.',
  },
  settings: {
    title: 'Configuració',
    desc: 'Accés al compte admin i a la configuració general del sistema.',
  },
  closeMenu: {
    title: 'Tancar menú',
    desc: 'Tanca el menú lateral mòbil i torna al contingut principal de la pantalla actual.',
  },
  quickActionsFab: {
    title: 'Obrir accions ràpides',
    desc: 'Desplega accessos freqüents per crear o consultar elements sense sortir de la pantalla actual.',
  },
  quickActionsGroup: {
    title: 'Accions ràpides',
    desc: 'Agrupa accessos directes per crear o obrir accions freqüents de l\'admin sense passar per la navegació completa.',
  },
  navSection(title: string): HelpCopy {
    return {
      title,
      desc: 'Desplega o plega aquest grup de navegació per veure les pantalles relacionades d\'aquesta àrea.',
    };
  },
};

export const ADMIN_SHARED_HELP = {
  quickActionsPanel: {
    title: 'Accions ràpides',
    desc: 'Des d\'aquí pots executar accions freqüents sense canviar de secció: escriure, revisar entrades o llançar automatismes puntuals.',
  },
  openAutomations: {
    title: 'Obrir correus automàtics',
    desc: 'T\'envia a la secció on controles automatismes, plantilles i seguiment dels correus del sistema.',
  },
  composeEmail: {
    title: 'Nou email',
    desc: 'Obre el redactor per enviar un correu manual des de la safata administrativa.',
  },
  viewLeads: {
    title: 'Veure entrades',
    desc: 'Et porta al tauler comercial per revisar consultes i oportunitats en curs.',
  },
  runPostEvent: {
    title: 'Executar post-event',
    desc: 'Llança manualment el flux automàtic de correus post-esdeveniment si no vols esperar el cron programat.',
  },
  runAll: {
    title: 'Executar-ho tot',
    desc: 'Dispara els principals automatismes de seguiment i SLA en una sola acció.',
  },
  runDailySummary: {
    title: 'Resum diari ara',
    desc: 'Força l\'enviament del resum diari amb mètriques i activitat sense esperar l\'execució programada.',
  },
  searchModal: {
    title: 'Cercador admin',
    desc: 'Permet trobar ràpidament entrades, reserves i clients des de qualsevol punt del panell.',
  },
  searchInput: {
    title: 'Camp de cerca',
    desc: 'Escriu com a mínim dos caràcters per buscar registres rellevants dins l\'admin.',
  },
  recentItems: {
    title: 'Visitats recentment',
    desc: 'Recupera accessos recents sense haver de repetir la cerca o navegar de nou.',
  },
  recentItem(type: string): HelpCopy {
    return {
      title: `Recent: ${type}`,
      desc: 'Obre un element visitat fa poc per reprendre feina ràpidament.',
    };
  },
  searchResult(type: string): HelpCopy {
    return {
      title: type,
      desc: 'Obre directament aquest resultat i el deixa registrat com a accés recent al cercador.',
    };
  },
  confirmDialog: {
    title: 'Confirmació',
    desc: 'Aquest diàleg bloqueja l\'acció fins que decideixis si vols continuar o cancel·lar-la.',
  },
  confirmCancel: {
    title: 'Cancel·lar',
    desc: 'Tanca el diàleg sense executar cap canvi.',
  },
  confirmAccept: {
    title: 'Confirmar',
    desc: 'Executa l\'acció demanada quan estiguis segur que vols continuar.',
  },
  statusQuickSelect(title: string): HelpCopy {
    return {
      title,
      desc: 'Canvia l\'estat directament des de la llista sense haver d\'obrir la fitxa completa.',
    };
  },
  pipelineBoard: {
    title: 'Tauler kanban',
    desc: 'Organitza elements per columnes d\'estat i permet moure\'ls ràpidament entre fases.',
  },
  pipelineColumn(label: string): HelpCopy {
    return {
      title: label,
      desc: 'Aquesta columna agrupa els elements que es troben en aquesta fase del flux.',
    };
  },
};

export const ADMIN_DASHBOARD_HELP = {
  analyticsButton: 'Obre els informes detallats del negoci: ingressos, conversió, canals i rendiment.',
  newLeadButton: 'Crea manualment una entrada nova quan una consulta no ha arribat sola des de la web o el correu.',
  quickLinks: {
    inbox: { title: 'Inbox (IMAP)', desc: 'Centralitza els correus entrants per convertir-los en leads, seguir converses i no deixar cap consulta sense resposta.' },
    emails: { title: 'Correus automàtics', desc: 'Gestiona les seqüències automàtiques i els enviaments operatius abans i després dels esdeveniments.' },
    bookings: { title: 'Reserves', desc: 'Obre el tauler complet de reserves per revisar estats, preparar esdeveniments i seguir cobraments.' },
    overdue: { title: 'Cobraments vençuts', desc: 'Filtra directament les reserves amb pagaments que ja haurien d\'haver entrat i requereixen seguiment.' },
    dueSoon: { title: 'Cobraments que vencen aviat', desc: 'Mostra les reserves amb pagaments a punt de vèncer per poder anticipar recordatoris.' },
    economy: { title: 'Economia', desc: 'Accedeix a la visió financera: factures, pressupostos, fluxos i marge del negoci.' },
    health: { title: 'Salut', desc: 'Revisa alertes i incidències del sistema, dades, automatitzacions i operativa general.' },
    calendar: { title: 'Calendari', desc: 'Consulta l\'agenda d\'esdeveniments i planifica el volum de feina dels pròxims dies.' },
  },
  revenueGoal: { title: "Objectiu mensual d'ingressos", desc: 'Resumeix quant has facturat aquest mes respecte de l\'objectiu configurat. T\'ajuda a veure si vas per sota, en línia o per sobre del ritme previst.' },
  pilot: { title: "Pilot automàtic d'avui", desc: 'És una ruta guiada per a un usuari novell: primer entrades, després tasques, post-esdeveniment i finalment reserves. Pots saltar passos si ja saps què toca.' },
  startStep2: { title: 'Comença pel pas 2', desc: 'Et porta directament a tasques si ja has resolt les entrades i vols avançar feina operativa.' },
  startStep3: { title: 'Comença pel pas 3', desc: 'Et porta a correus automàtics si vols tancar la part post-esdeveniment sense seguir l\'ordre complet.' },
  checklist: { title: "Checklist d'avui", desc: 'Concentra les tasques diàries obertes i el progrés del dia. Serveix per no perdre el fil operatiu.' },
  commandCenter: { title: 'Centre de comandament', desc: 'Permet moure estats clau de leads i reserves sense entrar a cada fitxa. És per operativa ràpida des del dashboard.' },
  executionRadar: { title: "Radar d'execució", desc: 'Resumeix en semàfors on hi ha urgència real: leads aturats, oportunitats calentes i pressupostos en curs.' },
  businessHealth: { title: 'Salut del negoci', desc: 'Resumeix les incidències i avisos més urgents del negoci perquè sàpigues què revisar primer.' },
  monitoredAreas: { title: 'Àrees monitorades', desc: 'Cada targeta resumeix una àrea clau. El color i el número indiquen si hi ha punts crítics, avisos o si tot està correcte.' },
  priorityIssues: { title: 'Incidències prioritàries', desc: 'Mostra els problemes més importants detectats ara mateix, ordenats per gravetat.' },
  openHealth: { title: 'Obrir Salut', desc: 'Entra a la vista completa de Salut per veure totes les incidències i filtrar-les amb detall.' },
  cards: {
    traffic30d: "Mostra l'evolució recent del trànsit web per veure si hi ha moviment d'audiència i captació.",
    leadsConversion: 'Compara el volum d\'entrades amb els tancaments per entendre el rendiment comercial del període.',
    bookingsRevenue: "Relaciona reserves confirmades i facturació per veure si la càrrega d'esdeveniments s'està convertint en ingressos.",
    monthlyRevenue: "Compara els ingressos mensuals d'aquest any amb l'anterior per detectar tendències i estacionalitat.",
    eventMix: 'Desglossa quins tipus d\'esdeveniment tens més presents al negoci. Ajuda a veure especialització i dependència.',
    activity: "Recull els últims moviments registrats a l'admin per entendre què s'ha fet recentment.",
  },
  miniCards: {
    conversion: { title: 'Conversió', desc: 'Percentatge de leads que acaben convertint-se en client. És una lectura ràpida de qualitat comercial.' },
    testimonials: { title: 'Testimonis', desc: 'Resumeix quants testimonis tens publicats o pendents d\'aprovar. Serveix per cuidar reputació i prova social.' },
    rating: { title: 'Valoració', desc: 'Mostra la puntuació mitjana actual del negoci com a lectura ràpida de reputació.' },
    inventory: { title: 'Inventari', desc: 'Resumeix l\'estat ràpid del material: disponible, en ús, en manteniment o avariat.' },
  },
  recentAudit: { title: 'Auditoria recent', desc: "Mostra les últimes accions administratives registrades per saber què s'ha canviat i quan." },
};

export const ADMIN_ANALYTICS_HELP = {
  kpis: {
    leads7d: 'Nombre de leads nous rebuts en els últims 7 dies per tots els canals (web, email, telèfon, etc.).',
    toQuote: 'Percentatge de leads que han avançat fins a rebre un pressupost. Indica la qualitat del filtratge inicial.',
    acceptedQuotes: 'Dels pressupostos enviats, quants s\'han acceptat. Una ràtio alta indica bona proposta de valor.',
    firstContact: 'Temps mitjà entre que entra un lead i es fa el primer contacte. Menys de 4h és excel·lent.',
  },
};

export const ADMIN_SALUT_HELP = {
  filters: { title: 'Filtres de salut', desc: 'Et deixen centrar-te només en crítics, avisos o un focus concret com inventari, packs, extres, leads, reserves o tasques.' },
  priorities: { title: "Prioritat d'avui", desc: 'Resumeix els tres punts més urgents perquè sàpigues per on començar sense llegir tota la pàgina.' },
};


export const ADMIN_ACTIONS_HELP = {
  booking: {
    status: { title: 'Canviar estat reserva', desc: "Actualitza l'estat de la reserva sense obrir la fitxa completa." },
    calendar: { title: 'Calendari', desc: "Obre el calendari situat al dia de l'esdeveniment per veure context i càrrega." },
    customer: { title: 'Client', desc: 'Obre la fitxa del client vinculat per revisar historial, comunicacions i dades associades.' },
    view: { title: 'Veure reserva', desc: 'Entra a la reserva per treballar amb tot el detall operatiu, econòmic i documental.' },
    remove: { title: 'Eliminar reserva', desc: "Esborra la reserva quan l'estat ho permet. És una acció delicada i irreversible." },
  },
  lead: {
    status: { title: 'Canviar estat lead', desc: "Mou l'entrada a una altra fase comercial sense entrar a la fitxa completa." },
    priority: { title: 'Canviar prioritat', desc: 'Canvia la prioritat per reflectir urgència comercial o importància operativa.' },
    whatsapp: { title: 'Enviar WhatsApp', desc: 'Obre una conversa de WhatsApp amb un missatge inicial per contactar ràpidament el lead.' },
    view: { title: 'Veure lead', desc: 'Entra a la fitxa completa del lead per revisar context, notes i accions.' },
    remove: { title: 'Eliminar entrada', desc: "Elimina un lead quan ja no s'ha de conservar i no té reserva vinculada." },
    error: { title: "Error d'acció", desc: "Mostra per què una acció no s'ha pogut executar i et deixa tancar l'avís." },
    removeBlockedBooking: 'No es pot eliminar una entrada amb reserva associada',
    removeBlockedStatus: 'Canvia a "Perdut" per poder eliminar',
    whatsappTitle: 'Envia per WhatsApp',
  },
  dashboardWidget: {
    metricCard(title: string, desc?: string) {
      return { title, desc: desc || "Mostra un indicador resum del negoci perquè puguis detectar canvis o prioritats d'un cop d'ull." };
    },
    card(title: string, desc?: string) {
      return { title, desc: desc || 'Agrupa una lectura del dashboard amb el context mínim necessari per interpretar-la ràpidament.' };
    },
    button(label: string, desc?: string) {
      return { title: label, desc: desc || 'Executa o obre una acció relacionada des del dashboard.' };
    },
  },
};

export const ADMIN_PIPELINE_HELP = {
  booking: {
    board: {
      title: 'Pipeline de reserves',
      desc: "Mostra totes les reserves actives per fase operativa i et permet moure-les d'estat sense entrar a cada fitxa.",
    },
    metrics: {
      title: 'Mètriques de reserves',
      desc: "Cada targeta resumeix quantes reserves hi ha en una fase i quin import acumulen dins del pipeline.",
    },
    hiddenCancelled: {
      title: 'Cancel·lades ocultes',
      desc: "Les reserves cancel·lades queden fora del kanban principal per no contaminar l'operativa activa.",
    },
    mobileColumnPicker: {
      title: 'Indicador de columna mòbil',
      desc: 'En mòbil et deixa saltar entre columnes del kanban i saber quina tens centrada.',
    },
    kanban: {
      title: 'Kanban de reserves',
      desc: "Tauler operatiu per seguir l'estat de cada reserva i reordenar-la segons l'avanç real.",
    },
    card(reference: string, clientName: string): HelpCopy {
      return {
        title: reference,
        desc: `Reserva de ${clientName}. Pots obrir-la, revisar imports i moure-la a un altre estat.`,
      };
    },
    moveTo(label: string): HelpCopy {
      return {
        title: `Moure a ${label}`,
        desc: "Canvia la reserva a l'estat indicat sense sortir del tauler.",
      };
    },
  },
  lead: {
    board: {
      title: 'Pipeline de leads',
      desc: "Aquest tauler et permet veure en quin punt comercial està cada entrada i moure-la d'estat sense entrar a la fitxa.",
    },
    localFilters: {
      title: 'Filtres locals del pipeline',
      desc: 'Serveixen per reduir el soroll dins del pipeline actual sense tocar els filtres generals de la pàgina.',
    },
    search: {
      title: 'Cercador del pipeline',
      desc: 'Filtra entrades per nom, email o telèfon dins del pipeline que ja tens carregat.',
    },
    chips: {
      title: 'Xips de filtre del pipeline',
      desc: "Activen filtres ràpids per prioritat, tipus d'esdeveniment i origen de la consulta.",
    },
    clearLocalFilters: {
      title: 'Netejar filtres locals',
      desc: 'Treu tots els filtres locals del pipeline i torna a mostrar totes les entrades carregades.',
    },
    summary: {
      title: 'Resum del pipeline',
      desc: 'Indica quantes entrades estàs veient ara i, si hi ha filtres locals, quantes queden fora de la vista.',
    },
    kanban: {
      title: 'Tauler kanban de leads',
      desc: 'Arrossega o fes servir els controls de canvi per moure una entrada entre columnes comercials.',
    },
    metrics: {
      title: 'Mètriques del pipeline',
      desc: "Resumeixen el nombre d'entrades obertes, guanyades, perdudes i la taxa de tancament.",
    },
    card(name: string, label: string): HelpCopy {
      return {
        title: name,
        desc: `Lead en estat ${label}. Pots obrir la fitxa o moure'l a la fase anterior o següent.`,
      };
    },
    moveTo(label: string): HelpCopy {
      return {
        title: `Moure a ${label}`,
        desc: "Canvia el lead a la fase comercial indicada sense obrir-ne la fitxa.",
      };
    },
    qualityScore: {
      title: 'Score de qualitat',
      desc: "Puntuació orientativa del lead segons completitud i senyals comercials útils per prioritzar.",
    },
  },
};

export const ADMIN_ECONOMY_HELP = {
  kpiCard(label: string, sub?: string): HelpCopy {
    return {
      title: label,
      desc: sub || "Targeta resum d'economia amb una mètrica clau per llegir l'estat financer d'un cop d'ull.",
    };
  },
  progressBar: {
    title: 'Barra de progrés',
    desc: "Mostra l'avanç percentual d'un objectiu o import respecte del màxim disponible.",
  },
  healthScore: {
    title: 'Salut financera',
    desc: "Combina marge i cobrament pendent per donar una lectura ràpida de la salut econòmica del negoci.",
  },
  healthLabel(label: string): HelpCopy {
    return {
      title: label,
      desc: "Valoració qualitativa de la salut financera segons el marcador actual.",
    };
  },
  tabs: {
    title: 'Pestanyes d\'economia',
    desc: 'Canvien la vista entre resum, cobraments, rendibilitat, tresoreria, previsions i configuraci├│ econ├▓mica.',
  },
  summaryGuide: {
    title: 'Com llegir el resum',
    desc: 'Explica r├ápidament qu├¿ vol dir cada indicador principal de cobrament per a un usuari que comen├ºa.',
  },
  paymentTimeline: {
    title: 'Progrés de cobrament',
    desc: 'Divideix cada reserva entre dipòsit i resta per veure què està pagat, pendent, vençut o proper a venciment.',
  },
  paymentTimelineSegment(label: string): HelpCopy {
    return {
      title: label,
      desc: 'Mostra la part del cobrament que correspon a aquest tram del pagament i el seu estat.',
    };
  },
  filters: {
    title: 'Filtres de cobraments',
    desc: 'Serveixen per buscar reserves i reduir la llista a pendents, vençuts, pròxims o pagats.',
  },
  search: {
    title: 'Cerca de cobraments',
    desc: 'Filtra la taula per referència o nom del client dins de la vista actual de cobraments.',
  },
  exportCsv: {
    title: 'Exportar CSV',
    desc: 'Descarrega els cobraments visibles amb els filtres actuals per treballar-los fora de l\'admin.',
  },
  filterChip(label: string): HelpCopy {
    return {
      title: label,
      desc: "Activa aquesta vista ràpida de cobraments per centrar-te en l'estat indicat.",
    };
  },
  bulkActions: {
    title: 'Accions massives de cobraments',
    desc: 'Apareixen quan tens files seleccionades i permeten marcar pagaments en bloc.',
  },
  bulkDeposit: {
    title: 'Marcar dipòsit pagat',
    desc: 'Marca com a cobrat el dipòsit de totes les reserves seleccionades.',
  },
  bulkRemaining: {
    title: 'Marcar resta pagada',
    desc: 'Marca com a cobrat el pagament final de totes les reserves seleccionades.',
  },
  clearSelection: {
    title: 'Netejar selecció',
    desc: 'Treu la selecció actual sense modificar cap pagament.',
  },
  topMargins: {
    title: 'Top marges',
    desc: 'Mostra els esdeveniments amb millor marge perquè puguis detectar què està funcionant millor econòmicament.',
  },
  table: {
    title: 'Taula de cobraments',
    desc: 'Mostra les reserves visibles amb el seu progrés de cobrament i accessos ràpids a la fitxa.',
  },
  rowLink(reference: string): HelpCopy {
    return {
      title: reference,
      desc: 'Obre la reserva associada per revisar-ne el detall econòmic i operatiu.',
    };
  },
};



export const ADMIN_TASKS_HELP = {
  viewToggle: {
    title: 'Canvi de vista de tasques',
    desc: 'Kanban per moure feina ràpidament entre estats. Llista per revisar cada tasca amb més detall i context.',
  },
  kanban: {
    title: 'Kanban de tasques',
    desc: "Vista visual de tasques organitzades per estat. Arrossega per canviar estat o clica per obrir el detall.",
  },
  filters: {
    title: 'Filtres de tasques',
    desc: "Serveixen per quedar-te només amb l'estat que vols revisar abans d'entrar al detall.",
  },
  list: {
    title: 'Llistat de tasques',
    desc: 'Cada fila representa una tasca operativa i et deixa saltar al client o lead relacionat i canviar-ne l’estat.',
  },
  pagination: {
    title: 'Paginació de tasques',
    desc: 'Permet navegar per totes les tasques quan la llista no cap en una sola pàgina.',
  },
  previousPage: {
    title: 'Pàgina anterior',
    desc: 'Torna a la pàgina anterior de la llista actual de tasques.',
  },
  nextPage: {
    title: 'Pàgina següent',
    desc: 'Avança a la pàgina següent de la llista actual de tasques.',
  },
  newTask: {
    title: 'Nova tasca',
    desc: 'Obre el formulari per crear una nova tasca i vincular-la si cal a un client o lead.',
  },
};


export const ADMIN_INVENTORY_HELP = {
  viewToggle: {
    title: "Vista d'inventari",
    desc: 'Permet canviar entre llista i graella segons si vols revisar molt detall o escanejar visualment l’equip.',
  },
  newItem: {
    title: 'Nou element',
    desc: 'Obre el formulari per donar d’alta una nova peça d’inventari amb categoria, estat i valor.',
  },
  summary: {
    title: "Resum d'inventari",
    desc: 'KPIs ràpids: total d’elements, disponibles, en ús i valor total invertit en equip.',
  },
  bundles: {
    title: 'Equips i lots',
    desc: "Agrupa elements d'inventari en lots (equip de so, pack llums, etc.) per preparar events ràpidament.",
  },
  lowStock: {
    title: "Alerta d'estoc baix",
    desc: 'Consumibles que han arribat al mínim d’estoc configurat. Convé fer comanda o revisar disponibilitat.',
  },
  filters: {
    title: "Cerca i filtres d'inventari",
    desc: 'Filtra per text, categoria o estat per reduir el llistat i trobar equip concret més ràpidament.',
  },
  grid: {
    title: "Graella d'inventari",
    desc: 'Vista visual de les peces amb foto, estat, valor i vida útil estimada.',
  },
  mobileList: {
    title: "Llistat mòbil d'inventari",
    desc: 'Cada targeta resumeix un equip i permet canviar-ne l’estat o obrir la fitxa completa des del mòbil.',
  },
  desktopTable: {
    title: "Taula d'inventari",
    desc: "Vista d'escriptori amb codi, categoria, valor, vida útil, estat i accés directe a la fitxa de cada element.",
  },
  resetFilters: {
    title: 'Netejar filtres',
    desc: 'Treu cerca, categoria i estat per tornar a veure tot l’inventari sense restriccions.',
  },
};

export const ADMIN_CUSTOMERS_LIST_HELP = {
  search: {
    title: 'Cercador de clients',
    desc: 'Troba clients per nom, email, telèfon, Instagram o codi de descompte sense recórrer tot el llistat.',
  },
  toolbar: {
    title: 'Accions de clients',
    desc: "Des d'aquí pots exportar el CRM o crear un client nou manualment.",
  },
  addCustomer: {
    title: 'Afegir client',
    desc: 'Obre el formulari per crear un client manualment i començar a treballar-lo dins del CRM.',
  },
  priorityFilters: {
    title: 'Filtres per prioritat',
    desc: 'Ordenen els clients segons urgència operativa o valor de seguiment.',
  },
  mobileList: {
    title: 'Llistat mòbil de clients',
    desc: 'Mostra cada client en format targeta amb prioritat, proper pas i accessos ràpids.',
  },
  mobileCard(name: string, priority: string): HelpCopy {
    return {
      title: name,
      desc: `Client amb prioritat ${priority}. Aquí tens el proper pas i accessos ràpids a processos i fitxa completa.`,
    };
  },
  desktopTable: {
    title: 'Taula de clients',
    desc: "Vista d'escriptori del CRM amb informació resumida, prioritat, proper pas i accions ràpides.",
  },
  rowActions: {
    title: 'Accions del client',
    desc: 'Des d’aquí pots iniciar un procés sobre aquest client o obrir-ne la fitxa completa.',
  },
  startProcess: {
    title: 'Iniciar procés',
    desc: "Obre el modal d'accions per iniciar un flux sobre aquest client, com seguiment o procés post-esdeveniment.",
  },
  customerFile: {
    title: 'Fitxa 360',
    desc: 'Obre la fitxa completa del client amb historial, reserves i context operatiu.',
  },
  pagination: {
    title: 'Paginació de clients',
    desc: 'Indica quants clients estàs veient i permet avançar o retrocedir de pàgina.',
  },
  previousPage: {
    title: 'Pàgina anterior',
    desc: 'Torna a la pàgina anterior del llistat actual de clients.',
  },
  nextPage: {
    title: 'Pàgina següent',
    desc: 'Avança a la pàgina següent del llistat actual de clients.',
  },
};

export const ADMIN_CUSTOMER_HELP = {
  hub: {
    layout: {
      title: 'Layout de la fitxa client',
      desc: "A l'esquerra tens el panell principal del client i a la dreta la cronologia d'activitat i context.",
    },
    mainPanel: {
      title: 'Panell principal del client',
      desc: 'Canvia segons la pestanya activa i concentra la informació operativa principal del client.',
    },
    timeline: {
      title: 'Cronologia lateral del client',
      desc: "Mostra l'activitat del client ordenada en el temps per entendre el context abans d'actuar.",
    },
    refresh: {
      title: 'Refrescar fitxa client',
      desc: 'Torna a carregar les dades del hub client sense sortir de la fitxa, útil si acabes de fer canvis en una altra secció.',
    },
    refreshError: {
      title: 'Error de refresc',
      desc: 'Indica que el hub no s’ha pogut actualitzar i et permet reintentar la càrrega.',
    },
    refreshing: {
      title: 'Actualitzant dades',
      desc: 'Mostra que la fitxa del client s’està recarregant en segon pla.',
    },
  },
  header: {
    root: {
      title: 'Capçalera del client',
      desc: 'Resumeix identitat, estat, últim contacte, KPI ràpid i accions principals del client actual.',
    },
    backToCustomers: {
      title: 'Tornar a clients',
      desc: 'Torna al llistat general de clients sense perdre el context de navegació.',
    },
    statusToggle: {
      title: 'Estat del client',
      desc: 'Obre el selector per canviar la fase del client dins del cicle comercial o operatiu.',
    },
    statusOption(label: string): HelpCopy {
      return {
        title: label,
        desc: 'Canvia el client a aquesta fase i refresca la fitxa amb el nou context.',
      };
    },
    lastContact: {
      title: 'Últim contacte',
      desc: 'Indica quant fa que aquest client ha rebut o enviat una comunicació registrada.',
    },
    whatsapp: {
      title: 'Obrir WhatsApp',
      desc: 'Inicia una conversa de WhatsApp amb el número del client en una pestanya nova.',
    },
    quickActions: {
      title: 'Accions ràpides del client',
      desc: 'Permeten crear pressupost, reserva, tasca, missatge o eliminar/anonimitzar el client.',
    },
    action(label: string, desc: string): HelpCopy {
      return { title: label, desc };
    },
    deleteProtected: {
      title: 'Anonimitzar client',
      desc: 'Oculta dades personals però conserva registres necessaris quan hi ha reserves o pressupostos vinculats.',
    },
    deletePlain: {
      title: 'Eliminar client',
      desc: 'Esborra el client de forma permanent quan no hi ha dades protegides que obliguin a anonimitzar.',
    },
    kpis: {
      title: 'KPI del client',
      desc: 'Resumeixen pròxim esdeveniment, pressupost, cobrat, marge i última comunicació del client.',
    },
    kpi(label: string): HelpCopy {
      return {
        title: label,
        desc: 'Mostra una lectura ràpida d’aquest indicador per al client actual.',
      };
    },
    stage: {
      title: 'Estat i següent acció',
      desc: 'Explica en quina fase es troba el client i quina és la millor acció següent recomanada.',
    },
    stageProgress: {
      title: 'On està aquest client',
      desc: 'Mostra el recorregut del client dins del procés comercial i operatiu.',
    },
    nextAction: {
      title: 'Següent millor acció',
      desc: 'Proposa el pas més útil segons l’estat actual del client.',
    },
    tabs: {
      title: 'Pestanyes de la fitxa client',
      desc: 'Canvien entre resum, pressupostos, reserves, marge, comunicacions, tasques, descomptes, entrades i privacitat.',
    },
    tab(label: string): HelpCopy {
      return {
        title: label,
        desc: 'Obre aquest panell del hub client sense sortir de la fitxa.',
      };
    },
    mobileTabs: {
      title: 'Selector de pestanya',
      desc: 'En mòbil canvia la secció activa del hub client des d’un desplegable únic.',
    },
  },
};

export const ADMIN_CUSTOMER_PANEL_HELP = {
  summary: {
    root: {
      title: 'Resum del client',
      desc: 'Vista general del client: contacte editable, estadístiques, finances, pròxim event i accions ràpides contextuals.',
    },
    contact: {
      title: 'Informació de contacte',
      desc: "Nom, email, telèfon i idioma del client. Clica 'Editar' per modificar in-line.",
    },
    operations: {
      title: 'Resum operatiu',
      desc: "Pressupostos, reserves, tasques i comunicacions del client d'un cop d'ull.",
    },
    nextSteps: {
      title: 'Pròximes accions',
      desc: 'Aquí veus la pròxima tasca pendent i els pròxims esdeveniments del client per decidir el següent pas.',
    },
    quickActions: {
      title: 'Accions ràpides',
      desc: "Accions contextuals segons l'estat del client: continuar pressupost, enviar recordatori, crear reserva, etc.",
    },
    edit: {
      title: 'Editar contacte',
      desc: 'Activa l’edició in-line de les dades bàsiques del client.',
    },
    cancelEdit: {
      title: 'Cancel·lar edició',
      desc: 'Descarta els canvis no desats i recupera els valors actuals del client.',
    },
    save: {
      title: 'Desar canvis',
      desc: 'Guarda les modificacions fetes a les dades bàsiques del client.',
    },
    field(label: string): HelpCopy {
      return {
        title: label,
        desc: 'Camp editable o de lectura amb informació bàsica del client.',
      };
    },
    stat(label: string): HelpCopy {
      return {
        title: label,
        desc: 'Indicador resum del client per entendre càrrega comercial i operativa.',
      };
    },
    actionCard(title: string): HelpCopy {
      return {
        title,
        desc: 'Bloca una pròxima acció o conjunt d’elements imminents relacionats amb aquest client.',
      };
    },
    quickAction(label: string): HelpCopy {
      return {
        title: label,
        desc: 'Acció contextual ràpida per avançar aquest client segons el seu estat actual.',
      };
    },
  },
  bookings: {
    root: {
      title: 'Reserves del client',
      desc: "Mostra totes les reserves: properes amb countdown i pagaments, i passades o cancel·lades. Pots obrir la fitxa de cada esdeveniment.",
    },
    newBooking: {
      title: 'Nova reserva',
      desc: 'Crea una reserva nova ja vinculada a aquest client.',
    },
    card(reference: string): HelpCopy {
      return {
        title: `Reserva ${reference}`,
        desc: 'Fitxa resumida amb data, pack, pagaments i accés directe a la fitxa completa de l’esdeveniment.',
      };
    },
    payment: {
      title: 'Estat de cobrament',
      desc: 'Resumeix dipòsit i resta per saber què està pagat i què continua pendent.',
    },
    openBooking: {
      title: 'Obrir fitxa de reserva',
      desc: 'Entra a la reserva per revisar logística, imports i estat complet de l’esdeveniment.',
    },
  },
  privacy: {
    root: {
      title: 'Privacitat i RGPD',
      desc: 'Gestiona consentiments, exporta dades i consulta sol·licituds de drets del client.',
    },
    consents: {
      title: 'Consentiments',
      desc: 'Llista els consentiments actius i revocats del client: marketing, comunicacions i altres usos de dades.',
    },
    gdprActions: {
      title: 'Accions RGPD',
      desc: 'Exporta les dades del client en format complet o portable per complir amb la normativa.',
    },
    exportFull: {
      title: 'Exportar dades (Art. 15)',
      desc: 'Genera una exportació completa de les dades del client per dret d’accés.',
    },
    exportPortable: {
      title: 'Exportar portable (Art. 20)',
      desc: 'Genera una exportació portable del client per dret de portabilitat.',
    },
    requests: {
      title: 'Sol·licituds ARCO',
      desc: 'Registre de sol·licituds d’accés, rectificació, supressió, oposició o altres drets del client.',
    },
  },
};

export const ADMIN_CUSTOMER_PANEL_HELP_2 = {
  proposals: {
    root: { title: 'Pressupostos del client', desc: 'Llista tots els pressupostos: esborranys, pendents de resposta i històric. Pots enviar, acceptar, rebutjar i gestionar contractes.' },
    newProposal: { title: 'Nou pressupost', desc: 'Crea un pressupost nou ja vinculat a aquest client.' },
    group(title: string): HelpCopy { return { title, desc: 'Agrupa pressupostos per fase per facilitar-ne el seguiment i les accions disponibles.' }; },
    card(reference: string): HelpCopy { return { title: `Pressupost ${reference}`, desc: 'Detall del pressupost amb accions disponibles: editar, enviar, marcar estat i gestionar contracte si s’ha acceptat.' }; },
    contract: { title: 'Gestió de contracte', desc: 'Un cop acceptat, pots generar el PDF del contracte, enviar-lo per email i marcar-lo com signat.' },
  },
  comms: {
    root: { title: 'Comunicacions', desc: 'Historial de correus enviats, notes internes i seguiment. Pots enviar plantilles predefinides o afegir notes ràpides.' },
    quickActions: { title: 'Accions ràpides', desc: 'Accessos directes per enviar plantilles d’email o crear tasques de seguiment vinculades al client.' },
    note: { title: 'Nota interna', desc: 'Escriu una nota de seguiment que quedarà registrada al timeline del client. Útil per apuntar trucades o decisions.' },
    template(label: string): HelpCopy { return { title: label, desc: 'Obre una acció o plantilla ràpida relacionada amb la comunicació d’aquest client.' }; },
  },
  tasks: {
    root: { title: 'Tasques i notes', desc: 'Checklist operativa del client. Pots crear, completar, reobrir o eliminar tasques. Les tasques pendents apareixen al tauler general.' },
    newTask: { title: 'Nova tasca', desc: 'Crea una tasca nova vinculada a aquest client.' },
    column(title: string): HelpCopy { return { title, desc: 'Agrupa les tasques del client segons si estan pendents o completades.' }; },
    task(title: string): HelpCopy { return { title, desc: 'Tasca vinculada al client amb accions per marcar-la feta, reobrir-la o eliminar-la.' }; },
  },
  leads: {
    root: { title: 'Entrades vinculades', desc: 'Historial de leads i oportunitats comercials d’aquest client, amb estat i data. Pots obrir-ne la fitxa.' },
    card(name: string): HelpCopy { return { title: name, desc: 'Lead vinculat a aquest client amb estat, tipus d’esdeveniment i possible reserva associada.' }; },
  },
};

export const ADMIN_CUSTOMER_PANEL_HELP_3 = {
  margin: {
    root: { title: 'Extres i marge', desc: 'Mostra subtotal, descompte, total i marge estimat del document actiu. Per editar extres, obre l’Studio.' },
    metric(label: string): HelpCopy { return { title: label, desc: 'Mètrica econòmica del document actiu per entendre subtotal, descompte, total o marge.' }; },
    studio: { title: 'Editar al Studio', desc: 'Si cal tocar extres, costos reals o detalls econòmics del pressupost actiu, aquí tens l’accés directe.' },
    openStudio: { title: 'Obrir Studio', desc: 'Obre l’Studio del pressupost actiu per editar extres i detall econòmic.' },
  },
  discounts: {
    root: { title: 'Descomptes del client', desc: 'Codis de descompte vinculats a aquest client: estat, percentatge, vigència i usos.' },
    card(code: string): HelpCopy { return { title: `Codi ${code}`, desc: 'Detall del descompte: percentatge, estat, vigència, usos i origen del codi.' }; },
  },
};

export const ADMIN_BOOKING_HELP = {
  detail: {
    executive: { title: 'Resum executiu de la reserva', desc: 'Resumeix import, estat de pagament, flux client, post-event i vincle comercial abans d’entrar al detall operatiu.' },
    client: { title: 'Informació del client', desc: 'Concentra les dades de contacte, accessos ràpids i historial resumit del client d’aquesta reserva.' },
    event: { title: 'Detalls de l’esdeveniment', desc: 'Mostra quan i on passa l’esdeveniment, quin tipus és i quantes persones hi assistiran.' },
    services: { title: 'Serveis contractats', desc: 'Desglossa el pack, els extres i les hores addicionals contractades per aquesta reserva.' },
    finances: { title: 'Resum econòmic', desc: 'Resumeix subtotal, descompte, IVA, total i estat actual dels cobraments de la reserva.' },
    commHistory: { title: 'Historial de comunicacions', desc: 'Recull enviaments i respostes vinculades a la reserva per entendre què s’ha comunicat i per quin canal.' },
    activity: { title: 'Historial de canvis', desc: 'Mostra la traça administrativa dels canvis importants fets a la reserva al llarg del temps.' },
    gallery: { title: 'Galeria de la reserva', desc: 'Permet consultar o gestionar imatges associades a aquest esdeveniment o a la seva documentació visual.' },
    moreActions: { title: 'Més accions', desc: 'Agrupa accessos menys freqüents relacionats amb calendari, integracions i post-event.' },
  },
  gallery: {
    root: { title: 'Galeria de fotos', desc: 'Permet pujar, revisar, classificar i eliminar fotos associades a la reserva.' },
    upload: { title: 'Pujar fotos', desc: 'Obre el selector per afegir noves fotos a la galeria d’aquesta reserva.' },
    dropzone: { title: 'Zona de pujada', desc: 'Pots arrossegar fotos aquí o clicar per afegir-les; es processen i comprimeixen automàticament.' },
    photo: { title: 'Foto de la reserva', desc: 'Miniatura d’una foto amb accés a configuració i visibilitat.' },
    delete: { title: 'Eliminar foto', desc: 'Esborra aquesta foto de la galeria de la reserva.' },
    selected: { title: 'Configuració de la foto', desc: 'Permet decidir si la foto es veu al portal client o al portfolio públic.' },
    portal: { title: 'Visible al portal client', desc: 'Controla si la foto apareix dins del portal privat del client.' },
    portfolio: { title: 'Visible al portfolio públic', desc: 'Controla si la foto pot usar-se al portfolio públic de la web.' },
    portfolioFolder: { title: 'Carpeta del portfolio', desc: 'Defineix en quina categoria pública s’ubica la foto quan és visible al portfolio.' },
  },
};

export const ADMIN_BOOKING_HELP_2 = {
  checklist: {
    root: { title: 'Preparació del bolo', desc: 'Checklist operativa de la reserva per controlar l’estat real de preparació abans del servei.' },
    progress: { title: 'Progrés de preparació', desc: 'Resumeix quants punts de la checklist estan completats i quin percentatge representen.' },
    item: { title: 'Ítem de checklist', desc: 'Punt concret de preparació que pots marcar, desmarcar o eliminar si és personalitzat.' },
    add: { title: 'Afegir ítem', desc: 'Crea un nou punt personalitzat dins de la checklist de la reserva.' },
  },
  inventory: {
    root: { title: 'Equipament assignat', desc: 'Gestiona el material vinculat a la reserva: afegir, retirar, marcar sortida o retorn i revisar disponibilitat.' },
    bundle: { title: 'Lots d’equipament', desc: 'Permet aplicar un lot predefinit de material per accelerar l’assignació.' },
    assigned: { title: 'Material assignat', desc: 'Llista els elements ja vinculats a la reserva amb les seves accions operatives.' },
    search: { title: 'Cerca d’equip disponible', desc: 'Filtra material disponible per nom o codi per afegir-lo a la reserva.' },
  },
  documentFlow: {
    root: { title: 'Flux documental', desc: 'Resumeix en quin punt documental està la reserva: pressupost, contracte i factura, amb accés ràpid als PDFs o a Holded.' },
    steps: { title: 'Passos del flux documental', desc: 'Cada targeta representa una etapa documental i mostra si està pendent, en curs o completada.' },
  },
  invoice: {
    root: { title: 'Factura', desc: 'Des d’aquí pots generar, revisar, marcar com pagada o cancel·lar la factura vinculada a la reserva.' },
    actions: { title: 'Accions de factura', desc: 'Mostren les accions disponibles segons l’estat actual: veure a Holded, marcar pagada, reintentar sync o cancel·lar.' },
  },
};

export const ADMIN_BOOKING_HELP_3 = {
  communication: {
    root: { title: 'Comunicacions multicanal', desc: 'Mostra i executa accions de comunicació per cobrament, post-esdeveniment i missatges generals.' },
    flow: { title: 'Flux de comunicació', desc: 'Cada bloc resumeix l’estat d’un flux de comunicació i les accions disponibles per enviar o marcar resposta.' },
  },
  portal: {
    root: { title: 'Portal client', desc: 'Genera o revoca un enllaç privat perquè el client consulti l’estat, documents, pagaments i informació del seu esdeveniment.' },
    options: { title: 'Configuració del portal', desc: 'Permet definir idioma, caducitat, missatge i mòduls visibles del portal privat.' },
    actions: { title: 'Accions del portal', desc: 'Permet generar, copiar o revocar l’enllaç privat del portal client.' },
  },
  status: {
    root: { title: 'Canvi d’estat de la reserva', desc: 'Permet moure la reserva entre fases operatives i veure el resultat de les automatitzacions associades.' },
    complete: { title: 'Confirmació de completat', desc: 'Avisa que marcar l’esdeveniment com a completat també actualitza estadístiques públiques i sincronitzacions.' },
  },
  nav: {
    root: { title: 'Navegació de la reserva', desc: 'Serveix per saltar ràpidament entre client, esdeveniment, serveis, finances, documents, comunicacions i historial de la reserva.' },
    item: { title: 'Secció de la reserva', desc: 'Desplaça la vista fins a la secció seleccionada del detall de reserva.' },
  },
};

export const ADMIN_LEAD_HELP = {
  detail: {
    executive: { title: "Resum executiu de l'entrada", desc: 'Resumeix valor estimat, antiguitat, estat del flux client, post-event i puntuació comercial abans d’entrar al detall.' },
    createBooking: { title: "Crear reserva des de l'entrada", desc: 'Serveix per convertir aquesta oportunitat en reserva quan ja hi ha acord comercial però encara no existeix booking.' },
    booking: { title: 'Reserva associada', desc: 'Detall de la reserva convertida des d’aquesta entrada: dates, imports, pagaments, estat post-event i accions de seguiment.' },
    record: { title: 'Detalls del registre', desc: 'Metadades tècniques de l’entrada: ID, idioma, dates de creació, actualització i contacte.' },
    attribution: { title: 'Atribució / UTM', desc: 'D’on ve aquesta entrada: origen, paràmetres UTM i pàgina d’aterratge. Útil per avaluar campanyes de màrqueting.' },
    customer: { title: 'Relació Client', desc: 'Dades del client vinculat: contacte, historial d’esdeveniments i despesa acumulada.' },
    history: { title: 'Historial del client', desc: 'Altres entrades i reserves del mateix client o email. Permet veure repetidors i context comercial acumulat.' },
  },
  guided: {
    root: { title: 'Pipeline comercial guiat', desc: 'Et diu en quin pas està l’entrada i suggereix la millor acció següent per fer-la avançar.' },
    actions: { title: 'Accions ràpides del lead', desc: 'Permeten executar el següent pas recomanat, crear tasca de seguiment o marcar l’entrada com a perduda o reoberta.' },
  },
  actions: {
    status: { title: 'Canviar estat del lead', desc: 'Permet moure l’entrada entre estats comercials i veure l’estat actual d’un cop d’ull.' },
    quote: { title: 'Generar pressupost', desc: 'Permet escollir pack, ajustar preu i generar un pressupost comercial per al lead.' },
    quick: { title: 'Accions ràpides', desc: 'Canals ràpids per contactar el lead i enviar pressupost per WhatsApp, correu o trucada.' },
  },
};

export const ADMIN_LEAD_HELP_2 = {
  profile: {
    root: { title: 'Fitxa del lead', desc: 'Dades principals de l’entrada i seguiment comercial editable des d’un únic panell.' },
  },
  notes: {
    root: { title: 'Notes del lead', desc: 'Recull observacions comercials o operatives del lead i permet netejar duplicats.' },
  },
  snapshot: {
    root: { title: 'Snapshot tècnic', desc: 'Mostra i permet exportar el snapshot JSON intern del lead per anàlisi o suport.' },
  },
  score: {
    root: { title: 'Snapshot de score', desc: 'Desa una fotografia del score comercial actual del lead.' },
  },
  workspace: {
    root: { title: 'Workspace del lead', desc: 'Aquest espai concentra seguiment comercial, documents i activitat cronològica de l’entrada.' },
    kpis: { title: 'KPI del lead', desc: 'Resumeixen tasques obertes, tasques completades, documents pujats i activitat registrada.' },
    tasks: { title: 'Seguiment comercial', desc: 'Aquí gestiones les tasques reals per fer avançar el lead: trucades, seguiment, recordatoris i propers passos.' },
    documents: { title: 'Documents comercials', desc: 'Serveix per pujar i consultar pressupostos, contractes, factures o arxius vinculats a aquesta oportunitat.' },
    timeline: { title: 'Timeline comercial', desc: 'Registre cronològic de totes les accions: canvis d’estat, notes, trucades i activitats automàtiques. Pots netejar duplicats.' },
  },
};


export const ADMIN_CALENDAR_HELP = {
  monthNavigation: {
    title: 'Navegació del calendari',
    desc: 'Permet moure el rang visible, tornar a avui i canviar ràpidament entre vista mensual, setmanal o diària.',
  },
  stats: {
    title: 'Resum del calendari',
    desc: 'Mostra reserves, bloquejos, dies lliures i dies mixtes per entendre la càrrega real del període visible.',
  },
  legend: {
    title: 'Llegenda de colors',
    desc: 'Explica què significa cada estat visual del calendari: lliure, reservat, bloquejat o mixt.',
  },
  monthGrid: {
    title: 'Graella del calendari',
    desc: 'Cada cel·la mostra reserves i bloquejos del dia. Arrossega una reserva a un altre dia per canviar-ne la data. Clica un dia per veure detalls.',
  },
  monthDayDetail: {
    title: 'Detall del dia',
    desc: 'Mostra reserves i bloquejos del dia seleccionat. Pots bloquejar/desbloquejar dies, crear reserves o canviar dates.',
  },
  weekNavigation: {
    title: 'Navegació setmanal',
    desc: 'Canvia de setmana, torna a avui o salta entre vistes mensual, setmanal i diària.',
  },
  weekGrid: {
    title: 'Graella setmanal',
    desc: 'Cada columna representa un dia de la setmana amb reserves, bloquejos i accions ràpides per operar-hi.',
  },
  dayNavigation: {
    title: 'Navegació diària',
    desc: 'Canvia de dia, torna a avui o salta a la vista setmanal o mensual.',
  },
  dayTimeline: {
    title: 'Timeline del dia',
    desc: 'Distribueix les reserves per franges horàries i et deixa veure ràpidament la càrrega real del dia.',
  },
  daySidebar: {
    title: 'Panell lateral del dia',
    desc: 'Resumeix estat, bloquejos i reserves del dia seleccionat amb accessos directes a cada booking.',
  },
};

export const ADMIN_INBOX_HELP = {
  root: {
    title: 'Safata unificada',
    desc: 'Combina entrades web i correus IMAP en una sola vista perquè puguis decidir si respondre, convertir a lead o arxivar.',
  },
  sidebar: {
    title: 'Filtres de la safata',
    desc: 'Permeten separar entrades web, correus IMAP, paperera i no llegits per reduir soroll.',
  },
  list: {
    title: 'Llista de missatges',
    desc: 'Mostra els missatges filtrats i et deixa cercar per remitent, assumpte o text del missatge.',
  },
  search: {
    title: 'Cercador de la safata',
    desc: 'Filtra els missatges visibles sense recarregar la pàgina.',
  },
  detail: {
    title: 'Panell de detall',
    desc: 'Mostra el missatge seleccionat i concentra les accions útils: respondre, pressupostar, convertir a lead o moure a paperera.',
  },
  messageActions: {
    title: 'Accions del missatge',
    desc: 'Segons el tipus de missatge, aquí pots respondre, generar pressupost, obrir el lead, crear-lo o gestionar la paperera.',
  },
};

