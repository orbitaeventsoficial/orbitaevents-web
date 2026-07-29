# 📦 Esborrany — assignació inventari → packs (per aprovar)

> **Per què.** Cap pack té inventari assignat → l'amortització no s'atribueix i el «preu
> recomanat» surt 0€ (D1). Aquest esborrany proposa quin equip usa cada pack, perquè el
> motor de cost calculi amortització real. **Lògica:** el que un DJ porta de debò a cada
> tipus de bolo, escalat per durada/preu. **Aprova o ajusta**, i genero el seed que ho munta.
>
> ⚠️ La **decoració temàtica** (DECORATION_HP «Món Màgic», DECORATION_HW «Halloween») i els
> **efectes especials** (CO2, confeti, espurnes) NO van al pack base d'un servei genèric:
> són **extres temàtics** que se sumen al bolo quan el client els contracta. Per això no els
> poso al pack estàndard (només al tier alt com a kit complet).

## Inventari disponible (51 items, per categoria)
- **SOUND** (6): Controladora Pioneer DDJ-REV7, Pioneer DDJ REV7, Auriculars HDJ-CX, 2× Altaveu EV ETX-12P 2000W, 2× Micròfon sense fils
- **LIGHTING** (10): 3× Focus Bash LED, 4× Cap Mòbil 150W LED, Multiefectes LED, Llum USB cabina
- **STRUCTURE** (7): Cabina DJ Professional, Tela blanca/negra cabina, 4× Trípode
- **CABLING** (5): Cablejat DMX, Allargo 50m, 3× Allargo 3m
- **TECH** (2): Portàtil HP OMEN, GoPro 11
- **CONSUMABLE** (5): líquid fum, bombolles, confeti, espurnes
- **EFFECTS** (7): màquina fum, fum baix, canó CO2, canó confeti, 2× espurnes fredes, bombolles
- **DECORATION_HP** (7) / **DECORATION_HW** (2): temàtics → extres, NO al pack base

## Proposta per TIERS (els packs del mateix tier comparteixen kit base)

### 🟢 TIER 1 — Bàsic / curt (250€, 1-2h) · `disco-basico`, `bodas-basico`, `empresas-cocktail`, `bingo-musical`, `batalla-musical`
Kit mínim que fa sonar i il·lumina un bolo:
| Item | Qt |
|---|---|
| Controladora Pioneer DDJ-REV7 | 1 |
| Auriculars Pioneer HDJ-CX | 1 |
| Altaveu EV ETX-12P 2000W | 2 |
| Micròfon sense fils | 1 |
| Cabina DJ Professional | 1 |
| Tela cabina | 1 |
| Trípode | 2 |
| Focus Bash LED | 2 |
| Cablejat DMX | 1 |
| Allargo 50m | 1 |
| Allargo 3m | 1 |
| Portàtil HP OMEN | 1 |
| Líquid de fum | 1 |

### 🟡 TIER 2 — Premium (350-550€, 3-5h) · `disco-premium`, `bodas-premium`, `empresas-gala`, `empresas-evento`, `disco-completo`
TIER 1 **+** més llum i efectes:
| Item afegit | Qt |
|---|---|
| Cap Mòbil 150W LED | 2 |
| Multiefectes LED | 1 |
| Màquina de fum | 1 |
| Màquina d'Espurnes Fredes | 1 |
| Allargo 3m (extra) | 1 |
| Líquid de fum (extra) | 1 |

### 🔴 TIER 3 — Luxury (650€, 6h) · `bodas-luxury`
TIER 2 **+** kit complet:
| Item afegit | Qt |
|---|---|
| Cap Mòbil 150W LED (total 4) | +2 |
| Canó CO2 | 1 |
| Canó de Confeti | 1 |
| Màquina de Bombolles | 1 |
| GoPro 11 | 1 |

## Què passa quan ho aprovis
1. Genero un seed (`scripts/seed-pack-inventory.mjs`) que crea els `PackItem` segons aquesta taula.
2. Tu omples el **preu de compra** dels 32 items sense cost (`/admin/inventory?health=missing-cost`).
3. El motor calcula **amortització/hora → cost real del pack → preu recomanat**. D1+D2+D3 desbloquejats.

## Per decidir (tu)
- ¿La decoració temàtica (Món Màgic, Halloween) és **extra** o vols que vagi a algun pack concret?
- ¿Els micros i la GoPro van a tots o només a bodes/empreses?
- ¿Vols `bingo-musical`/`batalla-musical` (1h, formats joc) amb menys equip encara (sense cabina)?
