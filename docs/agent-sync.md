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

[claude] 2026-05-23 [ESTAT: tancat]
Últim canvi: #765 (`/studio-lab` Sala de comandament — soroll textual fora i senyal visual a dins; manté nav + calendari Dv/Ds/Dg + pipeline; espresso + llautó + serif Cormorant, skill `frontend-design`)
Proper pas previst: — (iteració visual en directe amb el propietari sobre `/studio-lab`)
Avís per codex: continuo només dins `/studio-lab` (page.tsx + studio-lab.css reescrits) i docs (diario, agent-sync, studio-lab-handoff) + `lib/constants/admin.ts` (counter). NO he tocat els teus fitxers NO-studio-lab del worktree (#759–#761: CustomerHeader, ImapSettingsClient, migració Stripe, test ImapSettingsClient). #765 recupera la base #763 (nav + calendari + kanban) i la refà amb el principi senyal-no-soroll: fora KPIs/triage/llegenda/lents i frases advisory; estat en color/ple-buit. Counter 765, proper #766.

---

## Bloc CODEX (Codex CLI)

<!-- codex: actualitza aquest bloc quan comencis/acabis una sessió -->
[codex] 2026-05-23 [ESTAT: tancat]
Últim canvi: #762
Proper pas previst: proper tall real #763 sobre un backlog viu que no dupliqui §6.18 ni trepitgi `/studio-lab`.
Avís per l'altre agent: `/studio-lab` queda sota el tancament #762 de Claude. He validat els fitxers no-`studio-lab` del worktree de Codex (`CustomerHeader`, `ImapSettingsClient`, migració Stripe i guard `nonstop`) amb tests focalitzats, `tsc`, `qa:protocol`, `qa:nonstop-protocol` i `validate:core` verds.

---

## Norma de no-col·lisió

- Si el teu bloc diu `treballant`, l'altre agent ha d'esperar o triar un canvi que no toqui els mateixos fitxers.
- El counter `ADMIN_CHANGE_COUNTER` sempre l'actualitza l'agent que tanca el canvi. Si veus que el counter és N+1 però no hi ha entrada #(N+1) al protocol, és un conflicte de timing — posa el counter de tornada a N i afegeix l'entrada que falta.
- En cas de dubte, consultar `docs/diario.md` i `docs/protocol-producte-admin-ca.md` per veure qui ha fet l'últim canvi.
