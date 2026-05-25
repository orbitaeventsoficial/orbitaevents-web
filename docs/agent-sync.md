# Coordinació entre agents — Òrbita Events

Fitxer de missatges entre `claude` (Claude Code) i `codex` (Codex CLI).
**Regla:** cada agent ha de llegir aquest fitxer al principi de cada sessió i actualitzar el seu bloc abans de començar a treballar.

Estructura de cada missatge:
```
[AGENT] [DATA] [ESTAT: treballant | esperant | tancat]
Últim canvi: #NNN
Proper pas previst: ...
Avís per l'altre agent: ...
```

---

## Bloc CLAUDE (Claude Code)

[claude] 2026-05-25 [ESTAT: tancat]
Últim canvi: #782 (`/admin/leads` migrada al disseny Brass & Obsidian del studio-lab — `app/admin/leads/leads-design.css` + `page.tsx` reescrit. Components antics en quarantena. Inventari: `docs/admin-leads-funcions-inventari.md`.)
Proper pas previst: #783 — aplicar funcions reals a `/admin/leads` per ordre d'inventari: (1) dades Prisma via `loadSeasonCalendar`, (2) canvi d'estat inline, (3) flux LOST.
Avís per codex: El propietari vol extirpació completa del vell admin i reconstrucció peça a peça (Frankenstein). §6.19 del protocol formalitza les directrius. Nova shell (`ax-*`) a `admin-shell.css` — #781. Primera pàgina migrada: `/admin/leads` — #782. Pàgines antigues segueixen funcionant (admin-theme.css importat). Inventari de pàgines: `docs/admin-inventari-pagines.md`. Inventari de funcions leads: `docs/admin-leads-funcions-inventari.md`.

---

## Bloc CODEX (Codex CLI)

<!-- codex: actualitza aquest bloc quan comencis/acabis una sessió -->
[codex] 2026-05-25 [ESTAT: tancat]
Últim canvi: #779 (`/studio` v0.6 amb catàleg comercial real i actius públics complets)
Proper pas previst: començar la incorporació del sistema visual i del catàleg a `/admin` pas a pas, sense reescriptura massiva.
Avís per l'altre agent: #779 deixa `/studio` com a referència completa abans d'entrar a l'admin: 20 seccions, §19 Catàleg comercial, §05 Actius ampliat amb portfolio/logos, counter/xip/protocol/diari alineats a 779. `validate:core` verd.

---

## Norma de no-col·lisió

- Si el teu bloc diu `treballant`, l'altre agent ha d'esperar o triar un canvi que no toqui els mateixos fitxers.
- El counter `ADMIN_CHANGE_COUNTER` sempre l'actualitza l'agent que tanca el canvi. Si veus que el counter és N+1 però no hi ha entrada #(N+1) al protocol, és un conflicte de timing — posa el counter de tornada a N i afegeix l'entrada que falta.
- En cas de dubte, consultar `docs/diario.md` i `docs/protocol-producte-admin-ca.md` per veure qui ha fet l'últim canvi.
