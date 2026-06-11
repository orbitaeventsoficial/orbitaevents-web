# Cuadrant operatiu + Repartiment de pasta — concepte (requisit del propietari)

> Apuntat 2026-06-10 arran de muntar el bolo de Cristina Rey. Decisió de DISSENY
> pendent (Opus): cal crear 1-2 pàgines noves o ampliar-ne d'existents.

## La idea (paraules del propietari)

La informació de **qui fa cada cosa i com es reparteix la pasta** NO és tant rellevant
a la fitxa del lead (que és **comercial**), sinó a:
- una **fitxa de cuadrant** (operatiu: qui treballa, quan, on; **solapaments**, **disponibilitat**),
- i una de **repartiment de pasta** (qui cobra què).

Motiu clau: «si es solapen 2 bolos he de saber les hores que estic ocupat a un lloc o a
un altre» → control d'**ocupació, solapaments i disponibilitat** per persona.

Principi que el propietari ha repetit: **el mateix producte, segons qui el ven/executa,
reparteix la pasta cap a un costat o l'altre**. El DJ o el tècnic de so poden ser ell
(cost ~0, marge) o un tercer (cost real). El PVP al client és fix; el **net depèn de qui ho fa**.

## Separació de 3 vistes sobre les MATEIXES dades

| Vista | Què respon | Font de dades |
|---|---|---|
| **Fitxa del lead** (comercial) — JA EXISTEIX | Què compra el client, a quin preu, net global | bolo (`LeadServiceLine.revenueAmount` = PVP) |
| **Cuadrant** (operatiu) — NOU | Qui treballa, on, quines hores · solapaments · disponibilitat | línies (qui + `hours`) + data/hora de l'event |
| **Repartiment de pasta** — NOU | Qui cobra què (col·laboradors, propietari, tercers) | `costAmount` + `collaboratorId` de cada línia |

**No és dada nova**: cada línia del bolo ja porta «qui ho fa» (`collaboratorId`) i «cost»
(`costAmount`), i el lead porta data + hora. El cuadrant/repartiment són **vistes** que
creuen tots els bolos per dia/hora.

L'únic que cal perquè detecti **solapaments**: que cada assignació tingui **hores**
(`LeadServiceLine.hours` ja existeix) lligades a l'horari de l'event.

## Pregunta de disseny per a Opus

- Pàgina(es) NOVA(es) o **ampliar** existents? Candidats existents a considerar:
  `/admin/calendario`, el calendari de leads (`LeadsSeasonClient`), Partner Hub
  (`/admin/collaborators/[id]`), l'agenda multi-bolo (codex #898).
- Què mostra cada vista i com s'hi navega.
- Com es detecten i s'avisen els **solapaments** (mateixa persona, dues franjes que xoquen).
- Model de **disponibilitat** (bloquejos manuals + ocupació derivada dels bolos).
- Repartiment: agregació de pagaments per col·laborador i per període (reusar `costEngine`).

## Restriccions
- Reusar dades (zero duplicació) i `computeBookingFinancialSummary` per a diners.
- Sistema visual `/admin/studio` (tokens `--ax-*`/`--o-*`), monocapa, responsiu.
- No tocar la signatura de costEngine ni el model comercial del lead.

---

# PLA (dissenyat per Opus, 2026-06-10)

## Recomanació: NOU, no ampliar — secció `/admin/cuadrant` amb 2 subvistes
- El calendari i `capacity` giren al voltant del **dia/reserva**; el cuadrant gira al voltant de la **persona** (qui treballa, quines hores, solapaments). Forçar-ho al calendari trencaria el seu model. El repartiment és econòmic agregat per col·laborador, tampoc encaixa al calendari ni a Finances.
- Subrutes `/admin/cuadrant` (operatiu) i `/admin/cuadrant/repartiment` amb toggle compartit. NO es toca la fitxa del lead (queda comercial).
- Ampliació menor opcional (fase tardana): mòdul "Properes assignacions" al Partner Hub reusant el mateix servei.

## Pàgines
- **`/admin/cuadrant`** — persona × dia (col·laborador o propietari = línies sense `collaboratorId`). Per persona: assignacions amb franja `HH:MM–HH:MM`, event/client (link), kind, hores. **Badge de solapament** + panell d'alertes. Indicador disponibilitat (lliure/ocupat/bloquejat).
- **`/admin/cuadrant/repartiment`** — agregació per col·laborador × període: total `costAmount` a pagar, nre. assignacions, llista d'events. Fila propietari = la seva part. Totals: PVP total, repartit a tercers, net propietari.

## Servei + dades
- Nou `lib/services/crewScheduleService.ts` (funcions pures + wrappers, patró `seasonCalendarService`): carrega `LeadServiceLine` + `BookingServiceLine` de la finestra, enriqueix amb data/hora/lloc/client del pare, agrupa per persona, detecta solapaments, i per al repartiment **reusa `aggregateServiceLines` de costEngine** (no reimplementa la regla de cost).
- API: `GET /api/admin/cuadrant`, `GET /api/admin/cuadrant/repartiment`, `POST/DELETE /api/admin/cuadrant/blocks`.
- **Migració mínima**: nou model `CrewBlock` (bloquejos manuals de disponibilitat per persona; `collaboratorId?` null=propietari, `date`, `startTime?`/`endTime?`, `reason?`). L'ocupació real ja deriva dels bolos — NO es persisteix. Cap camp nou a les línies (`hours` ja hi és).

## Algorisme de solapaments
Per assignació, derivar `[start,end]` en minuts: `start`=`eventStartTime`; `end`=`start+hours*60` (o `eventEndTime`, o default 4h); si `end<=start` (creua mitjanit) `+24h`. Dues assignacions de la mateixa persona el mateix dia solapen si `A.start < B.end && B.start < A.end`. Els `CrewBlock` entren com a intervals ocupats. Assignacions sense hora → avís suau.

## Fases
- **F0** — `crewScheduleService` (pures: `buildCrewSchedule`, `detectOverlaps`) + tests. Sense UI.
- **F1** — `/admin/cuadrant` (lectura) + `GET /api/admin/cuadrant` + entrada al nav (Operacions).
- **F2** — `/admin/cuadrant/repartiment` + `buildPayoutSummary` (reusant `aggregateServiceLines`).
- **F3** — migració `CrewBlock` + UI de bloquejos + integració a la detecció.
- **F4 (opcional)** — mòdul al Partner Hub; `startTime`/`endTime` per línia si es demana.

## Fitxers clau
`lib/services/costEngine.ts` (reusar `aggregateServiceLines`) · `lib/services/seasonCalendarService.ts` (patró càrrega+dates) · `app/admin/calendario/CalendarDayClient.tsx` (timeline horari, `parseHour`) · `prisma/schema.prisma` (afegir `CrewBlock`) · `app/admin/components/nav-items.ts` (registrar la secció).
