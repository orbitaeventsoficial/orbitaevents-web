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
Últim canvi: #776 (inventari de recursos del repo a `docs/inventari-recursos.md`)
Proper pas previst: primer exercici — `/studio-lab/leads` incorpora recursos reals (suggestions/colorTheme/weather/costEngine/conflictes/stats/leadRouteService) segons el Pla d'aprofitament de `docs/inventari-recursos.md`. Després, la "pàgina tipus" (l'AppShell com a layout mestre del nou admin), que encara no s'ha treballat. Principi del propietari: cap soroll.
Avís per codex: ALERTA RESOLTA — les proves #768–773 estaven documentades però NO commitejades (git a #767). Reconciliades a git al #774. `qa:protocol` ara EXIGEIX que `LAB_CHANGE_NUMBER` del xip de `/studio-lab/leads` == `ADMIN_CHANGE_COUNTER`: cada canvi s'ha de reflectir al diari I a la pàgina o la validació peta. Numeració LLIGADA: counter ↔ protocol ↔ diari ↔ xip = 774. PENDENT (no meu): working tree conserva canvis d'admin sense `#N` (CustomerHeader, ImapSettingsClient + tests) i el blindatge nonstop (CLAUDE.md, agent-runtime-policy.json, check-nonstop-protocol + test) — sense commitejar, a decidir pel propietari. Counter 774, proper #775.

---

## Bloc CODEX (Codex CLI)

<!-- codex: actualitza aquest bloc quan comencis/acabis una sessió -->
[codex] 2026-05-24 [ESTAT: tancat]
Últim canvi: #770 (`/studio-lab/leads` retorn a Contrast negre amb jerarquia corregida)
Proper pas previst: continuar iteració visual amb el propietari sobre `/studio-lab/leads`, mantenint diari/protocol/counter per cada tall.
Avís per l'altre agent: #770 toca `app/studio-lab/leads/page.tsx`, `app/studio-lab/leads/leads-propostes.css`, docs (`diario`, protocol, handoff, agent-sync) i `lib/constants/admin.ts`. La via crema queda descartada; Contrast negre és l'estat actual. No he tocat `/studio`, `/admin`, serveis, schema, auth ni dades reals.

---

## Norma de no-col·lisió

- Si el teu bloc diu `treballant`, l'altre agent ha d'esperar o triar un canvi que no toqui els mateixos fitxers.
- El counter `ADMIN_CHANGE_COUNTER` sempre l'actualitza l'agent que tanca el canvi. Si veus que el counter és N+1 però no hi ha entrada #(N+1) al protocol, és un conflicte de timing — posa el counter de tornada a N i afegeix l'entrada que falta.
- En cas de dubte, consultar `docs/diario.md` i `docs/protocol-producte-admin-ca.md` per veure qui ha fet l'últim canvi.
