export type MasterAtlasNextMove = {
  label: string;
  why: string;
  impact: 'ALT' | 'MITJA' | 'BAIX';
  effort: 'BAIX' | 'MITJA' | 'ALT';
  status: 'FET' | 'EN_CURS' | 'PENDENT';
};

export type MasterAtlasModuleDefinition = {
  id: string;
  title: string;
  subtitle: string;
  mission: string;
  ownerQuestion: string;
  routes: string[];
  visualGroups: string[];
  electricPatterns: string[];
  sourceOfTruth: string[];
  docs: string[];
  operations: string[];
  risks: string[];
  safeTouch: string[];
  validations: string[];
  nextMoves: MasterAtlasNextMove[];
};

export const MASTER_ATLAS_PRINCIPLES = [
  'Radiografia real abans de tocar: atles electric, atles visual i protocol viuen per davant de la intuicio.',
  'Una sola font de veritat per cada decisio: servei o constant canonica, mai calcul local en JSX.',
  'Lead configura; booking governa despres del si; dossier presenta sense ensenyar la cuina interna.',
  'Marge, cash i capacitat decideixen abans que el propietari es comprometi.',
  'Qualsevol sortida cap al client necessita plantilla editable, lock idempotent i fallback manual.',
  'Cada modul ha de dir que fa, on viu, que no tocar i com validar-se.',
] as const;

export const MASTER_ATLAS_GATES = [
  'Protocol llegit i agent-sync actualitzat.',
  'Font canonica identificada.',
  'Ruta real o document visible afectat.',
  'Test o guard proporcional al risc.',
  'Validacio funcional amb dades reals o fixture representatiu.',
  'Validacio humana/UX escrita.',
  'Diari + protocol + counter sincronitzats.',
] as const;

