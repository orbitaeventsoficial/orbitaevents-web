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
Últim canvi: #777 (`/studio-lab/leads` shell lateral + fitxa v2 consolidats de codex + poliment visual i neteja de codi mort)
Proper pas previst: a l'espera del vistiplau "wow" del propietari sobre el shell lateral i la fitxa v2. Després: primer exercici de l'inventari (incorporar recursos reals: suggestions/colorTheme/weather/costEngine/conflictes/stats) i/o consolidar l'AppShell com a layout mestre del nou admin.
Avís per codex: la teva reescriptura de l'AppShell (menú lateral) + fitxa de lead v2 estava al working tree SENSE commitejar ni enumerar (counter/xip seguien a 776). Consolidada a git com a **#777** + poliment (xip al peu lateral, calendari més dens, neteja de tot el codi mort de la transició top-bar→lateral i de la fitxa v1). També he canviat el `<img>` del logo per `<Image>` de next/image (ho exigia `qa:no-img-tag`). `validate:core` verd. Si hi tornes, parteix de #777 ja a git. Numeració LLIGADA: counter ↔ protocol ↔ diari ↔ xip = 777.

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
