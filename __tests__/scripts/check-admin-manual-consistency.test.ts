// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-admin-manual-consistency.mjs');

function writeManual(content: string) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-admin-consistency-'));
  const dir = path.join(root, 'lib', 'constants');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'adminManual.ts'), content, 'utf8');
  return root;
}

function runGuard(content: string) {
  const cwd = writeManual(content);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

// Fixture mínim vàlid: 2 fases, gate coherent, bootstrap amb finestres
const VALID_MANUAL = `
export interface AdminMarketingBootstrapStep {
  window: string;
  title: string;
  objective: string;
  outputs: string[];
}

export const ADMIN_MARKETING_PHASE_GATE = {
  activePhase: 'FASE_0',
  requiredActionIds: ['action-a', 'action-b'],
  requiredOutputs: {
    'action-a': ['Output A'],
    'action-b': ['Output B'],
  },
  blockedActionIds: ['action-c'],
  blockedReasons: {
    'action-c': 'Motiu C',
  },
  primaryActionId: 'action-a',
  nextPhaseActionId: 'action-b',
};

export const ADMIN_MARKETING_BOOTSTRAP_PLAN: AdminMarketingBootstrapStep[] = [
  { window: 'Dies 1-3', title: 'T', objective: 'O', outputs: [] },
];

export const ADMIN_MARKETING_PHASE_EVIDENCE = [
  { actionId: 'action-a', proof: 'Prova material A', whereToCheck: 'Lloc verificable A', unlockSignal: 'Senyal clar A' },
  { actionId: 'action-b', proof: 'Prova material B', whereToCheck: 'Lloc verificable B', unlockSignal: 'Senyal clar B' },
];

export const ADMIN_MARKETING_CHANNEL_DECISION_MATRIX = [
  { actionId: 'action-c', startWhen: 'Quan hi ha base mínima escrita', firstMove: 'Fer el primer moviment del canal', successSignal: 'Senyal comercial verificable', stopIf: 'Parar si no hi ha resposta clara', adminHref: '/admin/leads', adminLabel: 'Obrir leads' },
  { actionId: 'action-d', startWhen: 'Quan hi ha proves socials disponibles', firstMove: 'Demanar ressenyes a clients recents', successSignal: 'Cinc ressenyes noves publicades', stopIf: 'Parar si no hi ha clients recents', adminHref: '/admin/google-reviews', adminLabel: 'Obrir ressenyes' },
  { actionId: 'action-e', startWhen: 'Quan hi ha zona prioritària clara', firstMove: 'Crear una pàgina local concreta', successSignal: 'Pàgina publicada i mesurada', stopIf: 'Parar si no hi ha proposta clara', adminHref: '/admin/text-manager', adminLabel: 'Editar textos' },
  { actionId: 'action-f', startWhen: 'Quan hi ha material real visible', firstMove: 'Publicar tres peces orgàniques', successSignal: 'Converses o clics qualificats', stopIf: 'Parar si només genera likes', adminHref: '/admin/social', adminLabel: 'Obrir social' },
];

export const ADMIN_MANUAL_OPERATING_RHYTHM = [
  { cadence: 'Cada matí', title: 'Obrir comandament', objective: 'Llegir salut i accions prioritàries', href: '/admin', cta: 'Obrir Dashboard', signals: ['salut', 'alertes'], doneWhen: ['alerta llegida', 'prioritat triada'], ifOffTrack: 'Parar fronts nous fins entendre el bloqueig' },
  { cadence: 'Durant el dia', title: 'Treballar cues', objective: 'Atacar cues comercials i operatives', href: '/admin/tasks', cta: 'Obrir Tasques', signals: ['SLA', 'tasques'], doneWhen: ['cua revisada', 'tasca prioritzada'], ifOffTrack: 'Tancar urgències abans de continuar' },
  { cadence: 'Cada divendres', title: 'Tancar setmana', objective: 'Revisar finances i reserves properes', href: '/admin/economia', cta: 'Obrir Finances', signals: ['cobraments', 'reserves'], doneWhen: ['cobrament revisat', 'reserva revisada'], ifOffTrack: 'Crear tasques abans de tancar setmana' },
  { cadence: 'Cada mes', title: 'Decidir amb dades', objective: 'Revisar reporting i experiments oberts', href: '/admin/reporting', cta: 'Obrir Reporting', signals: ['marge', 'canals'], doneWhen: ['canal revisat', 'experiment triat'], ifOffTrack: 'No escalar pressupost sense dades' },
];

export const ADMIN_MANUAL_OPERATING_FLOW = [
  { step: '01', title: 'Captar demanda', objective: 'Convertir visites en entrades comercials', entryHref: '/admin/leads', entryLabel: 'Obrir Entrades', systemReads: ['origen', 'formulari'], manualDecisions: ['validar demanda'], successSignal: 'Lead qualificable amb origen clar', nextStep: 'Qualificar abans de pressupostar' },
  { step: '02', title: 'Qualificar pipeline', objective: 'Prioritzar oportunitats comercials reals', entryHref: '/admin/sales-ops', entryLabel: 'Obrir Sales Ops', systemReads: ['score', 'SLA'], manualDecisions: ['decidir seguiment'], successSignal: 'Prioritat i acció següent visibles', nextStep: 'Preparar proposta amb marge' },
  { step: '03', title: 'Pressupostar marge', objective: 'Fer proposta clara i rendible', entryHref: '/admin/presupuestos', entryLabel: 'Obrir Pressupostos', systemReads: ['pack', 'marge'], manualDecisions: ['validar oferta'], successSignal: 'Proposta enviada amb marge controlat', nextStep: 'Convertir en reserva' },
  { step: '04', title: 'Reservar operativa', objective: 'Preparar calendari i execució', entryHref: '/admin/bookings', entryLabel: 'Obrir Reserves', systemReads: ['calendari', 'checklist'], manualDecisions: ['resoldre bloqueig'], successSignal: 'Reserva preparada sense bloquejos', nextStep: 'Cobrar i executar' },
  { step: '05', title: 'Cobrar i aprendre', objective: 'Controlar finances i recurrència', entryHref: '/admin/economia', entryLabel: 'Obrir Finances', systemReads: ['cobrament', 'marge'], manualDecisions: ['prioritzar cobrament'], successSignal: 'Event cobrat i marge visible', nextStep: 'Reactivar client' },
  { step: '06', title: 'Reactivar clients', objective: 'Convertir clients contents en recurrència', entryHref: '/admin/clientes', entryLabel: 'Obrir Clients', systemReads: ['LTV', 'dormants'], manualDecisions: ['decidir reactivació'], successSignal: 'Client retornat al sistema comercial', nextStep: 'Reiniciar captació amb aprenentatge' },
];

export const ADMIN_MANUAL_OPERATING_GATES = [
  { step: '01', title: 'Context abans de qualificar', checkBeforeMoving: 'Origen i primer contacte han de quedar clars', riskIfSkipped: 'El seguiment queda dispers i sense prioritat', ownerQuestion: 'Sé quin primer moviment comercial toca ara?' },
  { step: '02', title: 'Qualificació abans de proposta', checkBeforeMoving: 'Prioritat i necessitat real han de quedar clares', riskIfSkipped: 'Es pressuposta soroll sense probabilitat real', ownerQuestion: 'Aquesta oportunitat mereix proposta ara?' },
  { step: '03', title: 'Marge abans d’enviar', checkBeforeMoving: 'Pack, transport i marge mínim han de quedar revisats', riskIfSkipped: 'La venda pot convertir-se en pèrdua operativa', ownerQuestion: 'Acceptaria aquesta venda amb el cost real?' },
  { step: '04', title: 'Operativa abans de reserva', checkBeforeMoving: 'Calendari, checklist i inventari han de quedar visibles', riskIfSkipped: 'Els bloquejos apareixen massa tard per resoldre', ownerQuestion: 'Es podria executar sense dependre de memòria?' },
  { step: '05', title: 'Caixa abans de tancar', checkBeforeMoving: 'Cobraments i rendibilitat han de quedar revisats', riskIfSkipped: 'El negoci acumula feina sense aprendre marge', ownerQuestion: 'Ha deixat diners i cap deute invisible?' },
  { step: '06', title: 'Recurrència abans de refredar', checkBeforeMoving: 'Ressenya, referral o reactivació han de quedar decidits', riskIfSkipped: 'El client content es perd fora del sistema comercial', ownerQuestion: 'Aquest client pot tornar o recomanar ara?' },
];

export const ADMIN_MANUAL_OPERATING_HANDOFFS = [
  { fromStep: '01', toStep: '02', artifact: 'Lead amb origen i primer contacte assignat', nextWorkspace: 'Sales Ops', nextWorkspaceHref: '/admin/sales-ops', handoffRule: 'No passa a qualificació sense origen ni canal de resposta' },
  { fromStep: '02', toStep: '03', artifact: 'Oportunitat prioritzada amb risc i seguiment', nextWorkspace: 'Pressupostos', nextWorkspaceHref: '/admin/presupuestos', handoffRule: 'No passa a proposta sense demanda real i prioritat comercial' },
  { fromStep: '03', toStep: '04', artifact: 'Pressupost amb marge i condicions revisades', nextWorkspace: 'Reserves', nextWorkspaceHref: '/admin/bookings', handoffRule: 'No passa a reserva sense rendibilitat i condicions clares' },
  { fromStep: '04', toStep: '05', artifact: 'Reserva preparada amb calendari i checklist', nextWorkspace: 'Finances', nextWorkspaceHref: '/admin/economia', handoffRule: 'No passa a finances si encara depèn de memòria' },
  { fromStep: '05', toStep: '06', artifact: 'Resultat econòmic revisat i aprenentatge registrat', nextWorkspace: 'Clients', nextWorkspaceHref: '/admin/clientes', handoffRule: 'No passa a recurrència sense resultat econòmic entès' },
  { fromStep: '06', toStep: '01', artifact: 'Client convertit en ressenya o aprenentatge útil', nextWorkspace: 'Entrades', nextWorkspaceHref: '/admin/leads', handoffRule: 'No torna a captació sense aprenentatge útil registrat' },
];

export const ADMIN_MANUAL_OPERATING_STEP_CHECKLIST = [
  { step: '01', doneLabel: 'Demanda capturada i preparada per qualificar', checks: ['origen identificat', 'necessitat entesa', 'primer contacte assignat'], blockedIf: 'falta origen o primer moviment comercial' },
  { step: '02', doneLabel: 'Oportunitat qualificada amb prioritat real', checks: ['prioritat visible', 'risc identificat', 'canal triat'], blockedIf: 'continua sent soroll sense acció següent' },
  { step: '03', doneLabel: 'Proposta preparada amb marge defensable', checks: ['pack alineat', 'transport revisat', 'marge validat'], blockedIf: 'el preu no explica cost real ni condicions' },
  { step: '04', doneLabel: 'Reserva preparada sense bloquejos crítics', checks: ['calendari governat', 'checklist visible', 'inventari revisat'], blockedIf: 'la preparació depèn encara de memòria' },
  { step: '05', doneLabel: 'Event controlat econòmicament', checks: ['cobraments revisats', 'marge entès', 'deute convertit en acció'], blockedIf: 'queda cobrament o marge sense decisió' },
  { step: '06', doneLabel: 'Client retornat al sistema comercial', checks: ['post-event registrat', 'ressenya decidida', 'reactivació valorada'], blockedIf: 'el client queda refredat sense decisió' },
];

export const ADMIN_MANUAL_OPERATING_EXCEPTIONS = [
  { step: '01', trigger: 'Lead sense origen o canal clar', firstMove: 'Completar context mínim abans de qualificar', actionHref: '/admin/leads', actionLabel: 'Obrir Entrades', doNotAdvanceUntil: 'el lead tingui origen i primer contacte assignat' },
  { step: '02', trigger: 'Oportunitat amb timing ambigu', firstMove: 'Revisar Sales Ops i decidir seguiment', actionHref: '/admin/sales-ops', actionLabel: 'Obrir Sales Ops', doNotAdvanceUntil: 'la prioritat i acció següent siguin clares' },
  { step: '03', trigger: 'Pressupost sense marge defensable', firstMove: 'Ajustar pack i condicions abans d’enviar', actionHref: '/admin/presupuestos', actionLabel: 'Obrir Pressupostos', doNotAdvanceUntil: 'el marge mínim quedi revisat' },
  { step: '04', trigger: 'Reserva amb preparació dispersa', firstMove: 'Convertir bloquejos en checklist o tasca', actionHref: '/admin/bookings', actionLabel: 'Obrir Reserves', doNotAdvanceUntil: 'la reserva sigui executable sense memòria' },
  { step: '05', trigger: 'Cobrament o marge sense decisió', firstMove: 'Convertir risc financer en acció responsable', actionHref: '/admin/economia', actionLabel: 'Obrir Finances', doNotAdvanceUntil: 'el resultat econòmic quedi governat' },
  { step: '06', trigger: 'Client sense decisió post-event', firstMove: 'Decidir ressenya referral o reactivació', actionHref: '/admin/clientes', actionLabel: 'Obrir Clients', doNotAdvanceUntil: 'hi hagi aprenentatge o recurrència decidida' },
];

export const ADMIN_MANUAL_OPERATING_EVIDENCE = [
  { step: '01', artifact: 'Lead amb origen i primer contacte assignat', proof: 'Entrades mostra origen estat i moviment comercial', proofHref: '/admin/leads', proofLabel: 'Comprovar Entrades', ownerCheck: 'Puc explicar el primer moviment sense nota externa' },
  { step: '02', artifact: 'Oportunitat prioritzada amb risc i seguiment', proof: 'Sales Ops mostra score risc i canal de seguiment', proofHref: '/admin/sales-ops', proofLabel: 'Comprovar Sales Ops', ownerCheck: 'Sé per què aquesta proposta mereix avançar ara' },
  { step: '03', artifact: 'Pressupost amb marge i condicions revisades', proof: 'Pressupostos mostra import transport i marge abans d’enviar', proofHref: '/admin/presupuestos', proofLabel: 'Comprovar Pressupost', ownerCheck: 'El preu es defensa sense recalcular fora del sistema' },
  { step: '04', artifact: 'Reserva preparada amb calendari i checklist', proof: 'Reserves mostra checklist inventari portal i documents', proofHref: '/admin/bookings', proofLabel: 'Comprovar Reserves', ownerCheck: 'Sé què falta si l’event fos demà mateix' },
  { step: '05', artifact: 'Resultat econòmic amb cobrament i marge', proof: 'Finances mostra cobrament marge forecast i desviacions', proofHref: '/admin/economia', proofLabel: 'Comprovar Finances', ownerCheck: 'No queda cap deute de caixa sense decisió' },
  { step: '06', artifact: 'Client retornat al sistema comercial', proof: 'Clients mostra historial LTV post-event i reactivació', proofHref: '/admin/clientes', proofLabel: 'Comprovar Clients', ownerCheck: 'El client deixa valor aprofitable per captar millor' },
];

export const ADMIN_MANUAL_SECTIONS = [
  {
    icon: 'X',
    title: 'Captació',
    summary: 'Àrea principal',
    capabilities: [
      { title: 'Gestionar entrades', description: 'Treballar entrades comercials', href: '/admin/leads', cta: 'Obrir Entrades', tone: 'warning', flowStep: '01', signals: ['origen', 'prioritat', 'estat'] },
      { title: 'Qualificar pipeline', description: 'Ordenar oportunitats comercials', href: '/admin/sales-ops', cta: 'Obrir Sales Ops', tone: 'info', flowStep: '02', signals: ['SLA', 'score', 'estat'] },
      { title: 'Fer pressupostos', description: 'Enviar proposta rendible', href: '/admin/presupuestos', cta: 'Obrir Pressupostos', tone: 'success', flowStep: '03', signals: ['marge', 'pack', 'preu'] },
      { title: 'Preparar reserves', description: 'Controlar execució operativa', href: '/admin/bookings', cta: 'Obrir Reserves', tone: 'success', flowStep: '04', signals: ['calendari', 'checklist', 'inventari'] },
      { title: 'Controlar finances', description: 'Vigilar cobraments i marge', href: '/admin/economia', cta: 'Obrir Finances', tone: 'danger', flowStep: '05', signals: ['marge', 'cobrament', 'risc'] },
      { title: 'Reactivar clients', description: 'Tornar valor al pipeline', href: '/admin/clientes', cta: 'Obrir Clients', tone: 'info', flowStep: '06', signals: ['LTV', 'dormant', 'referral'] },
      { title: 'Planificar social', description: 'Fer visible la marca', href: '/admin/social', cta: 'Obrir Social', tone: 'success', flowStep: '01', signals: ['post', 'canal', 'calendari'] },
      { title: 'Treballar tasques', description: 'Evitar feina a memòria', href: '/admin/tasks', cta: 'Obrir Tasques', tone: 'warning', flowStep: '04', signals: ['avui', 'vençut', 'bloquejat'] },
      { title: 'Llegir reporting', description: 'Decidir amb dades', href: '/admin/reporting', cta: 'Obrir Reporting', tone: 'info', flowStep: '05', signals: ['canal', 'marge', 'tendència'] },
      { title: 'Mantenir sistema', description: 'Evitar regressions operatives', href: '/admin/salut', cta: 'Obrir Salut', tone: 'danger', flowStep: '05', signals: ['alerta', 'check', 'prioritat'] },
    ],
  },
];

export const ADMIN_MARKETING_PHASES = [
  { id: 'action-a', title: 'A', description: '', phase: 'FASE_0', cost: '', effort: '' },
  { id: 'action-b', title: 'B', description: '', phase: 'FASE_0', cost: '', effort: '' },
  { id: 'action-c', title: 'C', description: '', phase: 'FASE_1', cost: '', effort: '' },
  { id: 'action-d', title: 'D', description: '', phase: 'FASE_1', cost: '', effort: '' },
  { id: 'action-e', title: 'E', description: '', phase: 'FASE_1', cost: '', effort: '' },
  { id: 'action-f', title: 'F', description: '', phase: 'FASE_1', cost: '', effort: '' },
];
`;

describe('check-admin-manual-consistency (integració)', () => {
  it('passa amb una configuració completament vàlida', () => {
    const result = runGuard(VALID_MANUAL);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
    expect(result.stdout).toContain('2 req');
    expect(result.stdout).toContain('1 blk');
    expect(result.stdout).toContain('1 finestres');
    expect(result.stdout).toContain('2 proves');
    expect(result.stdout).toContain('4 canals');
    expect(result.stdout).toContain('4 ritmes');
    expect(result.stdout).toContain('6 passos OS');
    expect(result.stdout).toContain('6 gates');
    expect(result.stdout).toContain('6 handoffs');
    expect(result.stdout).toContain('6 checklists');
    expect(result.stdout).toContain('6 excepcions');
    expect(result.stdout).toContain('6 evidències');
    expect(result.stdout).toContain('10 capacitats');
  });

  it('falla si un requiredActionId no existeix a ADMIN_MARKETING_PHASES', () => {
    const src = VALID_MANUAL.replace("'action-a', 'action-b'", "'action-a', 'inexistent'")
      .replace("'action-b': ['Output B']", "'inexistent': ['Output X']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('requiredActionIds');
    expect(result.stderr).toContain('inexistent');
  });

  it('falla si un blockedActionId no existeix a ADMIN_MARKETING_PHASES', () => {
    const src = VALID_MANUAL.replace("'action-c'", "'ghost-action'")
      .replace("'action-c': 'Motiu C'", "'ghost-action': 'Motiu'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('blockedActionIds');
    expect(result.stderr).toContain('ghost-action');
  });

  it('falla si requiredOutputs no cobreix un requiredActionId', () => {
    const src = VALID_MANUAL.replace("'action-b': ['Output B'],", '');
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('requiredOutputs no cobreix');
    expect(result.stderr).toContain('action-b');
  });

  it('falla si requiredOutputs té una clau extra no a requiredActionIds', () => {
    const src = VALID_MANUAL.replace(
      "'action-b': ['Output B'],",
      "'action-b': ['Output B'], 'extra-key': ['X'],"
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('clau extra');
    expect(result.stderr).toContain('extra-key');
  });

  it('falla si blockedReasons no cobreix un blockedActionId', () => {
    const src = VALID_MANUAL.replace("'action-c': 'Motiu C',", '');
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('blockedReasons no cobreix');
    expect(result.stderr).toContain('action-c');
  });

  it('falla si ADMIN_MARKETING_PHASE_EVIDENCE no cobreix un requiredActionId', () => {
    const src = VALID_MANUAL.replace(
      "{ actionId: 'action-b', proof: 'Prova material B', whereToCheck: 'Lloc verificable B', unlockSignal: 'Senyal clar B' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MARKETING_PHASE_EVIDENCE no cobreix');
    expect(result.stderr).toContain('action-b');
  });

  it('falla si ADMIN_MARKETING_PHASE_EVIDENCE té un actionId extra', () => {
    const src = VALID_MANUAL.replace(
      "{ actionId: 'action-b', proof: 'Prova material B', whereToCheck: 'Lloc verificable B', unlockSignal: 'Senyal clar B' },",
      "{ actionId: 'action-b', proof: 'Prova material B', whereToCheck: 'Lloc verificable B', unlockSignal: 'Senyal clar B' }, { actionId: 'extra-key', proof: 'Prova extra', whereToCheck: 'Lloc extra', unlockSignal: 'Senyal extra' },"
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('actionId extra');
    expect(result.stderr).toContain('extra-key');
  });

  it('falla si una prova de Fase 0 queda buida o massa curta', () => {
    const src = VALID_MANUAL.replace("proof: 'Prova material A'", "proof: ''");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('proof buit o massa curt');
    expect(result.stderr).toContain('action-a');
  });

  it('falla si la matriu de canal gratuït referencia una acció inexistent', () => {
    const src = VALID_MANUAL.replace("actionId: 'action-c', startWhen", "actionId: 'ghost-channel', startWhen");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MARKETING_CHANNEL_DECISION_MATRIX');
    expect(result.stderr).toContain('ghost-channel');
  });

  it('falla si la matriu de canal gratuït referencia una acció que no és FASE_1', () => {
    const src = VALID_MANUAL.replace("actionId: 'action-c', startWhen", "actionId: 'action-a', startWhen");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('FASE_1');
    expect(result.stderr).toContain('action-a');
  });

  it('falla si una opció de canal gratuït no té condició de parada', () => {
    const src = VALID_MANUAL.replace("stopIf: 'Parar si no hi ha resposta clara'", "stopIf: ''");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('stopIf buit o massa curt');
    expect(result.stderr).toContain('action-c');
  });

  it('falla si una opció de canal gratuït no apunta a admin', () => {
    const src = VALID_MANUAL.replace("adminHref: '/admin/social'", "adminHref: '/public/social'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('adminHref /admin');
    expect(result.stderr).toContain('action-f');
  });

  it('falla si primaryActionId no existeix a ADMIN_MARKETING_PHASES', () => {
    const src = VALID_MANUAL.replace("primaryActionId: 'action-a'", "primaryActionId: 'ghost'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('primaryActionId');
    expect(result.stderr).toContain('ghost');
  });

  it('falla si primaryActionId és un canal bloquejat', () => {
    const src = VALID_MANUAL.replace("primaryActionId: 'action-a'", "primaryActionId: 'action-c'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('primaryActionId');
    expect(result.stderr).toContain('canal bloquejat');
  });

  it('falla si nextPhaseActionId no existeix a ADMIN_MARKETING_PHASES', () => {
    const src = VALID_MANUAL.replace("nextPhaseActionId: 'action-b'", "nextPhaseActionId: 'ghost'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('nextPhaseActionId');
    expect(result.stderr).toContain('ghost');
  });

  it('falla si ADMIN_MARKETING_BOOTSTRAP_PLAN no té cap finestra', () => {
    const src = VALID_MANUAL.replace(
      "{ window: 'Dies 1-3', title: 'T', objective: 'O', outputs: [] },",
      '{ title: "T", objective: "O", outputs: [] },'
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('finestra');
  });

  it('falla si el ritme operatiu queda amb menys de 4 cadències', () => {
    const src = VALID_MANUAL.replace(
      "{ cadence: 'Cada mes', title: 'Decidir amb dades', objective: 'Revisar reporting i experiments oberts', href: '/admin/reporting', cta: 'Obrir Reporting', signals: ['marge', 'canals'], doneWhen: ['canal revisat', 'experiment triat'], ifOffTrack: 'No escalar pressupost sense dades' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_RHYTHM');
    expect(result.stderr).toContain('4 cadències');
  });

  it('falla si una cadència operativa no apunta a admin', () => {
    const src = VALID_MANUAL.replace("href: '/admin/tasks'", "href: '/public'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('href /admin');
    expect(result.stderr).toContain('Durant el dia');
  });

  it('falla si una cadència operativa no té prou senyals', () => {
    const src = VALID_MANUAL.replace("signals: ['salut', 'alertes']", "signals: ['salut']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('almenys 2 senyals');
    expect(result.stderr).toContain('Cada matí');
  });

  it('falla si una cadència operativa no té criteris de tancament', () => {
    const src = VALID_MANUAL.replace("doneWhen: ['alerta llegida', 'prioritat triada']", "doneWhen: ['alerta llegida']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('doneWhen');
    expect(result.stderr).toContain('Cada matí');
  });

  it('falla si una cadència operativa no diu què fer quan va malament', () => {
    const src = VALID_MANUAL.replace("ifOffTrack: 'No escalar pressupost sense dades'", "ifOffTrack: ''");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ifOffTrack buit o massa curt');
    expect(result.stderr).toContain('Cada mes');
  });

  it('falla si el flux operatiu no cobreix un step canònic', () => {
    const src = VALID_MANUAL.replace(
      "{ step: '05', title: 'Cobrar i aprendre', objective: 'Controlar finances i recurrència', entryHref: '/admin/economia', entryLabel: 'Obrir Finances', systemReads: ['cobrament', 'marge'], manualDecisions: ['prioritzar cobrament'], successSignal: 'Event cobrat i marge visible', nextStep: 'Reactivar client' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_FLOW');
    expect(result.stderr).toContain("step canònic '05'");
  });

  it('falla si el flux operatiu té un step duplicat', () => {
    const src = VALID_MANUAL.replace("step: '05', title: 'Cobrar i aprendre'", "step: '04', title: 'Cobrar i aprendre'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_FLOW');
    expect(result.stderr).toContain('step duplicat');
    expect(result.stderr).toContain('04');
  });

  it('falla si el flux operatiu referencia un step no canònic', () => {
    const src = VALID_MANUAL.replace("step: '05', title: 'Cobrar i aprendre'", "step: '07', title: 'Cobrar i aprendre'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('step no canònic');
    expect(result.stderr).toContain('07');
  });

  it('falla si el flux operatiu queda fora de l’ordre canònic', () => {
    const src = VALID_MANUAL
      .replace("step: '02', title: 'Qualificar pipeline'", "step: '03', title: 'Qualificar pipeline'")
      .replace("step: '03', title: 'Pressupostar marge'", "step: '02', title: 'Pressupostar marge'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ordre incorrecte');
    expect(result.stderr).toContain("posició 2");
  });

  it('falla si un pas del flux operatiu no apunta a admin', () => {
    const src = VALID_MANUAL.replace("entryHref: '/admin/bookings'", "entryHref: '/bookings'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('entryHref /admin');
    expect(result.stderr).toContain('04');
  });

  it('falla si un pas del flux operatiu no té prou lectures del sistema', () => {
    const src = VALID_MANUAL.replace("systemReads: ['pack', 'marge']", "systemReads: ['pack']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('systemReads');
    expect(result.stderr).toContain('03');
  });

  it('falla si una capacitat del manual no té flowStep', () => {
    const src = VALID_MANUAL.replace("flowStep: '03', signals: ['marge', 'pack', 'preu']", "signals: ['marge', 'pack', 'preu']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('no té flowStep');
    expect(result.stderr).toContain('Fer pressupostos');
  });

  it('falla si una capacitat del manual referencia un flowStep inexistent', () => {
    const src = VALID_MANUAL.replace("flowStep: '02'", "flowStep: '99'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('flowStep inexistent');
    expect(result.stderr).toContain('99');
  });

  it('falla si una capacitat del manual no té prou senyals', () => {
    const src = VALID_MANUAL.replace("signals: ['avui', 'vençut', 'bloquejat']", "signals: ['avui']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('almenys 3 senyals');
    expect(result.stderr).toContain('Treballar tasques');
  });

  it('falla si un pas del flux operatiu no té cap capacitat connectada', () => {
    const src = VALID_MANUAL
      .replace("flowStep: '03', signals: ['marge', 'pack', 'preu']", "flowStep: '02', signals: ['marge', 'pack', 'preu']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("step '03'");
    expect(result.stderr).toContain('cap capability connectada');
  });

  it('falla si un gate del flux operatiu referencia un pas inexistent', () => {
    const src = VALID_MANUAL.replace("step: '02', title: 'Qualificació abans de proposta'", "step: '99', title: 'Qualificació abans de proposta'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_GATES');
    expect(result.stderr).toContain('99');
  });

  it('falla si hi ha un gate duplicat per al mateix pas', () => {
    const src = VALID_MANUAL.replace(
      "{ step: '05', title: 'Caixa abans de tancar', checkBeforeMoving: 'Cobraments i rendibilitat han de quedar revisats', riskIfSkipped: 'El negoci acumula feina sense aprendre marge', ownerQuestion: 'Ha deixat diners i cap deute invisible?' },",
      "{ step: '04', title: 'Caixa abans de tancar', checkBeforeMoving: 'Cobraments i rendibilitat han de quedar revisats', riskIfSkipped: 'El negoci acumula feina sense aprendre marge', ownerQuestion: 'Ha deixat diners i cap deute invisible?' },"
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('step duplicat');
    expect(result.stderr).toContain('04');
  });

  it('falla si un pas del flux operatiu no té gate', () => {
    const src = VALID_MANUAL.replace(
      "{ step: '04', title: 'Operativa abans de reserva', checkBeforeMoving: 'Calendari, checklist i inventari han de quedar visibles', riskIfSkipped: 'Els bloquejos apareixen massa tard per resoldre', ownerQuestion: 'Es podria executar sense dependre de memòria?' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("step '04'");
    expect(result.stderr).toContain('no cobreix');
  });

  it('falla si un gate del flux operatiu no té pregunta de propietari', () => {
    const src = VALID_MANUAL.replace("ownerQuestion: 'Ha deixat diners i cap deute invisible?'", "ownerQuestion: ''");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ownerQuestion buit o massa curt');
    expect(result.stderr).toContain('05');
  });

  it('falla si un handoff del flux operatiu referencia un pas destí inexistent', () => {
    const src = VALID_MANUAL.replace("toStep: '03', artifact: 'Oportunitat", "toStep: '99', artifact: 'Oportunitat");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_HANDOFFS');
    expect(result.stderr).toContain('99');
  });

  it('falla si un handoff salta fora de la seqüència canònica del flux', () => {
    const src = VALID_MANUAL.replace("fromStep: '02', toStep: '03'", "fromStep: '02', toStep: '04'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("pas següent '03'");
    expect(result.stderr).toContain("no a '04'");
  });

  it('falla si hi ha dos handoffs sortint del mateix pas', () => {
    const src = VALID_MANUAL.replace("fromStep: '05', toStep: '06'", "fromStep: '04', toStep: '06'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('fromStep duplicat');
    expect(result.stderr).toContain('04');
  });

  it('falla si un pas del flux operatiu no té handoff sortint', () => {
    const src = VALID_MANUAL.replace(
      "{ fromStep: '04', toStep: '05', artifact: 'Reserva preparada amb calendari i checklist', nextWorkspace: 'Finances', nextWorkspaceHref: '/admin/economia', handoffRule: 'No passa a finances si encara depèn de memòria' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("fromStep '04'");
    expect(result.stderr).toContain('no cobreix');
  });

  it('falla si un handoff no apunta a un workspace admin', () => {
    const src = VALID_MANUAL.replace("nextWorkspaceHref: '/admin/bookings'", "nextWorkspaceHref: '/bookings'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('nextWorkspaceHref /admin');
    expect(result.stderr).toContain('03');
  });

  it('falla si una checklist de pas referencia un pas inexistent', () => {
    const src = VALID_MANUAL.replace("step: '02', doneLabel: 'Oportunitat", "step: '99', doneLabel: 'Oportunitat");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_STEP_CHECKLIST');
    expect(result.stderr).toContain('99');
  });

  it('falla si hi ha dues checklists per al mateix pas', () => {
    const src = VALID_MANUAL.replace("step: '05', doneLabel: 'Event controlat econòmicament'", "step: '04', doneLabel: 'Event controlat econòmicament'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('step duplicat');
    expect(result.stderr).toContain('04');
  });

  it('falla si un pas del flux operatiu no té checklist', () => {
    const src = VALID_MANUAL.replace(
      "{ step: '04', doneLabel: 'Reserva preparada sense bloquejos crítics', checks: ['calendari governat', 'checklist visible', 'inventari revisat'], blockedIf: 'la preparació depèn encara de memòria' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("step '04'");
    expect(result.stderr).toContain('no cobreix');
  });

  it('falla si una checklist de pas no té prou checks', () => {
    const src = VALID_MANUAL.replace("checks: ['pack alineat', 'transport revisat', 'marge validat']", "checks: ['pack alineat']");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('almenys 3 checks');
    expect(result.stderr).toContain('03');
  });

  it('falla si una excepció operativa no cobreix un pas del flux', () => {
    const src = VALID_MANUAL.replace(
      "{ step: '04', trigger: 'Reserva amb preparació dispersa', firstMove: 'Convertir bloquejos en checklist o tasca', actionHref: '/admin/bookings', actionLabel: 'Obrir Reserves', doNotAdvanceUntil: 'la reserva sigui executable sense memòria' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_EXCEPTIONS');
    expect(result.stderr).toContain("step '04'");
  });

  it('falla si una excepció operativa no apunta a un workspace admin', () => {
    const src = VALID_MANUAL.replace("actionHref: '/admin/economia'", "actionHref: '/economia'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('actionHref /admin');
    expect(result.stderr).toContain('05');
  });

  it('falla si una evidència operativa no cobreix un pas del flux', () => {
    const src = VALID_MANUAL.replace(
      "{ step: '04', artifact: 'Reserva preparada amb calendari i checklist', proof: 'Reserves mostra checklist inventari portal i documents', proofHref: '/admin/bookings', proofLabel: 'Comprovar Reserves', ownerCheck: 'Sé què falta si l’event fos demà mateix' },",
      ''
    );
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ADMIN_MANUAL_OPERATING_EVIDENCE');
    expect(result.stderr).toContain("step '04'");
  });

  it('falla si una evidència operativa no apunta a un workspace admin', () => {
    const src = VALID_MANUAL.replace("proofHref: '/admin/economia'", "proofHref: '/economia'");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('proofHref /admin');
    expect(result.stderr).toContain('05');
  });

  it('falla si una evidència operativa no té comprovació de propietari', () => {
    const src = VALID_MANUAL.replace("ownerCheck: 'No queda cap deute de caixa sense decisió'", "ownerCheck: ''");
    const result = runGuard(src);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('ownerCheck buit o massa curt');
    expect(result.stderr).toContain('05');
  });

  it('falla si el fitxer adminManual.ts no existeix', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'oe-admin-consistency-empty-'));
    const result = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('no trobat');
  });
});
