# Tino — material de lloguer (spec del seed, PENDENT de completar preus)

**Model de negoci (confirmat 2026-06-12):** Tino lloga material a Òrbita. El material
s'arrossega al bolo amb el seu **preu de lloguer** (= `costPrice`, el que paguem a Tino).
**L'operari sempre és Òrbita** (jo) → a diferència de Masquerade, NO hi ha selector de
«qui ho opera». És simplement un `CollaboratorProduct` de Tino que apareix al grup
«Serveis de Tino» i s'arrossega al bolo.

Tino = nou `Collaborator` (rol proveïdor de lloguer). El seed l'aplica el propietari a
Railway (idempotent, no destructiu), com els altres.

## Productes

| Producte | Specs | Cost lloguer (a Tino) | PVP client | Inclou |
|---|---|---|---|---|
| Fum baix 2500 W | omple sala fins a 100 pax | **60 €** | _(pendent — #923 deia 75 €)_ | màquina de fum + líquid de fum + aigua destil·lada |
| Xispes fredes (2 màquines) | — | **250 €** | _(pendent — #923 deia 350 €)_ | 2 màquines + 1 sobre de consumible (el sobre val 60 €, ja inclòs en el preu) |
| Micròfon Shure | — | **30 €** | _(pendent)_ | — |

## Pendent del propietari
- Confirmar **PVP** de cada material (cost → PVP). Per defecte es pot derivar amb `resellPrice(cost)`.
  - Fum baix: cost 60 → `resellPrice(60)` = 75 ✓ (coincideix amb #923).
  - Xispes: cost 250 → `resellPrice(250)` = 300 (#923 en deia 350 — confirmar quin val).
  - Micròfon: cost 30 → `resellPrice(30)` ≈ 40.
- ¿Hi ha **més material de Tino** o ja estan tots aquests tres?

## Estat
- ✅ Seed creat: `scripts/seed-tino-products.mjs` (idempotent, PVP via `resellPrice(cost)`: fum 60→75, xispes 250→300, micro 30→40). Crea `Collaborator` Tino amb rol `EQUIPMENT_RENTAL`.
- ⏳ **L'aplica el propietari** a Railway: `node scripts/seed-tino-products.mjs` (escriu a BD).
- Després apareix al catàleg del bolo com a chip de proveïdor «Tino» (activable).
