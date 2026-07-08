# Manolo — ordre del flux lead -> dossier -> pressupost -> reserva

> Canvi #1745 · 2026-07-08 · codex  
> Motiu: el lead i el dossier havien acumulat massa detall intern: desplaçament redundant, pacte partner repetit, marge massa comptable i imatges de dossier que podien quedar retallades.

## Veredicte Manolo

El motor economic no era el problema. El problema era d'escenari: el lead estava ensenyant conversa de reserva abans que existis una reserva. Aixo fa soroll, baixa claredat i obliga el propietari a llegir una auditoria sencera quan el que necessita es decidir si el bolo es pot vendre i si el partner valida l'import.

## Responsabilitat per etapa

| Etapa | Que ha de resoldre | Que ha de veure | Que no hi toca |
|---|---|---|---|
| Lead | Decidir si el bolo avanca i validar pacte previ | Serveis, transport visible, total client, pacte curt amb partner, CTA a dossier/pressupost/reserva | Liquidacio interna completa, net d'Orbita fila a fila, taula de costos |
| Dossier | Vendre valor i explicar l'oferta | Experiencies, preu o estimacio, desplacament client-facing, narrativa comercial | Compensacions amb partners, cost intern, marge |
| Pressupost | Deixar import comercial/contractual clar | Linies comercials, total client, desplacament com a concepte net | Textos de "cost real", auditoria de ruta, qui cobra que |
| Reserva | Executar i liquidar | Serveis finals, ruta final, cobraments, pagaments, detall de costos, marge, pacte complet | Duplicar el discurs comercial del dossier |

## Que faltava o sobrava

- Sobrava al lead: `Detall intern de costos i ruta`. Es informacio de reserva/economia, no de decisio pre-proposta.
- Sobrava al desplaçament del lead: fórmula llarga i línies de qui cobra repetint vehicle, hores i dietes. El lead necessita total i conceptes agregats; la liquidació per persona és de reserva.
- Sobrava al pressupost: dir `cost real de ruta` al client. Aixo es llenguatge intern i rebaixa la presentacio comercial.
- Sobrava al rail de marge: 10 files comptables competint amb la decisio. El lead necessita net, producte propi, partner, transport i cost total.
- Faltava una regla escrita: el lead pot validar el partner, pero la liquidacio final viu a la reserva.
- Faltava una lectura curta: Masquerade ha de poder veure que cobra sense empassar-se el marge d'Orbita.
- Faltava una regla visual dura per dossier: les imatges de producte s'han de veure senceres sempre, també si son quadrades o verticals.
- Ja estava cobert: les linies ocultes `[travel-cost]` continuen sent la veritat tecnica que viatja de lead a dossier/reserva sense mostrar-se com a producte visible.

## Tall #1745

- El lead conserva `Pacte amb partner`, pero nomes com a pacte curt: import del partner i linies que li afecten, sense capçalera duplicada ni pedagogia redundant.
- El desplaçament del lead passa a resum agregat: total ruta + vehicle/equip/dietes/peatges. Les fórmules i el repartiment per persona queden per a reserva.
- El rail de marge passa de comptabilitat granular a lectura de decisio: net, producte propi, partner, transport i cost total estimat.
- La taula interna queda reservada al mode intern del mateix `RepartimentPanel`, que es la reserva/economia.
- El pressupost deixa de parlar de `cost real` i descriu el transport com `desplacament calculat per ruta i equip`.
- El dossier HTML/PDF i el generador passen a imatge completa sempre: `contain`, contenidor mes quadrat/alt i PDF amb imatge de capítol ampla, no retallada.
- No es toquen formulas, schema, BD ni persistencia de `[travel-cost]`.

## Seguent comprovacio recomanada

Fer un recorregut complet amb un lead real:

1. Lead amb servei partner + DJ propi + ruta llarga + peatges.
2. Crear dossier i comprovar que ven valor sense liquidacio.
3. Crear pressupost i comprovar que l'import client queda net.
4. Crear reserva i comprovar que la liquidacio completa apareix alla, amb les linies `[travel-cost]` preservades.
