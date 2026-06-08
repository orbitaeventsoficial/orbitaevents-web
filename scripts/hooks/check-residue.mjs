#!/usr/bin/env node
/**
 * Hook PostToolUse (Write|Edit) — guarda de residus hardcoded.
 *
 * Automatitza la regla del CLAUDE.md ("Després de cada ronda de canvis,
 * grep actiu de residus") perquè el harness l'executi sol després de cada
 * Edit/Write, en comptes de dependre que l'agent se'n recordi.
 *
 * És ADVISORI: mai bloqueja l'edició. Quan troba residus, els injecta al
 * context de l'agent via `additionalContext` perquè els corregeixi a la
 * mateixa passada.
 *
 * Residus detectats (segons CLAUDE.md §Hardcode i monocapa):
 *   - hex hardcoded `#rgb`/`#rrggbb`
 *   - inline styles `style={{`
 *   - colors inline `rgba(` (només en TSX/JSX; en CSS és excepció tècnica)
 *
 * Llegeix el JSON del hook per stdin i acaba sempre amb exit 0.
 */

import { readFileSync } from 'node:fs';

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const INLINE_STYLE = /style=\{\{/;
const RGBA = /rgba?\(/;

// Fitxers CSS que SÍ poden definir colors (font de veritat de tokens).
const CSS_TOKEN_ALLOWLIST = [
  'app/globals.css',
  'app/studio/orbita-tokens.css',
  'app/studio/studio.css',
  'app/admin/admin-theme.css',
  'app/admin/admin-shell.css',
  'app/admin/control-room.css',
];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function emit(findings) {
  if (!findings.length) {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }
  const lines = findings
    .map((f) => `  · L${f.line} [${f.kind}] ${f.text}`)
    .join('\n');
  const context =
    `⚠️ Guarda de residus (CLAUDE.md §Hardcode i monocapa) — ${findings.length} possible(s) residu(s) al fitxer que acabes d'editar:\n${lines}\n\n` +
    `Recorda: colors → tokens \`--o-*\`/\`--ax-*\`; mides → \`PDF_DESIGN\`/tokens; ` +
    `textos → \`lib/constants/\` o \`messages/*.json\`. Si és un cas tècnic acceptat ` +
    `(definició de variables globals, canvas, API d'imatge, email HTML), ignora'l.`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: context,
      },
    }),
  );
}

function main() {
  let filePath = '';
  try {
    const payload = JSON.parse(readStdin() || '{}');
    filePath =
      payload?.tool_input?.file_path ||
      payload?.tool_response?.filePath ||
      '';
  } catch {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }
  if (!filePath) {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }

  const norm = filePath.replace(/\\/g, '/');
  const rel = norm.replace(/^.*?\/orbitaevents\//, '');
  const isTsx = /\.(tsx|jsx)$/.test(norm);
  const isCss = /\.css$/.test(norm);

  // Només vigilem UI: app/ i components/. La resta queda fora.
  if (!/(^|\/)(app|components)\//.test(rel)) {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }
  if (!isTsx && !isCss) {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }
  if (isCss && CSS_TOKEN_ALLOWLIST.some((a) => rel === a)) {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }

  let src = '';
  try {
    src = readFileSync(filePath, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({ suppressOutput: true }));
    return;
  }

  const findings = [];
  const rows = src.split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const trimmed = raw.trim();
    // Salta comentaris evidents per reduir falsos positius.
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*')
    ) {
      continue;
    }
    const snippet = trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
    if (HEX.test(raw)) findings.push({ line: i + 1, kind: 'hex', text: snippet });
    if (isTsx && INLINE_STYLE.test(raw))
      findings.push({ line: i + 1, kind: 'style', text: snippet });
    if (isTsx && RGBA.test(raw))
      findings.push({ line: i + 1, kind: 'rgba', text: snippet });
  }

  // Limita el soroll: màxim 15 troballes.
  emit(findings.slice(0, 15));
}

main();
