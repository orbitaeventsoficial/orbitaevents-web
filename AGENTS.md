# AGENTS.md — punt d'entrada per a qualsevol IA / agent

> Aquest fitxer és el punt d'arrencada per a **qualsevol eina d'IA** que entri al repo (Codex CLI, Claude Code, o qualsevol altra). NO conté les normes: les normes viuen al protocol. Aquí només t'hi envia.

## ATURA'T. Llegeix abans de tocar res.

Cap IA pot començar feina real al repo sense haver llegit, **en aquest ordre**:

1. **`CLAUDE.md`** — la constitució del repo (normes estables, 0 hardcoded, monocapa, zones protegides, «Norma de tot canvi», «Flux obligatori abans de tocar res»).
2. **`docs/agent-sync.md`** — coordinació entre agents. Llegeix el bloc de l'altre agent i **actualitza el teu** a `treballant` amb el proper canvi previst.
3. **`docs/admin-diary.md`** — registre cronològic del que s'ha fet.
4. Si la tasca és d'admin o toca zona consolidada: **`docs/estat-admin.md`** + **`docs/admin-protocol.md`** (§6 i §9).

## Regla mínima irrenunciable
- **0 hardcoded** (colors→tokens, textos públics→`messages/*.json`, dades→`lib/constants/*`).
- Cada canvi: **documentat** (diari + `### Canvi #N` al protocol + `ADMIN_CHANGE_COUNTER`) + **reflectit al web/admin** (visible i operatiu, no només al codi) + **responsiu** + **i18n** si és públic.
- No duplicar regles ni catàlegs (monocapa).
- No reobrir zones consolidades sense motiu real.

Tota la resta és a `CLAUDE.md`. Si tens dubte, hi torna.
