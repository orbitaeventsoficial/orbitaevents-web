#!/usr/bin/env node
/**
 * Instal·lador idempotent dels hooks del protocol a .claude/settings.json.
 *
 * Per què existeix: en mode `dontAsk`, Claude Code bloqueja que el model
 * editi la seva pròpia config. Aquest script el llança el PROPIETARI
 * (p. ex. `! node scripts/hooks/install-hooks.mjs`) i fusiona els hooks
 * preservant permisos i qualsevol hook ja existent. Tornar-lo a executar no
 * duplica res.
 *
 * Després cal obrir `/hooks` un cop o reiniciar la sessió perquè la config
 * es rellegeixi.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const SETTINGS = resolve(ROOT, '.claude/settings.json');

const DESIRED = {
  PostToolUse: {
    matcher: 'Write|Edit',
    hook: {
      type: 'command',
      command: 'node scripts/hooks/check-residue.mjs',
      timeout: 15,
      statusMessage: 'Guarda de residus (hex/style/rgba)…',
    },
  },
  SessionStart: {
    matcher: null,
    hook: {
      type: 'command',
      command: 'node scripts/hooks/session-start.mjs',
      timeout: 15,
      statusMessage: 'Carregant estat del protocol…',
    },
  },
};

function loadSettings() {
  if (!existsSync(SETTINGS)) return {};
  try {
    return JSON.parse(readFileSync(SETTINGS, 'utf8'));
  } catch (e) {
    console.error(`✗ settings.json no és JSON vàlid: ${e.message}`);
    process.exit(1);
  }
}

function hasCommand(groups, command) {
  return (groups || []).some((g) =>
    (g.hooks || []).some((h) => h.command === command),
  );
}

function ensure(settings, event, { matcher, hook }) {
  settings.hooks ||= {};
  settings.hooks[event] ||= [];
  if (hasCommand(settings.hooks[event], hook.command)) {
    return false; // ja hi és
  }
  const group = matcher ? { matcher, hooks: [hook] } : { hooks: [hook] };
  settings.hooks[event].push(group);
  return true;
}

const settings = loadSettings();
let changed = false;
const added = [];
for (const [event, spec] of Object.entries(DESIRED)) {
  if (ensure(settings, event, spec)) {
    changed = true;
    added.push(`${event} → ${spec.hook.command}`);
  }
}

if (!changed) {
  console.log('✓ Els hooks ja hi són. Res a fer.');
  process.exit(0);
}

if (existsSync(SETTINGS)) {
  copyFileSync(SETTINGS, `${SETTINGS}.bak`);
  console.log('• Còpia de seguretat: .claude/settings.json.bak');
}
writeFileSync(SETTINGS, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
console.log('✓ Hooks instal·lats:');
for (const a of added) console.log(`  + ${a}`);
console.log('\nAra obre `/hooks` un cop o reinicia la sessió per recarregar.');
