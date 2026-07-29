# Manolo / Zenit — PDFs un a un

> Canvis #1429-#1434 · 2026-07-05 · Estat: passada executable tancada

## Regla aplicada

Cada PDF ha de respondre tres coses:

1. **D'on hereta**: quin client, lead, proposta o reserva l'alimenta.
2. **Què ven o protegeix**: conversió, confiança, operació, marge o prova legal/econòmica.
3. **Quin pas obre**: acceptar, reservar, operar, cobrar, revisar marge o reactivar.

Si un PDF només és "un arxiu que surt", Manolo el suspèn. Un document comercial ha de provocar decisió.

## 1. Pressupost

- Generador: `generateQuotePDF`.
- Font de dades: `QuoteData` des de Studio/lead/configurador.
- Veredicte Manolo: ven millor que una taula freda, però encara té copy català/espanyol massa pla i algunes labels sense accent que baixen percepció premium.
- Risc: el client veu preu, però no sempre veu prou justificació de valor abans del total.
- Tall aplicat #1430: sanejats labels i microcopy visible del pressupost. `Que inclou` → `Què inclou`, `Resum economic` → `Resum econòmic`, `Per que escollir-nos` → `Per què escollir-nos`, `Reserva amb dipòsit` → `Reserva amb paga i senyal`; en castellà, `Qué incluye`, `Resumen económico`, `días` i `Por qué elegirnos`.
- Validació: `quotePdfService.test.ts` llegeix el text intern del PDF i blinda català i castellà perquè no tornin els literals sense accent ni el CTA `Reserva amb dipòsit`.

## 2. Contracte

- Generador: `generateContractPDF`.
- Font de dades: proposta/reserva i dades fiscals.
- Veredicte Manolo: el contracte és correcte d'estructura, però tenia llenguatge de pagament poc humà: `Aval (dipòsit)` en català semblava una garantia bancària, no una paga i senyal d'esdeveniment.
- Tall aplicat: `Aval (dipòsit)` passa a `Paga i senyal`; `Venciment aval` passa a `Venciment paga i senyal`; la traducció castellana latent de `signName` passa de català a `Nombre y apellidos`.
- Validació: `contractPdfService.test.ts` llegeix el text intern del PDF i blinda que el català visible ja diu `Paga i senyal` i no `Aval (dipòsit)`.

## 3. Catàleg de serveis

- Generador: `generateFullCatalogPDF` / `generateServiceBrochure`.
- Font de dades: catàleg de packs, extres i compatibilitats.
- Veredicte Manolo: és útil com annex, però la frase `Tens dubtes? Escriu-nos sense compromís!` és genèrica i més barata que premium.
- Risc: fa de fulletó, no de peça que ordena decisió.
- Tall aplicat #1432: el CTA deixa de ser `Tens dubtes? Escriu-nos sense compromís!` i passa a `Quan tingueu clara la direcció, ajustem proposta, data i detalls.`. Castellà i anglès també passen a una frase de decisió, no de dubte genèric.
- Validació: `catalogPdfService.test.ts` llegeix el text intern del PDF i blinda català, castellà i anglès perquè no torni el CTA barat.

## 4. Informe executiu

- Generador: `exportExecutiveReportPdf`.
- Font de dades: `ExecutiveReport`.
- Veredicte Manolo: és intern i parla de negoci, però encara no és un "què faig ara" prou tallant.
- Risc: si només informa, no governa.
- Tall aplicat #1433: l'informe obre amb `Decisió recomanada`, derivada del cervell existent `generateReportingInsights()`. Si hi ha insight crític o warning, el PDF mostra àrea, titular, detall i acció; si no, mostra seguiment sense bloqueig crític.
- Validació: `executiveReportPdfService.test.ts` blinda la decisió recomanada per SLA trencats, el fallback sense insights i el text visible dins el PDF.

## 5. Factura

- Generador: `generateInvoicePDF`.
- Font de dades: reserva/factura i estat de pagaments.
- Veredicte Manolo: correcta com a prova econòmica; el risc no és visual sinó de context: ha de poder tornar sempre a client/reserva.
- Estat amb #1428: el Customer Hub ja pot resoldre client des de `Invoice` via `customerId` o `bookingId`.
- Tall aplicat #1434: el bloc `InvoiceSection` de la fitxa de reserva mostra `Context de la factura` amb accés directe a `Client 360` i `Lead origen` quan existeixen, també abans de crear la factura.
- Validació: `InvoiceSection.test.tsx` blinda que el context client/lead sigui visible i que els hrefs canònics no desapareguin.

## 6. Dossier comercial

- Generador: `generateDossierCompositePDF`.
- Font de dades: lead/dossier, productes, col·laboradors i annex de catàleg filtrat.
- Veredicte Manolo: és la peça amb més ànima, però el copy inicial `Mireu què podem portar a la vostra festa` sona massa genèric per a un document premium.
- Risc: bona estètica, però oportunitat perduda de pujar valor percebut i reduir risc abans de veure preus.
- Tall aplicat #1431: la introducció deixa de dir `Mireu què podem portar a la vostra festa` i passa a obrir amb `Ritme, joc i moments que la gent recorda.`. El text explica que el dossier ordena opcions perquè el client imagini què anima, què acompanya i què pot quedar com a moment especial.
- Validació: `dossierCompositePdfService.test.ts` llegeix el text intern del PDF i blinda que el titular nou existeixi i que la frase genèrica antiga no torni.

## Conclusió de passada

La passada queda tancada amb sis talls: contracte, pressupost, dossier, catàleg, informe executiu i factura/context. Els documents deixen de ser arxius muts: parlen millor, venen valor abans de preu, governen decisions internes i mantenen retorn operatiu cap a client, lead o reserva.
