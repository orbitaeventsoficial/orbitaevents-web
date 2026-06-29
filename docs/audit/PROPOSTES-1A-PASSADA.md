# 💡 Propostes — final de la 1a passada end-to-end (2026-06-29)

> Un cop caminat el gruix de tots els processos (vegeu `PASSADA-END-TO-END.md`), aquí les
> propostes de **millorar processos · millorar interfícies · replantejar**, prioritzades.
> La 2a passada (els dos junts, pas a pas) parteix d'aquí. Res s'executa sense el teu OK.

## El veredicte global de la 1a passada
**El sistema és sòlid i la cara externa (PDF, emails, portal) és professional.** El motor
econòmic quadra al cèntim. No hi ha «codi trencat» generalitzat. Les millores són **afinar
i connectar**, no reconstruir. El patró recurrent: **funcions/sistemes construïts però no
connectats** (emails, RGPD, suggeriments) — el «doble sistema».

---

## A. MILLORAR PROCESSOS (connectar el que ja existeix)
| # | Proposta | Valor | Esforç |
|---|---|---|---|
| A1 | **Connectar `payment_reminder` a plantilla editable** — té lògica (dipòsit/resta); decisió: simplificar a «import pendent» o injectar bloc com a variable | Mitjà | Mitjà |
| A2 | **RGPD: connectar `recordConsent`** (0 consentiments registrats) als formularis + **cron de retenció** (`executeRetentionPolicies` sense cron) | Alt (legal) | Mitjà |
| A3 | **Connectar la resta d'emails simples** a plantilles editables (patró de #1221) perquè l'editor governi tots els emails | Mitjà | Baix-mitjà |
| A4 | **Materialitzar els 7 bolos** guanyats sense reserva (cobrats en efectiu) | Alt (dades) | Propietari |

## B. MILLORAR INTERFÍCIES (visual)
| # | Proposta | Nota |
|---|---|---|
| B1 | **NO perseguir «tot sembli leads»** — el sistema ja és coherent (capçalera idèntica); leads es veu millor pel CONTINGUT (calendari vs panell), no pel sistema | Estalvi d'esforç |
| B2 | **Polir les 2-3 pàgines que MÉS uses** (no 148), amb tu davant pantalla assenyalant elements concrets | Cal sessió conjunta |
| B3 | Micro-millores transversals (aire/profunditat a `.ap-card`) — provades, subtils; valor baix | Opcional |

## C. REPLANTEJAR (decisions de fons)
| # | Proposta | Decisió |
|---|---|---|
| C1 | **Sistema de plantilles d'email**: ara mig connectat (#1221). O **connectar tots** (l'editor governa) o **retirar l'editor** (emails al codi). No deixar-ho a mitges | Propietari |
| C2 | **Inventari «desig vs real»**: els EV ETX-12P són desig (no els tens). Marcar clarament a la UI què es POSSEEIX vs què és OBJECTIU de compra (evita amortitzar el que no hi és) | Mitjà |
| C3 | **Preus premium/luxury −19%** vs recomanat: apujar tarifes o assumir marge | Propietari |
| C4 | **Sobre-construcció**: 217 APIs / 63 models per a una empresa d'1 persona. En fase de proves, considerar amagar del menú el perifèric que no s'usa (reduir superfície mental) | Estratègic |

---

## Prioritat recomanada per a la 2a passada (junts)
1. **C1** (decidir emails: connectar tot o retirar) — desencalla A1/A3.
2. **A2** (RGPD) — és l'únic amb risc legal.
3. **B2** (visual de les pàgines que uses) — amb tu davant pantalla.
4. **A4 + C3** (dades i preus) — decisions teves ràpides.

## Mètode 2a passada
Per cada procés: tu el fas a la UI com a operador real, jo observo codi/dades, detectem la
manca concreta, l'arreglo al moment, valido (tests + captura/render). Començar per les 🔴.
