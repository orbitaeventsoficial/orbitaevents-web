# Handoff de sessió — 2026-06-28

> Resum del que s'ha fet, decidit i deixat pendent en aquesta sessió, perquè res es
> perdi. El llegeix el propietari (o la pròxima sessió de Claude) per reprendre.

---

## 1. El que s'ha FET i committejat (11 canvis, #1187-1197)

Auditoria vertical de tot el flux de negoci (front+back). Les 5 verticals fetes:

| Vertical | Veredicte | Canvis |
|---|---|---|
| V1 Econòmica | Motor sòlid; 4 forats arreglats | #1192-1194, #1196 |
| V2 Post-event | Enquesta automàtica cablejada | #1195 |
| V3 Comunicació | Sòlida; codi mort net | #1197 |
| V4 Client/Portal/Pagaments | **Impecable, 0 bugs** (Stripe idempotent, Bizum, efectiu) | — |
| V5 Catàleg→Preu | Càlcul sòlid; 1 forat de DADES | — |

**Estat:** tot verd, suite ~5.000 tests OK, pujat fins #1196. El #1197 i els documents
nous són **al disc, encara sense push** (cal fer `git push`).

## 2. Documents nous creats aquesta sessió (al disc)
- `docs/DIAGNOSTIC-I-FULL-DE-RUTA.md` — **el document mestre**: què és l'organisme, la
  mida real (165 pàgines, 217 APIs, 63 models, ~79k línies), el diagnòstic i el camí en
  5 fases. ES LLEGEIX PRIMER.
- `docs/audit/inventari-funcions-orfenes.md` — les **79 funcions òrfenes** detectades.
- `docs/audit/FULL-DE-RUTA-auditoria-disseny-admin.md` — roadmap de l'auditoria de disseny.
- Aquest fitxer (handoff de sessió).

## 3. La LLIÇÓ clau de la sessió (no perdre-la)
**«Òrfena ≠ morta».** Una funció sense consumidor pot ser una **capacitat demanada que es
va desconnectar en un refactor**, NO codi mort a esborrar.

**Regla d'or abans de matar:** comprovar que el que es manté fa la MATEIXA feina (o millor)
que el que s'elimina. Exemple real: a privacy (RGPD), les funcions «substituïdes» NO
cobrien els casos per-entitat (consentiments d'un client concret, auditoria d'una entitat,
sol·licituds urgents per termini) → gairebé res era un kill net.

## 4. El PRINCIPI estratègic acordat (la decisió de fons)
El propietari usa la interfície al **10-20%** perquè «no és fiable i és molt extensa».
Diagnòstic: el motor és bo; el problema és **massa superfície + sistemes duplicats**.

**Principi rector:** UNA capacitat = UN camí. **Consolidar abans que afegir. Fiabilitat
abans que features.** En fase de proves, REDUIR superfície val més que afegir-ne.

Davant una funció òrfena: si es vol → **connectar-la al camí viu** (no fer-ne un de nou;
si la via viva es queda curta, ESTENDRE-la perquè sigui superconjunt). Si no es vol → fora.

## 5. Decisions sobre les òrfenes — estat
- **Clúster A (privacy/RGPD, 10 funcions):** el propietari va dir «mata A», PERÒ la
  comparació va revelar que NO totes estan substituïdes:
  - 8 tenen feina diferent de les vives (per-entitat) → **NO matar a cegues**.
  - 2 són forats de compliment potencials: `recordConsent` (0 consentiments registrats a
    BD) i `executeRetentionPolicies` (cap cron la crida). **Decisió del propietari pendent:
    refer (connectar) o matar.**
- **Clúster B (heroVideo, 5 funcions):** sistema VELL substituït pel gestor d'imatges
  unificat (la pàgina `/admin/settings/hero` ja redirigeix allà). Recomanació: **matar**.
- Resta de clústers (C normalize, D segmentació, E portfolio, F analytics, G emails, H
  utils, I computeCollaboratorNetMargin) → **pendents de decidir un per un.**

**Conclusió revisada:** NO s'ha matat res d'aquest inventari encara. Cal repassar-lo amb
la lent «connectar al camí viu o fora», explicant cada clúster (què és, per què està
òrfena, què passa si es mata vs es refà).

## 6. DEURES DEL PROPIETARI (no són codi — els ha de fer ell)
1. **Materialitzar els 7 bolos guanyats sense reserva** (cobrats en efectiu, fora del
   sistema). Visibles via l'alerta NBA del dashboard (#1194).
2. **Omplir cost/vida de 32 items d'inventari** (de 51) perquè els preus recomanats siguin
   fiables. Visible a `/admin/inventory?health=missing-cost`. (Forat V5-#1; el codi ja
   avisa, és tasca de dades.)

## 7. Pendent tècnic immediat
- **`git push`** del #1197 + els documents nous.
- Decidir si s'uneix el diagnòstic amb el protocol → **DECISIÓ PRESA: NO unir.** Jerarquia
  de 3 capes: `CLAUDE.md` (llei) → `DIAGNOSTIC` (llegir primer) → `admin-protocol.md`
  (manual operatiu). Pendent: afegir una línia a dalt de CLAUDE.md que apunti al diagnòstic
  com a «llegeix primer».

## 8. Config de Claude Code (tema de l'eina, no del projecte)
- Permisos: `WebSearch` + `WebFetch` ja afegits a l'allow (fet pel propietari amb /permissions).
- Pantalla completa que no deixa fer scroll amunt: és el setting **`tui`**. Cal posar
  `"tui": "default"` a `.claude/settings.json` (a mà; no surt a /config; Claude no ho pot
  editar perquè el mode dontAsk es protegeix). Reiniciar després.
