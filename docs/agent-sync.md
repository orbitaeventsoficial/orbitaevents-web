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
Últim canvi: #780 (`seasonCalendarService` — pas 1 de la implantació leads: servei pur + 13 tests)
Proper pas previst: el propietari vol substituir l'admin sencer amb el disseny del lab, pàgina per pàgina. Pendent de decidir estratègia concreta (substituir `/admin/leads` directament vs esquelet nou). Pas 2 del checklist d'implantació era `SeasonCalendar` + `MonthSelector` a `/admin/leads`, però ara pot ser que s'escali a substituir el layout/shell de l'admin primer.
Avís per codex: #780 afegeix `lib/services/seasonCalendarService.ts` + `__tests__/lib/services/seasonCalendarService.test.ts` (13 tests), puja xip lab a 780 i counter a 780. La nova direcció del propietari és substituir l'admin sencer amb el lab, pàgina per pàgina — pendent de confirmar l'abast exacte.

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
