// @ts-check
// Valida la consistència interna dels constants del manual de màrqueting:
// - Tots els IDs del gate (required, blocked, primary, nextPhase) existeixen a ADMIN_MARKETING_PHASES
// - requiredOutputs cobreix exactament els requiredActionIds
// - blockedReasons cobreix exactament els blockedActionIds
// - ADMIN_MARKETING_PHASE_EVIDENCE cobreix exactament els requiredActionIds
// - cada prova del tracker té proof, whereToCheck i unlockSignal amb contingut
// - ADMIN_MARKETING_CHANNEL_DECISION_MATRIX només referencia accions Fase 1 i té decisió operativa completa
// - ADMIN_MANUAL_OPERATING_RHYTHM té cadències accionables amb href, CTA, senyals i criteris de tancament
// - ADMIN_MANUAL_OPERATING_FLOW cobreix el cicle comercial/operatiu amb passos accionables i hrefs admin
// - ADMIN_MANUAL_OPERATING_GATES cobreix cada pas del flux amb comprovació, risc i pregunta de propietari
// - ADMIN_MANUAL_OPERATING_HANDOFFS cobreix cada transició del flux amb artefacte i workspace següent
// - ADMIN_MANUAL_OPERATING_STEP_CHECKLIST cobreix cada pas amb criteris binaris de tancament
// - ADMIN_MANUAL_OPERATING_EXCEPTIONS cobreix cada pas amb primer moviment i workspace de resolució
// - ADMIN_MANUAL_OPERATING_EVIDENCE cobreix cada pas amb artefacte i prova verificable dins l'admin
// - primaryActionId i nextPhaseActionId no estan als blockedActionIds
// - El pla bootstrap té ≥1 finestra
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_MANUAL_PATH = path.join(process.cwd(), 'lib', 'constants', 'adminManual.ts');

let failures = 0;

/** @type {(msg: string) => void} */
function fail(msg) {
  console.error(`[admin-manual-consistency] FAIL: ${msg}`);
  process.exitCode = 1;
  failures++;
}

/**
 * Extreu el bloc d'array [] d'una constant exportada, saltant anotacions de tipus.
 * Busca '= [' per evitar '[' de Type[] a les anotacions.
 * @param {string} source
 * @param {string} constName
 * @returns {string}
 */
function extractConstArrayBlock(source, constName) {
  const nameIdx = source.indexOf(constName);
  if (nameIdx === -1) return '';
  // Skip type annotations (e.g. Type[]) by searching from '=' onwards
  const assignIdx = source.indexOf('=', nameIdx);
  if (assignIdx === -1) return '';
  const bracketIdx = source.indexOf('[', assignIdx);
  if (bracketIdx === -1) return '';
  let depth = 0;
  let end = -1;
  for (let i = bracketIdx; i < source.length; i++) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return end === -1 ? '' : source.slice(bracketIdx, end + 1);
}

/**
 * Extreu el bloc d'objecte {} d'una constant exportada, saltant anotacions de tipus.
 * Busca '= {' per evitar capturar cossos d'interfície.
 * @param {string} source
 * @param {string} constName
 * @returns {string}
 */
