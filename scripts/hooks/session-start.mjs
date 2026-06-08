#!/usr/bin/env node
/**
 * Hook SessionStart — injecta l'estat DINÀMIC del protocol.
 *
 * El CLAUDE.md (estàtic) ja viu al context, però no pot dir l'estat viu:
 * número de canvi actual i qui treballa segons agent-sync. Aquest hook
 * recorda el flux obligatori i resumeix l'estat perquè cap agent salti la
 * lectura de coordinació abans de tocar res.
 *
 * Acaba sempre amb exit 0. Mai bloqueja.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');

function readCounter() {
  try {
    const src = readFileSync(resolve(ROOT, 'lib/constants/admin.ts'), 'utf8');
    const m = src.match(/ADMIN_CHANGE_COUNTER\s*=\s*(\d+)/);
    return m ? m[1] : '?';
  } catch {
    return '?';
  }
}

function lastBlocks() {
  try {
    const src = readFileSync(resolve(ROOT, 'docs/agent-sync.md'), 'utf8');
    const out = [];
    for (const tag of ['[claude]', '[claude:opus]', '[codex]']) {
      const idx = src.indexOf(tag);
      if (idx === -1) continue;
      const line = src.slice(idx).split(/\r?\n/)[0].trim();
      out.push(line);
    }
    return out;
  } catch {
    return [];
  }
}

const counter = readCounter();
const blocks = lastBlocks();
const blockLine = blocks.length
  ? `\nÚltims blocs agent-sync:\n${blocks.map((b) => `  · ${b}`).join('\n')}`
  : '';

const context =
  `🛑 ATURA'T ABANS DE TOCAR RES. Protocol Òrbita obligatori.\n` +
  `Cap edició real és vàlida fins que hagis LLEGIT i confirmat: CLAUDE.md → ` +
  `docs/agent-sync.md (llegir l'altre agent + posar el teu bloc a 'treballant') → ` +
  `docs/admin-diary.md. Si és admin: també estat-admin.md + admin-protocol §6/§9.\n` +
  `Norma de tot canvi: documentat + reflectit al web + 0 hardcoded + responsiu + i18n.\n` +
  `ADMIN_CHANGE_COUNTER actual: #${counter} ` +
  `(el següent canvi real ha de ser #${Number.isNaN(+counter) ? '?' : +counter + 1}).${blockLine}`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  }),
);
