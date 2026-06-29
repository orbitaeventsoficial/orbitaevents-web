# 👁️‍🗨️ L'AUDITORIA DEFINITIVA — Sauron engineer, 2a passada (2026-06-29)

> Auditoria total de l'organisme: vertical (fluxos) + horitzontal (interfícies), amb
> **captures reals** i criteri d'enginyer sènior. Objectiu: **simplificar · sintetitzar ·
> escurçar · homogeneïtzar · MILLORAR**. La 3a passada serà amb el propietari.
>
> Premissa de fons (recordatori): **una empresa d'1 persona amb 93 pàgines admin, 217
> APIs, 63 models.** El sistema funciona i és sòlid; el problema és **excés de superfície**.
> El nord de simplificació no és estètic: és que UN cap pugui abastar-ho i refiar-se'n.

---

## 🔴 TROBALLA #1 (la gran) — 4 pàgines fan el mateix: KPIs econòmics/comercials
Verificat amb captures. Se solapen pipeline, marge, conversió, ingressos:
| Pàgina | Menú | Què mostra | Línies |
|---|---|---|---|
| `/admin/cockpit` | «Cockpit» | tresoreria, pipeline, marge previst | 116 |
| `/admin/economia` | «Finances» | KPIs financers, cobraments, previsions | **2.927** |
| `/admin/analytics` | (Sistema) | KPIs comercials + GA4 + web | 328 |
| `/admin/reporting` | (Sistema) | leads, conversió, ingressos, marge, recurrència | 385 |
| + `/admin/coverage`, `/admin/cost-calculator`, `/admin/pricing` | varis | més números | 246+397+915 |

**Diagnòstic:** **7 pàgines tocant números**, amb 3-4 mostrant els MATEIXOS KPIs amb noms
diferents. Un operador no sap on mirar. **PROPOSTA: fusionar en 1 sol «Centre econòmic»**
amb pestanyes (Resum / Cobraments / Previsions / Rendiment), reaprofitant `economia` (ja és
la més completa) com a base. Cockpit/reporting/analytics passen a pestanyes o desapareixen.
→ **De 7 pàgines a 1-2.**

## 🟡 TROBALLA #2 — Menú de 24 entrades amb economia dispersa
Al menú, els números viuen a **3 llocs separats**: «Cockpit» (Sistema), «Finances» (Sistema),
+ analytics/reporting solts. **PROPOSTA:** un sol grup «Diners» al menú. Redueix càrrega mental.

## 🟡 TROBALLA #3 — DOCS interns com a pàgines admin (4)
`/admin/docs/{esquema,full-de-ruta,organisme,protocol}` + `/admin/manual` = **5 pàgines** que
mostren documentació interna dins l'admin de producció. **PROPOSTA:** agrupar en 1 sol
«Manual» amb pestanyes, o treure de la nav principal (no és operativa diària).

## 🟡 TROBALLA #4 — Eines de sistema disperses
`canvas`, `css-manager`, `features`, `scripts`, `intake`, `coverage` = eines tècniques
soltes al menú. **PROPOSTA:** un sol «Sistema/Dev» col·lapsat; treure-les del flux diari.

## 🟢 TROBALLA #5 — Homogeneïtzació visual (ja diagnosticat 1a passada)
El sistema visual JA és coherent (capçalera `.ap-*` idèntica a leads). La diferència és el
CONTINGUT (calendari vs panell), no el sistema. **NO refer 93 pàgines.** Micro-millores
transversals (aire/profunditat a `.ap-card`) provades, valor baix. **El veritable homogeni
ja existeix** — el que cal és REDUIR pàgines, no repintar-les.

## ✅ El que NO s'ha de tocar (funciona i és bo)
- Flux lead→cash (verificat punta a punta)
- Motor econòmic (quadra al cèntim)
- Cara externa: PDF, emails, portal (professionals, verificats amb render)
- Fitxa de lead (referència d'or)

---

## 🎯 PLA DE SIMPLIFICACIÓ — ESTAT EXECUTAT (2026-06-29)
| # | Acció | Estat |
|---|---|---|
| S1 | Fusionar les pàgines de KPIs en 1 «Centre econòmic» | ✅ **FET #1224** — cockpit+reporting→economia (pestanyes ja existien); redirects, cap enllaç trencat |
| S2 | Reordenar el menú | ✅ **FET #1225** — Economia surt de «Sistema» cap a «Operativa» (dia a dia) |
| S3 | Treure docs del menú diari | ✅ **JA DE FACTO** — Atles/Esquema/Full de ruta són `secondary` |
| S4 | Treure eines del menú | ✅ **JA DE FACTO** — analytics/canvas/css-manager/scripts/coverage fora del menú |
| S5 | Decidir emails (connectar tots o retirar) | ⬜ **DECISIÓ PROPIETARI** — booking_confirmation ja connectat (#1221); patró llest |
| S6 | Micro-homogeneïtzació visual | ⬜ requereix propietari davant pantalla |

### Altres candidats de fusió revisats (i DESCARTATS)
- `ressenyes` (testimonials propis) vs `google-reviews` (Google Business) → **fonts diferents, NO duplicat.**
- `marketing` (Hub overview) vs `campaigns` (enviament massiu CRM) → **funcions diferents, NO duplicat.**
- **Conclusió:** la duplicació de KPIs era l'ÚNICA fusió clara i de baix risc. Resolta. La resta de la
  «abundància» són pàgines amb funció pròpia (no eliminables sense decisió de producte del propietari).

## ⚠️ El que NOMÉS pot decidir el propietari (3a passada)
Tot S1-S4 toca **què veus i uses cada dia** → cal que confirmis quines d'aquestes pàgines
obres de debò. **No es fusiona/amaga res a cegues.** El mètode: tu obres el menú, em dius
«això no ho miro mai / això és el que uso», i simplifico amb seguretat.

## El veredicte de Sauron, en una frase
> **No tens un problema de qualitat — tens un problema d'ABUNDÀNCIA.** El codi és bo; n'hi
> ha massa. La millora de més valor no és afegir ni repintar: és **fusionar les 7 pàgines
> de números en 1-2 i aprimar el menú.** Menys superfície = un cap que se'n refia.
