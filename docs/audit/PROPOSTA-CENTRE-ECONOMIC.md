# 💰 Proposta — «Centre econòmic» (fusió de les 4 pàgines de KPIs)

> Disseny sobre paper (NO toca codi). Fusiona els 4 panells que mostren els mateixos KPIs
> en 1 sola pàgina amb pestanyes. El propietari valida abans de construir res.

## Punt de partida — què mostra cada pàgina avui (inspeccionat)
| Pàgina | Contingut real | Veredicte |
|---|---|---|
| `/admin/cockpit` (116L) | Previsió: compromès, probable, històric, marge previst, previsió mes a mes | → pestanya **Previsió** |
| `/admin/economia` (2.927L) | Cobraments (bestreta, cobrat mes, pendents, acumulat, benefici), CAC per canal | → base + pestanya **Cobraments** |
| `/admin/analytics` (328L) | Rendiment comercial + WEB/GA4 (pageviews, fonts, actius ara) + facturació any | → pestanya **Rendiment** (la part web) |
| `/admin/reporting` (385L) | Conversió per origen, clients recurrents, ingressos, click-rate emails | → pestanya **Rendiment** (la part comercial) |

**Matís clau (descobert inspeccionant):** NO tot va al Centre econòmic:
- `coverage` = cobertura geogràfica (ciutats/províncies) → és **territorial/màrqueting**, NO diners. Es queda fora.
- `cost-calculator` + `pricing` = **eines de configuració** de preus de packs/inventari → secció **Catàleg/Preus**, NO panell de KPIs. Es queden fora.

→ El Centre econòmic fusiona **NOMÉS 4** (cockpit, economia, analytics, reporting). Les altres 3 es reubiquen.

## El disseny: `/admin/economia` amb 4 pestanyes (reaprofitant la base existent)

```
┌─────────────────────────────────────────────────────────────────┐
│  CENTRE ECONÒMIC                          [Període: mes ▾] [CSV]  │
│  ───────────────────────────────────────────────────────────────│
│  [ Resum ]  [ Cobraments ]  [ Previsió ]  [ Rendiment ]          │  ← pestanyes (BookingSectionNav, ja existeix)
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  PESTANYA «RESUM» (la d'entrada — el que mires cada matí)         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                     │
│  │Tresoreria│ │Cobrat  │ │Pipeline│ │Marge   │   ← 4 KPIs clau    │
│  │5.724 €  │ │mes     │ │obert   │ │mitjà % │     (de cockpit+rep)│
│  └────────┘ └────────┘ └────────┘ └────────┘                     │
│  + 3 alertes («X cobraments pendents», «Y bolos sense reserva»)   │
└─────────────────────────────────────────────────────────────────┘
```

### Què va a cada pestanya
| Pestanya | Origen | Contingut |
|---|---|---|
| **Resum** | cockpit + reporting (top) | 4 KPIs clau (tresoreria, cobrat mes, pipeline, marge) + alertes. La portada econòmica. |
| **Cobraments** | economia | bestreta, cobrat, pendents, acumulat, benefici, semàfor de pagament |
| **Previsió** | cockpit | compromès/probable/històric, previsió mes a mes, marge previst |
| **Rendiment** | analytics + reporting | conversió per origen, CAC per canal, clients recurrents, click-rate emails, web/GA4 |

## Resultat
- **De 4 pàgines de menú → 1** («Finances»/«Diners»), amb 4 pestanyes.
- `cockpit`, `analytics`, `reporting` → **eliminades** (el seu contingut viu a pestanyes).
- `coverage` → mou a grup **Web/Màrqueting**. `cost-calculator`+`pricing` → grup **Catàleg**.
- El menú baixa de 24 a ~20 entrades amb aquest sol moviment.

## Com es construiria (quan validis)
1. **Base:** `/admin/economia` ja és la més rica (2.927L) → s'hi afegeixen les pestanyes amb `BookingSectionNav` (component de pestanyes ja existent i canònic).
2. **Migrar** els blocs de cockpit/analytics/reporting com a components dins les pestanyes (reaprofitar, no reescriure).
3. **Redirigir** `/admin/cockpit`, `/admin/analytics`, `/admin/reporting` → `/admin/economia?tab=...` (no trencar enllaços existents).
4. **Treure** les 3 entrades velles del menú.
5. Validar amb captures als 3 breakpoints.

## ⚠️ El que necessito de tu abans de construir (la 3a passada)
3 preguntes ràpides, perquè la fusió sigui la TEVA:
1. **Quina d'aquestes 4 obres de debò cada dia?** (per saber quina ha de ser la pestanya «Resum» per defecte)
2. **Hi ha algun KPI concret que mires sempre** i no pot faltar a la portada?
3. **GA4/web (analytics)**: ho mires? Si no, la pestanya «Rendiment» pot ser més simple.

Amb les teves 3 respostes, construeixo el Centre econòmic real. **Risc baix** (és reorganitzar
el que ja existeix, amb redireccions perquè res es trenqui), **impacte alt** (de 7 pàgines de
números a 1+eines).