export const MASTER_ATLAS_MODULES: MasterAtlasModuleDefinition[] = [
  {
    id: 'comandament',
    title: 'Comandament',
    subtitle: 'Avui, control complet, salut i lectura executiva.',
    mission: 'Fer que el propietari obri un lloc i sàpiga què toca avui, què crema marge i què pot esperar.',
    ownerQuestion: 'Què he de mirar o fer ara mateix?',
    routes: ['/admin', '/admin/control', '/admin/salut', '/admin/reporting', '/admin/economia'],
    visualGroups: ['Comandament'],
    electricPatterns: ['app/admin/page.tsx', 'app/admin/control', 'dailyBriefService', 'dashboard-data', 'operationalPulse', 'economicCockpit', 'capacityConflict', 'dayCollisionService'],
    sourceOfTruth: ['dailyBriefService', 'dashboard-data', 'capacityConflictService', 'dayCollisionService', 'leadPriorityService', 'postEventPlaybookService', 'economicCockpit'],
    docs: ['docs/TESI-MAQUINA-full-de-ruta-2026-07.md', 'docs/TESI-ZENIT-MAQUINA-ORBITA-2026-07-04.md', 'docs/admin-protocol.md'],
    operations: ['Llegir tasques i alertes', 'Triar leads del dia', 'Detectar post-event pendent', 'Veure xocs de capacitat, col·lisions de dia i caixa'],
    risks: ['Tornar a fer un dashboard immens', 'Duplicar KPIs que ja calcula dashboard-data', 'Fer que el propietari hagi d obrir massa pantalles', 'Amagar un doble bolo de dissabte fora de la pantalla Avui'],
    safeTouch: ['Afegir projeccions de serveis existents', 'Mantenir Avui calmat', 'Enviar el detall exhaustiu a /admin/control'],
    validations: ['test servei afectat', 'captura /admin desktop i mobile', 'npx tsc --noEmit', 'pnpm run validate:core'],
    nextMoves: [
      { label: 'Brief diari sortint al propietari', why: 'Transforma la brúixola en acció abans d obrir l admin.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Guàrdia de dissabtes visible a Avui', why: 'Els dies amb 2+ bolos ja apareixen a Cal que ho miris via dayCollisionService (#1421).', impact: 'ALT', effort: 'MITJA', status: 'FET' },
      { label: 'Confirmació abans de crear el segon bolo del dia', why: 'Eleva l avís existent al moment de comprometre una nova reserva.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial i leads',
    subtitle: 'Entrada, scoring, seguiment, resposta ràpida i conversió.',
    mission: 'Convertir demanda entrant en decisió clara: perseguir, pressupostar, descartar o convertir.',
    ownerQuestion: 'Quin lead val la pena treballar i quina és la propera acció?',
    routes: ['/admin/leads', '/admin/leads/[id]', '/admin/sales-ops', '/admin/inbox', '/admin/intake'],
    visualGroups: ['Leads', 'Comercial', 'Comunicacions'],
    electricPatterns: ['leadAdminService', 'leadRouteService', 'leadServiceLine', 'commercialScoring', 'leadPriorityService', 'automationTriggers', 'leadWelcomeEmailService', 'commercialSequenceService'],
    sourceOfTruth: ['Lead', 'LeadServiceLine', 'scoreLead', 'onLeadCreated', 'leadWelcomeEmailService', 'commercialSequenceService'],
    docs: ['docs/TESI-MAQUINA-full-de-ruta-2026-07.md', 'docs/admin-fitxes-pantalles.md'],
    operations: ['Crear lead', 'Extreure dades d email o WhatsApp', 'Prioritzar per score', 'Enviar benvinguda automàtica', 'Preparar dossier'],
    risks: ['Enviar a placeholder', 'Duplicar welcome en retry', 'Recalcular score localment', 'Confondre lead amb reserva'],
    safeTouch: ['Respectar TASK_DEDUPE_KEY.welcomeEmail', 'Usar preferredLocale i plantilla welcome', 'Deixar fallback manual si SMTP falla', 'Mantenir LeadServiceLine com pre-reserva'],
    validations: ['leadWelcomeEmailService test', 'automationTriggers test', 'lead service tests', 'smoke detail /admin/leads/[id]'],
    nextMoves: [
      { label: 'Auditar HTML/copy del welcome email', why: 'Ja s envia automàtic; ara ha de sonar premium.', impact: 'ALT', effort: 'BAIX', status: 'PENDENT' },
      { label: 'Seqüència multicanal real amb aturada en resposta', why: 'Aprofita el cervell comercial sense molestar leads que ja contesten.', impact: 'ALT', effort: 'ALT', status: 'PENDENT' },
    ],
  },
  {
    id: 'documents',
    title: 'Dossiers, pressupostos i PDFs',
    subtitle: 'Proposta client-facing, snapshot, marge i document final.',
    mission: 'Presentar Òrbita com a premium sense perdre coherència econòmica ni canviar propostes antigues.',
    ownerQuestion: 'El document ven bé i protegeix el marge abans d enviar?',
    routes: ['/admin/dossiers', '/admin/presupuestos', '/admin/studio', '/api/admin/studio/preview/dossier', '/api/admin/dossiers/[id]/composite'],
    visualGroups: ['Documents', 'Sistema'],
    electricPatterns: ['dossierService', 'dossier-html-builder', 'dossierSnapshot', 'dossierProductMapping', 'dossierMarginGuard', 'dossierAutoDraft', 'proposalAdminService', 'quotePdfService'],
    sourceOfTruth: ['Dossier', 'lineSnapshot', 'dossierService', 'dossierSnapshotService', 'dossierMarginGuardService', 'dossier-html-builder'],
    docs: ['docs/TESI-ZENIT-MAQUINA-ORBITA-2026-07-04.md', 'docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md'],
    operations: ['Generar esborrany', 'Mapar línies de lead', 'Veure marge abans d enviar', 'Desar snapshot', 'Generar PDF compost'],
    risks: ['Canviar un dossier antic per catàleg nou', 'Mostrar marge intern al client', 'Fer un PDF que compila però no ven', 'Duplicar fórmules de transport'],
    safeTouch: ['Preservar lineSnapshot', 'Usar computeBoloTransport i costEngine', 'Separar UI admin de copy client-facing', 'Validar preview PDF real'],
    validations: ['dossier service tests', 'dossier-html-builder tests', 'preview PDF 200 application/pdf', 'captura dossier/PDF si canvia visual'],
    nextMoves: [
      { label: 'Auditoria client-facing del dossier complet', why: 'És el document que converteix valor en preu acceptat.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Master de plantilles PDF/email', why: 'Evita que cada document tingui una veu i una jerarquia diferent.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
    ],
  },
  {
    id: 'reserves',
    title: 'Reserves i operativa',
    subtitle: 'Del sí al bolo executat: calendari, checklist, inventari i capacitat.',
    mission: 'Convertir un sí comercial en una operació segura, calendari ocupat i equip preparat.',
    ownerQuestion: 'Aquest bolo està preparat, cobert i no xoca amb res?',
    routes: ['/admin/bookings', '/admin/bookings/[id]', '/admin/bookings/new', '/admin/calendario', '/admin/cuadrant', '/admin/tasks'],
    visualGroups: ['Reserves', 'Operativa', 'Tasques'],
    electricPatterns: ['bookingCreationService', 'bookingRouteService', 'BookingServiceLine', 'bookingChecklistService', 'bookingInventoryService', 'capacityConflict', 'dayCollisionService', 'crewSchedule', 'onBookingConfirmed'],
    sourceOfTruth: ['Booking', 'BookingServiceLine', 'bookingCreationService', 'bookingRouteService', 'bookingChecklistService', 'capacityConflictService', 'dayCollisionService'],
    docs: ['docs/admin-fitxes-pantalles.md', 'docs/protocol-executiu.md'],
    operations: ['Crear reserva', 'Copiar service lines del lead', 'Confirmar checklist', 'Assignar inventari', 'Veure calendari/cuadrant', 'Detectar dies amb 2+ bolos compromesos'],
    risks: ['Comprometre dos bolos el mateix dia', 'Editar reserva com si encara fos lead', 'No crear checklist pre-event', 'Trencar customerId en vistes filtrades', 'Confondre xoc d inventari amb xoc de presència humana'],
    safeTouch: ['Mantenir booking com veritat post-sí', 'Usar serveis de booking', 'Validar smoke-detail en rutes [id]', 'No duplicar calendari vs cuadrant'],
    validations: ['booking service tests', 'BookingPipelineView tests', 'qa:smoke-detail', 'npx tsc --noEmit'],
    nextMoves: [
      { label: 'Guàrdia de dissabtes a Avui', why: 'Detecta dies amb 2+ reserves compromeses i els porta a Cal que ho miris (#1421).', impact: 'ALT', effort: 'MITJA', status: 'FET' },
      { label: 'Gate en crear reserva amb data ja ocupada', why: 'Converteix l avís en confirmació explícita abans de comprometre el segon bolo.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Checklist pre-event amb recordatoris T-7/T-2', why: 'Redueix memòria oral i improvisació.', impact: 'MITJA', effort: 'MITJA', status: 'PENDENT' },
    ],
  },
  {
    id: 'economia',
    title: 'Economia, marge i cash',
    subtitle: 'Preu, cost, transport, CAC, cobrament i rendibilitat.',
    mission: 'Fer que cada decisió comercial i operativa protegeixi marge, caixa i temps escàs.',
    ownerQuestion: 'Aquest bolo guanya diners de veritat i quan entra/surt la caixa?',
    routes: ['/admin/economia', '/admin/pricing', '/admin/cost-calculator', '/admin/bookings/[id]', '/admin/collaborators/[id]'],
    visualGroups: ['Economia', 'Catàleg', 'Partners'],
    electricPatterns: ['costEngine', 'travelLaborCost', 'cashFlowForecast', 'economicCockpit', 'payment-status', 'bookingOutstandingAmount', 'collaboratorPayout', 'collaboratorAccount'],
    sourceOfTruth: ['costEngine', 'travelLaborCost', 'computeBookingFinancialSummary', 'bookingOutstandingAmount', 'collaboratorPayoutService', 'collaboratorAccountService'],
    docs: ['docs/TESI-MAQUINA-full-de-ruta-2026-07.md', 'docs/admin-protocol.md'],
    operations: ['Calcular marge', 'Calcular transport', 'Veure pendent cash-aware', 'Liquidar col·laboradors', 'Mesurar CAC'],
    risks: ['Fer toFixed+€ a la UI', 'Ignorar cashAmount', 'Duplicar costEngine', 'Barrejar preu client amb cost intern'],
    safeTouch: ['Canviar cervell econòmic, no JSX', 'Usar helpers monetaris canònics', 'Afegir test de cas econòmic', 'Validar dashboard i fitxa que consumeixen el número'],
    validations: ['costEngine tests', 'payment-status tests', 'collaboratorAccount tests', 'qa:no-admin-toFixed-currency'],
    nextMoves: [
      { label: 'Quadre de marge per dissabte ocupat', why: 'El temps escàs no és un dia: és un actiu econòmic.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Revisió de preus per marge real i CAC', why: 'Puja preus on el sistema demostri que el marge és baix.', impact: 'ALT', effort: 'ALT', status: 'PENDENT' },
    ],
  },
  {
    id: 'partners',
    title: 'Partners i Masquerade',
    subtitle: 'Col·laboradors, socis-clients, productes i compte corrent.',
    mission: 'Modelar una relació externa única encara que el diner pugui anar en dues direccions.',
    ownerQuestion: 'Aquest partner em deu, li dec o estem en paus?',
    routes: ['/admin/collaborators', '/admin/collaborators/[id]', '/admin/cuadrant/repartiment'],
    visualGroups: ['Partners', 'Operativa'],
    electricPatterns: ['Collaborator', 'CLIENT_PARTNER', 'CollaboratorsClient', 'CollaboratorAccountPanel', 'collaboratorAccountService', 'collaboratorProductService', 'seed-partners'],
    sourceOfTruth: ['Collaborator', 'CollaboratorProduct', 'billedCollaboratorId', 'collaboratorAccountService', 'collaboratorPayoutService'],
    docs: ['docs/admin-diary.md', 'docs/admin-protocol.md'],
    operations: ['Filtrar CLIENT_PARTNER', 'Veure compte corrent', 'Cobrar en efectiu', 'Afegir productes de partner', 'Liquidar payout'],
    risks: ['Duplicar Carlos/Masquerade', 'Guardar client final del partner com si fos teu', 'No separar li dec vs em deu', 'Inflar marge amb cost de partner absent'],
    safeTouch: ['Una sola fitxa Collaborator', 'Facturat a partner quan ell contracta', 'Línia de partner quan el revens', 'Cost real obligatori'],
    validations: ['CollaboratorsClient test', 'collaboratorAccount tests', 'collaboratorProduct tests', 'captura fitxa partner si canvia UI'],
    nextMoves: [
      { label: 'Vista de liquidació mensual partner', why: 'Converteix el compte corrent en acció de tancament de mes.', impact: 'MITJA', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Auditoria de productes partner amb markup', why: 'Evita marge fals i preu inconsistent en dossiers.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
    ],
  },
  {
    id: 'comunicacions',
    title: 'Comunicacions i plantilles',
    subtitle: 'Inbox, emails, plantilles BD, tracking i processos client-facing.',
    mission: 'Fer que la màquina parli amb el to correcte, sense duplicar enviaments ni perdre traça.',
    ownerQuestion: 'Què ha sortit cap al client i què falta revisar o enviar?',
    routes: ['/admin/inbox', '/admin/emails', '/admin/email-templates', '/admin/settings/notifications'],
    visualGroups: ['Comunicacions', 'Sistema'],
    electricPatterns: ['emailTemplateService', 'adminEmailSendService', 'emailTrackingService', 'inboxLeadImportService', 'leadWelcomeEmailService', 'bookingConfirmationEmailService', 'customerProcessService'],
    sourceOfTruth: ['EmailTemplate', 'emailTemplateService', 'sendEmail', 'adminEmailSendService', 'emailTrackingService', 'TASK_DEDUPE_KEY'],
    docs: ['docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md', 'docs/admin-protocol.md'],
    operations: ['Editar plantilla', 'Enviar email', 'Importar inbox', 'Track open/click', 'Crear fallback manual'],
    risks: ['Hardcodejar copy client-facing', 'Enviar sense idempotència', 'No respectar locale', 'Confondre pendent d enviar amb pendent de resposta'],
    safeTouch: ['Plantilles BD per copy', 'DedupeKey per automatismes', 'Fallback manual si falla', 'No mailto a admin'],
    validations: ['email service tests', 'automation tests', 'qa:admin-no-mailto', 'captura/render HTML email si canvia plantilla'],
    nextMoves: [
      { label: 'Auditoria visual d emails', why: 'El client jutja marca i professionalitat pels emails.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Taula de processos outward-facing amb fre humà', why: 'Permet automatitzar més sense perdre control.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
    ],
  },
  {
    id: 'post-event',
    title: 'Post-event i volant',
    subtitle: 'Ressenyes, testimonis, referrals, informes i aprenentatge.',
    mission: 'Convertir cada bolo fet en prova social, aprenentatge i el següent lead més barat.',
    ownerQuestion: 'Què falta demanar després del bolo perquè no es perdi valor?',
    routes: ['/admin/post-event', '/admin/post-event/playbook', '/admin/post-event/reports', '/admin/post-event/surveys', '/admin/ressenyes'],
    visualGroups: ['Post-event', 'Web'],
    electricPatterns: ['postEventPlaybookService', 'postEventDispatchService', 'questionnaireService', 'reviewsSyncService', 'referralsService', 'reactivationService'],
    sourceOfTruth: ['postEventPlaybookService', 'PostEventReport', 'ClientSurvey', 'reviewsSyncService', 'referralsService'],
    docs: ['docs/TESI-MAQUINA-full-de-ruta-2026-07.md', 'docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md'],
    operations: ['Veure accions pendents', 'Enviar enquesta', 'Demanar ressenya', 'Crear testimoni', 'Generar referral'],
    risks: ['Enviar massa aviat o sense context', 'Barrejar informe intern amb missatge al client', 'No tancar el loop a la home'],
    safeTouch: ['Primer lectura interna', 'Després esborrany', 'Finalment auto-dispatch amb autorització', 'Separar report intern de copy client'],
    validations: ['post-event tests', 'captura /admin/post-event', 'test dispatch si toca enviament', 'validate:core'],
    nextMoves: [
      { label: 'Auto-esborrany post-event amb revisió', why: 'Accelera CAC barat sense enviar sol de cop.', impact: 'ALT', effort: 'MITJA', status: 'PENDENT' },
      { label: 'Portfolio/testimoni des de bolo completat', why: 'Converteix execució real en actiu comercial.', impact: 'ALT', effort: 'ALT', status: 'PENDENT' },
    ],
  },
  {
    id: 'cataleg',
    title: 'Catàleg, packs i inventari',
    subtitle: 'Producte, cost, equip, extras, pricing i fonts de valor.',
    mission: 'Fer que el que es ven tingui cost, preu, vida útil i presentació coherents.',
    ownerQuestion: 'Aquest producte està ben valorat, costa el que diu i es pot vendre així?',
    routes: ['/admin/packs', '/admin/packs/extras', '/admin/pricing', '/admin/inventory', '/admin/catalog'],
    visualGroups: ['Catàleg', 'Inventari'],
    electricPatterns: ['packs', 'PACKS', 'inventory', 'pricing', 'collaboratorProduct', 'animacio-products', 'packPricing', 'cost-calculator'],
    sourceOfTruth: ['lib/constants/animacio-products.ts', 'Pack', 'InventoryItem', 'collaboratorProductService', 'pricing model'],
    docs: ['docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md', 'docs/admin-protocol.md'],
    operations: ['Editar pack', 'Afegir extra', 'Valorar inventari', 'Sincronitzar preu', 'Calcular cost'],
    risks: ['Preu sense font', 'Cost d inventari absent', 'Pack amb PVP diferent segons pantalla', 'Catàleg client desalineat del pressupost'],
    safeTouch: ['Font única de preus', 'Tests de pack/pricing', 'No duplicar catàlegs locals', 'Verificar preview client si canvia presentació'],
    validations: ['pack pricing tests', 'inventory tests', 'i18n packs/equipment guards', 'qa:layer-catalogs'],
    nextMoves: [
      { label: 'Auditoria preu-cost de packs i extras', why: 'És marge directe i posicionament de marca.', impact: 'ALT', effort: 'ALT', status: 'PENDENT' },
      { label: 'Fitxa visual de producte client-facing', why: 'El catàleg ha de vendre el valor, no només listar noms.', impact: 'MITJA', effort: 'MITJA', status: 'PENDENT' },
    ],
  },
  {
    id: 'visual-sistema',
    title: 'Visual, sistema i continuïtat',
    subtitle: 'Atles, auditoria visual, protocol, crons, settings i eines internes.',
    mission: 'Fer que el repo sigui operable per humans i IAs sense memòria oral.',
    ownerQuestion: 'On miro abans de tocar i com sé que no estic trencant res?',
    routes: ['/admin/docs/master', '/admin/docs/electric-atlas', '/admin/docs/visual-audit', '/admin/studio', '/admin/settings', '/admin/crons', '/admin/scripts'],
    visualGroups: ['Sistema'],
    electricPatterns: ['repoElectricAtlasService', 'visualAuditAtlasService', 'admin-visual-audit', 'adminNav', 'AdminPage', 'admin-protocol', 'agent-sync'],
    sourceOfTruth: ['CLAUDE.md', 'docs/admin-protocol.md', 'docs/agent-sync.md', 'repoElectricAtlasService', 'visualAuditAtlasService', 'adminNav'],
    docs: ['CLAUDE.md', 'docs/protocol-executiu.md', 'docs/admin-protocol.md', 'docs/audit/AUDITORIA-VISUAL-GLOBAL-1416.md'],
    operations: ['Consultar manual', 'Buscar cable', 'Mirar captures', 'Validar protocol', 'Executar guards'],
    risks: ['Fer documentació morta', 'Confondre render OK amb disseny perfecte', 'No actualitzar counter', 'Treballar sense mirar agent-sync'],
    safeTouch: ['Docs vius dins admin', 'Serveis que llegeixen repo real', 'Guards de protocol', 'Captures abans/després per visual'],
    validations: ['repoElectricAtlasService test', 'visualAuditAtlasService test', 'qa:protocol', 'validate:core', 'audit:visual:admin si canvia visual'],
    nextMoves: [
      { label: 'Auditoria visual humana per mòdul', why: 'El baseline diu que renderitza; falta criteri de disseny.', impact: 'ALT', effort: 'ALT', status: 'PENDENT' },
      { label: 'Fitxes forenses pendents per òrgan', why: 'Permet tocar pantalles sense obrir illes mortes.', impact: 'ALT', effort: 'ALT', status: 'PENDENT' },
    ],
  },
] as const;
