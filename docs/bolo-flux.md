# El BOLO — flux i configurador (arquitectura definitiva)

> Decidit amb el propietari (2026-06-09) i dissenyat per Opus. Aquest document és la
> font de veritat del flux comercial. Llegir abans de tocar el configurador.

## Model de negoci (la veritat)
- Entren leads: web (pack o info) o via partners (Masquerade/Rufo/Tino), entrats a mà.
- Flux: **Lead → BOLO → (Dossier i/o Pressupost) → Reserva**.
- **1 lead = 1 BOLO.** El bolo és una entitat viva que es munta UNA vegada i evoluciona
  (dossier → pressupost → reserva). Mai es remunta; es retoca. Té historial.
- Cada document generat (dossier/pressupost) = una **FOTO** del bolo en aquell moment, guardada.
- El **configurador és l'única eina** per muntar el bolo. El generador de dossiers actual s'hi fon.
- **Dossier i pressupost = un sol generador, dos modes**: dossier complet (pressupost a l'última
  pàgina) o pressupost sol.
- **Preus orientatius editables**: el preu final el pacta el propietari (preu acordat). Res automàtic.
- **La pasta (cost/marge) NO es veu al configurador**; cada línia porta el cost amagat i alimenta
  SOLA la fulla d'economia (net per bolo). Packs = orientatius, mai obligatoris.
- **Regla DJ normalitzada**: 1a hora 150€, cada hora addicional 100€ (1h=150, 2h=250, extra=100).
- Material de Tino/Rufo (lloguer) = referència interna a part, NO producte de client.

## Arquitectura
- **El bolo viu a `Lead` + nova taula `LeadServiceLine`** (mirall 1:1 de `BookingServiceLine`,
  reusa l'enum `BookingServiceLineKind`). El `Dossier` NO és l'entitat del bolo (és una foto).
- **Configurador** = `BookingServiceLineSection` actual, promogut a component compartit
  (edita línies tant al lead com a la reserva).
- **Generació**: adaptador línies-del-bolo → input del PDF; un generador amb `mode: full|quote`.
  Cada generació crea un `Dossier` amb `lineSnapshot` (foto) + `mode`.
- **Reserva**: en confirmar, es **copien** les línies del lead a `BookingServiceLine`.
- **Economia**: la fulla d'economia suma les línies (revenue + cost via `costAmount` o
  `orbitaServiceCostRatio`) i passa els agregats a `computeBookingFinancialSummary` (ja existent).

## Fases
- **Fase 1 (ARA)**: el bolo viu al Lead.
  1. Migració `LeadServiceLine` (+ relació a Lead i Collaborator). [propietari desplega]
  2. `leadServiceLineService` + test.
  3. API `GET`/`PUT /api/admin/leads/[id]/service-lines`.
  4. Muntar el configurador a la fitxa del lead (carrega/desa línies).
- **Fase 2**: propagació lead → reserva (copia línies a `BookingServiceLine`).
- **Fase 3**: generador unificat des del bolo (`mode: full|quote`) + `Dossier.lineSnapshot`.
- **Fase 4**: fulla d'economia del bolo (net per bolo, reusant costEngine).

## NO tocar
- Signatura de `computeBookingFinancialSummary`, `Customer`, web pública, headers seguretat.
- Enum `BookingServiceLineKind` (es reutilitza, no se'n crea un de nou).
- Dossiers existents (`productIds`): lectura compatible, no purgar.

## Decisió oberta (producte, no risc)
- Al Lead, el grup "Packs base excloent" actiu o només al Booking? El component ja ho fa opcional.
