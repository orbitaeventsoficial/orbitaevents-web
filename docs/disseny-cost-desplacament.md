# 🚗 Disseny — Cost de desplaçament: temps de viatge com a cost laboral

> **Autor del criteri:** propietari (conversa 2026-07-01), sintetitzat per Opus.
> **Per a:** Codex (té el transport a les mans: `travelLaborCost.ts`, `travelCost.ts`, `NewBookingForm`).
> **Estat:** decisió de producte TANCADA pel propietari. Falta implementar la imputació + UI.

## El problema (què està malament ara)
Codex ja calcula bé vehicle + conductor + passatgers + hores (`calculateTravelCostBreakdown`),
PERÒ els injecta com a **línies de servei** (`serviceLines` amb marker `[travel-cost]`) →
apareixen a **"productes contractats"**. **Això és incorrecte:** el client no contracta
"3h de conductor"; el desplaçament és **cost intern del bolo** que menja marge, no un servei.

## El principi (validat pel propietari)
**Ningú viatja gratis — ni els acompanyants.** La tarifa d'un col·laborador (p.ex. Carlos,
Bingo 160€) cobreix **l'actuació** (1,5h), NO les 6h de cotxe. El temps de viatge de TOTS els
integrants (conductor i passatgers, d'Òrbita o de Masquerade) és temps real invertit que ha de
comptar. Un bolo a Andorra amb 4 integrants = ~24 hores-persona de viatge per una actuació de 2h:
el marge ho ha de reflectir o el sistema menteix.

## El model correcte (2 costos separats)
| Cost | Depèn de | Fórmula |
|---|---|---|
| **Vehicle** | quants **cotxes** | `km × €/km` (ja existeix a `travelCost`) |
| **Temps** | quantes **persones** | `integrants × hores_ruta × tarifa/hora` |

- 4 persones en 1 cotxe = **1** cost de vehicle + **4** costos de temps.
- 4 persones en 2 cotxes = **2** vehicles + **4** temps.
- `hores_ruta` = km ÷ velocitat mitjana (auto, editable). `tarifa/hora` pot diferir per rol
  (conductor tarifa plena; acompanyant potser una tarifa de temps/dieta menor — decisió del propietari).

## Els integrants es DERIVEN dels serveis (no es pregunten a mà)
Cada servei/producte porta el seu **headcount** (persones que hi treballen), com una dada del
producte (igual que PVP o hores):
- **Bingo Musical → 2 persones** (d'Òrbita o Masquerade, igual)
- **+ presentador → +1** · **+ DJ → +1** · **+ assistent → +1** · ...i successivament

El bolo **suma els headcounts** de tot el que porta → «integrants: N» automàtic. **Ajustable a mà**
(comparteixen cotxe, algú ja és a la zona, etc.), i **cotxes** com a dada a part (per al cost de vehicle).

## Llindar de km
- **Per sota del llindar X** (proposar al propietari; referència: hi ha `INCLUDED_TRAVEL_KM=50`, però
  el llindar d'HORES probablement és més alt) → temps inclòs, 0 hores, no es mostra res.
- **Per sobre de X** → es comencen a comptar hores de viatge.

## Què cal fer (checklist per a Codex)
- [ ] **Headcount per servei/producte**: afegir camp «persones» a la config de productes (Bingo=2, DJ=1,
      presentador=1, assistent=1...). Derivar `integrants = Σ headcount` del bolo.
- [ ] **Imputació al cost, NO com a serviceLine**: treure el `setServiceLines([...travelLines])` de
      `NewBookingForm`. El cost de temps de viatge s'imputa al **cost del bolo** (via costEngine, com a
      cost operatiu/laboral intern), perquè segueixi menjant marge sense ser una línia visible.
      ⚠️ Clau: si es treu de serviceLines sense reimputar, el cost desapareix i el marge torna a mentir.
- [ ] **Llindar de km**: per sota → 0 hores; per sobre → comptar. Valor X a confirmar amb el propietari.
- [ ] **UI (fitxa/nova reserva)**: NO llistar les persones com a productes. Mostrar:
      «Integrants: N · a partir de X km es cobra temps · cost de desplaçament (vehicle + temps): Y €».
      Que el desglossament sigui visible com a **cost**, no com a servei contractat.
- [ ] **Recàlcul sempre des dels km**: en canviar els km (o els serveis → integrants), es recalcula sol.

## La conseqüència de negoci (per què val la pena)
La fitxa ha de dir la veritat: «aquest Bingo a Andorra et costa ~3 jornades de temps de 4 persones —
cobra en conseqüència o rebutja'l». Derivar els integrants dels serveis fa que aquest avís surti
**sol**, sense recordar comptar ningú. Ara el sistema ho amaga com un producte petit; ha de menjar
el marge visiblement.

## Coordinació
Feina de model/cost → **Codex** (context fresc del càlcul). Claude no toca costEngine/transport
(repartiment vigent). El cas real muntat per Codex (`OE-2026-006`, Andorra, Bingo) és el banc de
proves ideal per validar-ho.
