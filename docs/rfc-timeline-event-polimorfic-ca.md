# RFC — TimelineEvent polimòrfic

Data: 2026-05-17
Estat: proposta de direcció, no implementació de schema
Front: §6.3 Timeline canònica

## Objectiu

Definir quan té sentit crear una entitat única `TimelineEvent` que absorbeixi lectures avui separades entre `customerActivity`, `leadActivity`, missatges i events operatius. Aquest RFC no autoritza cap migració immediata: només fixa criteris perquè un futur canvi de schema no barregi timeline operativa amb log tècnic.

## Problema

El producte ja mostra una història comercial coherent, però la persistència continua repartida per domini. Això és acceptable mentre cada workspace llegeixi una narrativa clara. El risc apareix quan una nova peça vol analítica transversal, SLA o automatismes sobre events i reobre queries locals contra fonts diferents.

## Distinció obligatòria

**Timeline operativa**:
- explica què ha passat en el cicle de negoci;
- ajuda a decidir el pròxim moviment;
- és llegible per una persona no tècnica;
- pot aparèixer al Customer Hub, Lead Hub, Booking, Reporting o Daily Brief.

**Log tècnic**:
- explica execucions internes, payloads, retries, errors i traça de sistema;
- serveix per debug, auditoria tècnica o incidències;
- no ha de contaminar la història del client si no canvia una decisió de negoci.

## Criteris d’entrada a `TimelineEvent`

Un event pot entrar a l’entitat única només si compleix almenys dos criteris:
- canvia estat comercial, operatiu, financer o relacional;
- desbloqueja o bloqueja una acció humana;
- afecta conversió, execució, cobrament o recurrència;
- necessita aparèixer en més d’un workspace;
- ha de participar en analítica transversal.

Si només descriu una execució interna o un detall de transport, queda en log tècnic o `adminLog`.

## Shape conceptual

```ts
type TimelineEvent = {
  id: string;
  subjectType: 'LEAD' | 'CUSTOMER' | 'BOOKING' | 'PROPOSAL' | 'PAYMENT' | 'SYSTEM';
  subjectId: string;
  customerId?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  type: string;
  title: string;
  description?: string | null;
  occurredAt: Date;
  source: 'HUMAN' | 'AUTOMATION' | 'INTEGRATION' | 'SYSTEM';
  visibility: 'OPERATIVE' | 'TECHNICAL';
  metadata?: Record<string, unknown>;
};
```

## Migració recomanada

1. Afegir adapters de lectura que projectin `customerActivity` i `leadActivity` al shape conceptual, sense persistir cap model nou.
2. Fer que Customer Hub i Lead Hub consumeixin el mateix projector en un test de contracte.
3. Només quan hi hagi dues lectures transversals reals, crear schema `TimelineEvent`.
4. Migrar events operatius, no logs tècnics.
5. Mantenir helpers d’escriptura de domini com a façana; cap UI escriu `TimelineEvent` directament.

## No-goals

- No substituir `adminLog`.
- No fusionar payloads tècnics amb història del client.
- No crear una taula nova només per neteja estètica.
- No tocar `schema.prisma` sense una migració i tests de lectura/escriptura.

## Decisió

La direcció preferida és una entitat `TimelineEvent` polimòrfica, però només després d’un projector compartit i evidència d’ús transversal. Fins llavors, la regla és consolidar lectures i helpers, no crear schema.