function extractConstObjectBlock(source, constName) {
  const nameIdx = source.indexOf(constName);
  if (nameIdx === -1) return '';
  const assignIdx = source.indexOf('=', nameIdx);
  if (assignIdx === -1) return '';
  const braceIdx = source.indexOf('{', assignIdx);
  if (braceIdx === -1) return '';
  let depth = 0;
  let end = -1;
  for (let i = braceIdx; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return end === -1 ? '' : source.slice(braceIdx, end + 1);
}

/**
 * Extreu el bloc d'array [] d'una propietat dins un bloc d'objecte, gestionant bracket nesting.
 * @param {string} block  bloc d'objecte ja extret (e.g. de extractConstObjectBlock)
 * @param {string} propName
 * @returns {string}
 */
function extractPropArrayBlock(block, propName) {
  const propPattern = new RegExp(`\\b${propName}\\s*:`);
  const propMatch = propPattern.exec(block);
  if (!propMatch) return '';
  const bracketIdx = block.indexOf('[', propMatch.index);
  if (bracketIdx === -1) return '';
  let depth = 0;
  let end = -1;
  for (let i = bracketIdx; i < block.length; i++) {
    if (block[i] === '[') depth++;
    else if (block[i] === ']') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return end === -1 ? '' : block.slice(bracketIdx, end + 1);
}

/**
 * Extreu el bloc d'objecte {} d'una propietat dins un bloc, gestionant bracket nesting.
 * @param {string} block  bloc d'objecte ja extret
 * @param {string} propName
 * @returns {string}
 */
function extractPropObjectBlock(block, propName) {
  const propPattern = new RegExp(`\\b${propName}\\s*:`);
  const propMatch = propPattern.exec(block);
  if (!propMatch) return '';
  const braceIdx = block.indexOf('{', propMatch.index);
  if (braceIdx === -1) return '';
  let depth = 0;
  let end = -1;
  for (let i = braceIdx; i < block.length; i++) {
    if (block[i] === '{') depth++;
    else if (block[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return end === -1 ? '' : block.slice(braceIdx, end + 1);
}

/** @type {(block: string) => string[]} */
function extractStringLiterals(block) {
  return [...block.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

/** @type {(block: string) => string[]} */
function extractObjectTopLevelKeys(block) {
  const keys = [];
  let depth = 0;
  let i = 0;
  while (i < block.length) {
    if (block[i] === '{' || block[i] === '[') { depth++; i++; continue; }
    if (block[i] === '}' || block[i] === ']') { depth--; i++; continue; }
    if (depth === 1) {
      const keyMatch = /^\s*['"]?([a-zA-Z0-9_-]+)['"]?\s*:/.exec(block.slice(i));
      if (keyMatch) {
        keys.push(keyMatch[1]);
        i += keyMatch[0].length;
        continue;
      }
    }
    i++;
  }
  return keys;
}

if (!fs.existsSync(ADMIN_MANUAL_PATH)) {
  fail(`fitxer no trobat: ${ADMIN_MANUAL_PATH}`);
  process.exit(1);
}

const source = fs.readFileSync(ADMIN_MANUAL_PATH, 'utf8');

// Extreu IDs de ADMIN_MARKETING_PHASES (l'array de totes les accions)
const phasesBlock = extractConstArrayBlock(source, 'ADMIN_MARKETING_PHASES');
const phaseActionIds = new Set(
  [...phasesBlock.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((x) => x[1])
);

// Extreu el bloc complet de ADMIN_MARKETING_PHASE_GATE per cercar-hi les propietats
const gateBlock = extractConstObjectBlock(source, 'ADMIN_MARKETING_PHASE_GATE');

// Extreu IDs del gate (cercant dins gateBlock per evitar capturar interfícies)
const requiredBlock = extractPropArrayBlock(gateBlock, 'requiredActionIds');
const requiredActionIds = extractStringLiterals(requiredBlock);

const blockedBlock = extractPropArrayBlock(gateBlock, 'blockedActionIds');
const blockedActionIds = extractStringLiterals(blockedBlock);

const requiredOutputsBlock = extractPropObjectBlock(gateBlock, 'requiredOutputs');
const requiredOutputKeys = extractObjectTopLevelKeys(requiredOutputsBlock);

const blockedReasonsBlock = extractPropObjectBlock(gateBlock, 'blockedReasons');
const blockedReasonKeys = extractObjectTopLevelKeys(blockedReasonsBlock);

const primaryMatch = /\bprimaryActionId\s*:\s*['"]([^'"]+)['"]/.exec(gateBlock);
const primaryActionId = primaryMatch ? primaryMatch[1] : null;

const nextPhaseMatch = /\bnextPhaseActionId\s*:\s*['"]([^'"]+)['"]/.exec(gateBlock);
const nextPhaseActionId = nextPhaseMatch ? nextPhaseMatch[1] : null;

// Bootstrap: fix per evitar '[]' de l'anotació de tipus AdminMarketingBootstrapStep[]
const bootstrapBlock = extractConstArrayBlock(source, 'ADMIN_MARKETING_BOOTSTRAP_PLAN');
const bootstrapWindows = [...bootstrapBlock.matchAll(/\bwindow:\s*['"]([^'"]+)['"]/g)].map((x) => x[1]);

const evidenceBlock = extractConstArrayBlock(source, 'ADMIN_MARKETING_PHASE_EVIDENCE');
const evidenceActionIds = [...evidenceBlock.matchAll(/\bactionId:\s*['"]([^'"]+)['"]/g)].map((x) => x[1]);
const evidenceItems = [...evidenceBlock.matchAll(/\{[^{}]*\bactionId:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  actionId: match[1],
  block: match[0],
}));

const channelDecisionBlock = extractConstArrayBlock(source, 'ADMIN_MARKETING_CHANNEL_DECISION_MATRIX');
const channelDecisionItems = [...channelDecisionBlock.matchAll(/\{[^{}]*\bactionId:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  actionId: match[1],
  block: match[0],
}));

const rhythmBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_RHYTHM');
const rhythmItems = [...rhythmBlock.matchAll(/\{[^{}]*\bcadence:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  cadence: match[1],
  block: match[0],
}));

const operatingFlowBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_FLOW');
const operatingFlowItems = [...operatingFlowBlock.matchAll(/\{[^{}]*\bstep:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  step: match[1],
  block: match[0],
}));
const canonicalOperatingFlowSteps = ['01', '02', '03', '04', '05', '06'];

const operatingGatesBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_GATES');
const operatingGateItems = [...operatingGatesBlock.matchAll(/\{[^{}]*\bstep:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  step: match[1],
  block: match[0],
}));

const operatingHandoffsBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_HANDOFFS');
const operatingHandoffItems = [...operatingHandoffsBlock.matchAll(/\{[^{}]*\bfromStep:\s*['"]([^'"]+)['"][^{}]*\btoStep:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  fromStep: match[1],
  toStep: match[2],
  block: match[0],
}));

const stepChecklistBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_STEP_CHECKLIST');
const stepChecklistItems = [...stepChecklistBlock.matchAll(/\{[^{}]*\bstep:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  step: match[1],
  block: match[0],
}));

const operatingExceptionsBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_EXCEPTIONS');
const operatingExceptionItems = [...operatingExceptionsBlock.matchAll(/\{[^{}]*\bstep:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  step: match[1],
  block: match[0],
}));

const operatingEvidenceBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_OPERATING_EVIDENCE');
const operatingEvidenceItems = [...operatingEvidenceBlock.matchAll(/\{[^{}]*\bstep:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => ({
  step: match[1],
  block: match[0],
}));

const sectionsBlock = extractConstArrayBlock(source, 'ADMIN_MANUAL_SECTIONS');
const capabilityItems = [...sectionsBlock.matchAll(/\{[^{}]*\bcta:\s*['"]([^'"]+)['"][^{}]*\}/g)].map((match) => {
  const titleMatch = /\btitle:\s*['"]([^'"]+)['"]/.exec(match[0]);
  const flowStepMatch = /\bflowStep:\s*['"]([^'"]+)['"]/.exec(match[0]);
  const hrefMatch = /\bhref:\s*['"]([^'"]+)['"]/.exec(match[0]);
  return {
    title: titleMatch ? titleMatch[1] : match[1],
    flowStep: flowStepMatch ? flowStepMatch[1] : null,
    href: hrefMatch ? hrefMatch[1] : null,
    block: match[0],
  };
});

// — Validacions —

const blkSet = new Set(blockedActionIds);
const reqSet = new Set(requiredActionIds);
const outSet = new Set(requiredOutputKeys);
const rsnSet = new Set(blockedReasonKeys);
const evdSet = new Set(evidenceActionIds);
const flowStepSet = new Set(operatingFlowItems.map((item) => item.step));
const gateStepSet = new Set(operatingGateItems.map((item) => item.step));
const handoffFromStepSet = new Set(operatingHandoffItems.map((item) => item.fromStep));
const checklistStepSet = new Set(stepChecklistItems.map((item) => item.step));
const exceptionStepSet = new Set(operatingExceptionItems.map((item) => item.step));
const evidenceStepSet = new Set(operatingEvidenceItems.map((item) => item.step));
const expectedNextStep = new Map(
  operatingFlowItems.map((item, index) => [
    item.step,
    operatingFlowItems[(index + 1) % operatingFlowItems.length]?.step,
  ])
);

/**
 * @param {string[]} values
 * @returns {string[]}
 */
function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

// 1. Tots els requiredActionIds existeixen a ADMIN_MARKETING_PHASES
for (const id of reqSet) {
  if (!phaseActionIds.has(id)) fail(`requiredActionIds referencia id inexistent: '${id}'`);
}

// 2. Tots els blockedActionIds existeixen a ADMIN_MARKETING_PHASES
for (const id of blkSet) {
  if (!phaseActionIds.has(id)) fail(`blockedActionIds referencia id inexistent: '${id}'`);
}

// 3. requiredOutputs cobreix exactament els requiredActionIds
for (const id of reqSet) {
  if (!outSet.has(id)) fail(`requiredOutputs no cobreix requiredActionId: '${id}'`);
}
for (const id of outSet) {
  if (!reqSet.has(id)) fail(`requiredOutputs té clau extra no a requiredActionIds: '${id}'`);
}

// 4. blockedReasons cobreix exactament els blockedActionIds
for (const id of blkSet) {
  if (!rsnSet.has(id)) fail(`blockedReasons no cobreix blockedActionId: '${id}'`);
}
for (const id of rsnSet) {
  if (!blkSet.has(id)) fail(`blockedReasons té clau extra no a blockedActionIds: '${id}'`);
}

// 5. ADMIN_MARKETING_PHASE_EVIDENCE cobreix exactament els requiredActionIds
for (const id of reqSet) {
  if (!evdSet.has(id)) fail(`ADMIN_MARKETING_PHASE_EVIDENCE no cobreix requiredActionId: '${id}'`);
}
for (const id of evdSet) {
  if (!reqSet.has(id)) fail(`ADMIN_MARKETING_PHASE_EVIDENCE té actionId extra no a requiredActionIds: '${id}'`);
  if (!phaseActionIds.has(id)) fail(`ADMIN_MARKETING_PHASE_EVIDENCE referencia id inexistent: '${id}'`);
}
for (const item of evidenceItems) {
  for (const prop of ['proof', 'whereToCheck', 'unlockSignal']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MARKETING_PHASE_EVIDENCE '${item.actionId}' té ${prop} buit o massa curt`);
    }
  }
}

// 5b. Matriu de decisió del canal gratuït accionable
if (channelDecisionItems.length < 4) {
  fail(`ADMIN_MARKETING_CHANNEL_DECISION_MATRIX ha de tenir com a mínim 4 opcions; actual: ${channelDecisionItems.length}`);
}
for (const item of channelDecisionItems) {
  if (!phaseActionIds.has(item.actionId)) {
    fail(`ADMIN_MARKETING_CHANNEL_DECISION_MATRIX referencia id inexistent: '${item.actionId}'`);
  }
  const phaseMatch = new RegExp(`\\bid:\\s*['"]${item.actionId}['"][^{}]*\\bphase:\\s*['"]([^'"]+)['"]`).exec(phasesBlock);
  if (!phaseMatch || phaseMatch[1] !== 'FASE_1') {
    fail(`ADMIN_MARKETING_CHANNEL_DECISION_MATRIX '${item.actionId}' ha de referenciar una acció FASE_1`);
  }
  for (const prop of ['startWhen', 'firstMove', 'successSignal', 'stopIf', 'adminLabel']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MARKETING_CHANNEL_DECISION_MATRIX '${item.actionId}' té ${prop} buit o massa curt`);
    }
  }
  const hrefMatch = /\badminHref\s*:\s*['"]([^'"]+)['"]/.exec(item.block);
  if (!hrefMatch || !hrefMatch[1].startsWith('/admin')) {
    fail(`ADMIN_MARKETING_CHANNEL_DECISION_MATRIX '${item.actionId}' ha de tenir adminHref /admin`);
  }
}

// 6. primaryActionId existeix i no és canal bloquejat
if (!primaryActionId) {
  fail('primaryActionId no trobat al gate');
} else {
  if (!phaseActionIds.has(primaryActionId))
    fail(`primaryActionId '${primaryActionId}' no existeix a ADMIN_MARKETING_PHASES`);
  if (blkSet.has(primaryActionId))
    fail(`primaryActionId '${primaryActionId}' no pot ser un canal bloquejat`);
}

// 7. nextPhaseActionId existeix i no és canal bloquejat
if (!nextPhaseActionId) {
  fail('nextPhaseActionId no trobat al gate');
} else {
  if (!phaseActionIds.has(nextPhaseActionId))
    fail(`nextPhaseActionId '${nextPhaseActionId}' no existeix a ADMIN_MARKETING_PHASES`);
  if (blkSet.has(nextPhaseActionId))
    fail(`nextPhaseActionId '${nextPhaseActionId}' no pot ser un canal bloquejat`);
}

// 8. Bootstrap plan té almenys 1 finestra
if (bootstrapWindows.length === 0) {
  fail('ADMIN_MARKETING_BOOTSTRAP_PLAN no té cap finestra (window)');
}

// 9. Ritme operatiu accionable
if (rhythmItems.length < 4) {
  fail(`ADMIN_MANUAL_OPERATING_RHYTHM ha de tenir com a mínim 4 cadències; actual: ${rhythmItems.length}`);
}
for (const item of rhythmItems) {
  for (const prop of ['title', 'objective', 'cta', 'ifOffTrack']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_RHYTHM '${item.cadence}' té ${prop} buit o massa curt`);
    }
  }
  const hrefMatch = /\bhref\s*:\s*['"]([^'"]+)['"]/.exec(item.block);
  if (!hrefMatch || !hrefMatch[1].startsWith('/admin')) {
    fail(`ADMIN_MANUAL_OPERATING_RHYTHM '${item.cadence}' ha de tenir href /admin`);
  }
  const signalsBlock = extractPropArrayBlock(item.block, 'signals');
  const signals = extractStringLiterals(signalsBlock);
  if (signals.length < 2) {
    fail(`ADMIN_MANUAL_OPERATING_RHYTHM '${item.cadence}' ha de tenir almenys 2 senyals`);
  }
  const doneWhenBlock = extractPropArrayBlock(item.block, 'doneWhen');
  const doneWhen = extractStringLiterals(doneWhenBlock);
  if (doneWhen.length < 2) {
    fail(`ADMIN_MANUAL_OPERATING_RHYTHM '${item.cadence}' ha de tenir almenys 2 criteris doneWhen`);
  }
}

// 10. Sistema operatiu de punta a punta
if (operatingFlowItems.length < 5) {
  fail(`ADMIN_MANUAL_OPERATING_FLOW ha de tenir com a mínim 5 passos; actual: ${operatingFlowItems.length}`);
}
for (const step of findDuplicates(operatingFlowItems.map((item) => item.step))) {
  fail(`ADMIN_MANUAL_OPERATING_FLOW té step duplicat: '${step}'`);
}
const operatingFlowStepSet = new Set(operatingFlowItems.map((item) => item.step));
for (const step of canonicalOperatingFlowSteps) {
  if (!operatingFlowStepSet.has(step)) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW no cobreix el step canònic '${step}'`);
  }
}
for (const item of operatingFlowItems) {
  if (!canonicalOperatingFlowSteps.includes(item.step)) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW referencia step no canònic: '${item.step}'`);
  }
}
operatingFlowItems.forEach((item, index) => {
  const expectedStep = canonicalOperatingFlowSteps[index];
  if (expectedStep && item.step !== expectedStep) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW ordre incorrecte: posició ${index + 1} ha de ser '${expectedStep}', no '${item.step}'`);
  }
});
for (const item of operatingFlowItems) {
  for (const prop of ['title', 'objective', 'entryLabel', 'successSignal', 'nextStep']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_FLOW '${item.step}' té ${prop} buit o massa curt`);
    }
  }
  const hrefMatch = /\bentryHref\s*:\s*['"]([^'"]+)['"]/.exec(item.block);
  if (!hrefMatch || !hrefMatch[1].startsWith('/admin')) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW '${item.step}' ha de tenir entryHref /admin`);
  }
  const readsBlock = extractPropArrayBlock(item.block, 'systemReads');
  const reads = extractStringLiterals(readsBlock);
  if (reads.length < 2) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW '${item.step}' ha de tenir almenys 2 systemReads`);
  }
  const decisionsBlock = extractPropArrayBlock(item.block, 'manualDecisions');
  const decisions = extractStringLiterals(decisionsBlock);
  if (decisions.length < 1) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW '${item.step}' ha de tenir almenys 1 manualDecision`);
  }
}

// 11. Capacitats del manual connectades al flux operatiu
if (capabilityItems.length < 10) {
  fail(`ADMIN_MANUAL_SECTIONS ha de tenir capacitats accionables; actual: ${capabilityItems.length}`);
}
for (const item of capabilityItems) {
  if (!item.href || !item.href.startsWith('/admin')) {
    fail(`ADMIN_MANUAL_SECTIONS capability '${item.title}' ha de tenir href /admin`);
  }
  if (!item.flowStep) {
    fail(`ADMIN_MANUAL_SECTIONS capability '${item.title}' no té flowStep`);
  } else if (!flowStepSet.has(item.flowStep)) {
    fail(`ADMIN_MANUAL_SECTIONS capability '${item.title}' referencia flowStep inexistent: '${item.flowStep}'`);
  }
  const signalsBlock = extractPropArrayBlock(item.block, 'signals');
  const signals = extractStringLiterals(signalsBlock);
  if (signals.length < 3) {
    fail(`ADMIN_MANUAL_SECTIONS capability '${item.title}' ha de tenir almenys 3 senyals`);
  }
}
for (const step of flowStepSet) {
  const count = capabilityItems.filter((item) => item.flowStep === step).length;
  if (count === 0) {
    fail(`ADMIN_MANUAL_OPERATING_FLOW step '${step}' no té cap capability connectada`);
  }
}

// 12. Gates de decisió del flux operatiu
for (const step of findDuplicates(operatingGateItems.map((item) => item.step))) {
  fail(`ADMIN_MANUAL_OPERATING_GATES té step duplicat: '${step}'`);
}
for (const step of flowStepSet) {
  if (!gateStepSet.has(step)) {
    fail(`ADMIN_MANUAL_OPERATING_GATES no cobreix el step '${step}'`);
  }
}
for (const item of operatingGateItems) {
  if (!flowStepSet.has(item.step)) {
    fail(`ADMIN_MANUAL_OPERATING_GATES referencia step inexistent: '${item.step}'`);
  }
  for (const prop of ['title', 'checkBeforeMoving', 'riskIfSkipped', 'ownerQuestion']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_GATES '${item.step}' té ${prop} buit o massa curt`);
    }
  }
}

// 13. Handoffs entre passos del flux operatiu
for (const step of findDuplicates(operatingHandoffItems.map((item) => item.fromStep))) {
  fail(`ADMIN_MANUAL_OPERATING_HANDOFFS té fromStep duplicat: '${step}'`);
}
for (const step of flowStepSet) {
  if (!handoffFromStepSet.has(step)) {
    fail(`ADMIN_MANUAL_OPERATING_HANDOFFS no cobreix el fromStep '${step}'`);
  }
}
for (const item of operatingHandoffItems) {
  if (!flowStepSet.has(item.fromStep)) {
    fail(`ADMIN_MANUAL_OPERATING_HANDOFFS referencia fromStep inexistent: '${item.fromStep}'`);
  }
  if (!flowStepSet.has(item.toStep)) {
    fail(`ADMIN_MANUAL_OPERATING_HANDOFFS referencia toStep inexistent: '${item.toStep}'`);
  }
  const expectedToStep = expectedNextStep.get(item.fromStep);
  if (expectedToStep && item.toStep !== expectedToStep) {
    fail(`ADMIN_MANUAL_OPERATING_HANDOFFS '${item.fromStep}' ha d'apuntar al pas següent '${expectedToStep}', no a '${item.toStep}'`);
  }
  for (const prop of ['artifact', 'handoffRule']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_HANDOFFS '${item.fromStep}' té ${prop} buit o massa curt`);
    }
  }
  const workspaceMatch = /\bnextWorkspace\s*:\s*['"]([^'"]*)['"]/.exec(item.block);
  if (!workspaceMatch || workspaceMatch[1].trim().length < 3) {
    fail(`ADMIN_MANUAL_OPERATING_HANDOFFS '${item.fromStep}' té nextWorkspace buit o massa curt`);
  }
  const hrefMatch = /\bnextWorkspaceHref\s*:\s*['"]([^'"]+)['"]/.exec(item.block);
  if (!hrefMatch || !hrefMatch[1].startsWith('/admin')) {
    fail(`ADMIN_MANUAL_OPERATING_HANDOFFS '${item.fromStep}' ha de tenir nextWorkspaceHref /admin`);
  }
}

// 14. Checklist binària de tancament per pas
for (const step of findDuplicates(stepChecklistItems.map((item) => item.step))) {
  fail(`ADMIN_MANUAL_OPERATING_STEP_CHECKLIST té step duplicat: '${step}'`);
}
for (const step of flowStepSet) {
  if (!checklistStepSet.has(step)) {
    fail(`ADMIN_MANUAL_OPERATING_STEP_CHECKLIST no cobreix el step '${step}'`);
  }
}
for (const item of stepChecklistItems) {
  if (!flowStepSet.has(item.step)) {
    fail(`ADMIN_MANUAL_OPERATING_STEP_CHECKLIST referencia step inexistent: '${item.step}'`);
  }
  for (const prop of ['doneLabel', 'blockedIf']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_STEP_CHECKLIST '${item.step}' té ${prop} buit o massa curt`);
    }
  }
  const checksBlock = extractPropArrayBlock(item.block, 'checks');
  const checks = extractStringLiterals(checksBlock);
  if (checks.length < 3) {
    fail(`ADMIN_MANUAL_OPERATING_STEP_CHECKLIST '${item.step}' ha de tenir almenys 3 checks`);
  }
}

// 15. Matriu d'excepcions operatives per pas
for (const step of findDuplicates(operatingExceptionItems.map((item) => item.step))) {
  fail(`ADMIN_MANUAL_OPERATING_EXCEPTIONS té step duplicat: '${step}'`);
}
for (const step of flowStepSet) {
  if (!exceptionStepSet.has(step)) {
    fail(`ADMIN_MANUAL_OPERATING_EXCEPTIONS no cobreix el step '${step}'`);
  }
}
for (const item of operatingExceptionItems) {
  if (!flowStepSet.has(item.step)) {
    fail(`ADMIN_MANUAL_OPERATING_EXCEPTIONS referencia step inexistent: '${item.step}'`);
  }
  for (const prop of ['trigger', 'firstMove', 'actionLabel', 'doNotAdvanceUntil']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_EXCEPTIONS '${item.step}' té ${prop} buit o massa curt`);
    }
  }
  const hrefMatch = /\bactionHref\s*:\s*['"]([^'"]+)['"]/.exec(item.block);
  if (!hrefMatch || !hrefMatch[1].startsWith('/admin')) {
    fail(`ADMIN_MANUAL_OPERATING_EXCEPTIONS '${item.step}' ha de tenir actionHref /admin`);
  }
}

// 16. Evidències materials de tancament per pas
for (const step of findDuplicates(operatingEvidenceItems.map((item) => item.step))) {
  fail(`ADMIN_MANUAL_OPERATING_EVIDENCE té step duplicat: '${step}'`);
}
for (const step of flowStepSet) {
  if (!evidenceStepSet.has(step)) {
    fail(`ADMIN_MANUAL_OPERATING_EVIDENCE no cobreix el step '${step}'`);
  }
}
for (const item of operatingEvidenceItems) {
  if (!flowStepSet.has(item.step)) {
    fail(`ADMIN_MANUAL_OPERATING_EVIDENCE referencia step inexistent: '${item.step}'`);
  }
  for (const prop of ['artifact', 'proof', 'proofLabel', 'ownerCheck']) {
    const match = new RegExp(`\\b${prop}\\s*:\\s*['"]([^'"]*)['"]`).exec(item.block);
    if (!match || match[1].trim().length < 10) {
      fail(`ADMIN_MANUAL_OPERATING_EVIDENCE '${item.step}' té ${prop} buit o massa curt`);
    }
  }
  const hrefMatch = /\bproofHref\s*:\s*['"]([^'"]+)['"]/.exec(item.block);
  if (!hrefMatch || !hrefMatch[1].startsWith('/admin')) {
    fail(`ADMIN_MANUAL_OPERATING_EVIDENCE '${item.step}' ha de tenir proofHref /admin`);
  }
}

if (failures === 0) {
  console.log(
    `[admin-manual-consistency] OK: gate i bootstrap validats ` +
    `(${requiredActionIds.length} req, ${blockedActionIds.length} blk, ${bootstrapWindows.length} finestres, ${evidenceActionIds.length} proves, ${channelDecisionItems.length} canals, ${rhythmItems.length} ritmes, ${operatingFlowItems.length} passos OS, ${operatingGateItems.length} gates, ${operatingHandoffItems.length} handoffs, ${stepChecklistItems.length} checklists, ${operatingExceptionItems.length} excepcions, ${operatingEvidenceItems.length} evidències, ${capabilityItems.length} capacitats).`
  );
}
