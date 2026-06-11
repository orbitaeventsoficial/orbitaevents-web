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

---
## PENDENT — Unificació de packs (decisió de negoci NO presa encara)

El propietari vol simplificar els packs (idea: potser només 2 — **Bàsic** i **Complet** —
amb preus unificats per HORES, no per tipus d'event; un bolo no és més car "per ser boda").
Regla de preu acordada: DJ 1a hora 150 + 100/hora addicional → Bàsic 2h = 250€.
El preu/hores del "Complet" encara NO està decidit.

### Llista de preus per a la reforma (apuntada 2026-06-10, NO aplicada)
**PRINCIPI RECTOR (propietari 2026-06-10): la feina és la mateixa → el preu és el mateix.**
Si una empresa, una boda o un aniversari contracten el mateix servei (p. ex. DJ 2h), els
costa el mateix. El preu depèn de **hores + material**, MAI del tipus d'event/client.
Cadascú "troba la seva parcel·la" comercialment, però paga el mateix pel mateix.
Ja coincideix amb `lib/constants/orbita-services.ts` (DJ 150 + 100/h); el que falta és que
els PACKS i les ~30 landings deixin de tenir preu per tipus d'event (avui bodes 350/500/1000
vs discomòbil/empreses 250/400/600 → tot a la mateixa taula per hores).
- **DJ (tots els productes)**: 1a hora **150€** + **100€**/hora extra.
- **Boda**: des de **250€** (= 2h de ball = 150 + 100).
- **Pont de llums**: **120€** (PVP).
- **Bombolles**: **50€** (PVP).
- **Fum baix**: cost **60€** (lloguer al Tino, TOT inclòs: aigua destil·lada 3L + líquid de
  fum baix). Va al repartiment com a cost. → PVP suggerit **75€** (60×1,20 ↑5). Confirmar PVP.
- **Xispes fredes** (NOU producte; servei amb LES 2 MÀQUINES com a unitat): cost **250€**
  (lloguer al Tino, sobre consumible INCLÒS). → PVP **350€** (CONFIRMAT propietari). Lloguer
  Tino = no és inventari propi; disponibilitat depèn del Tino.

### TAULA DE PREUS UNIFICADA — CONFIRMADA propietari 2026-06-10 (regla: 150 1a hora + 100/hora)
Tots els packs per HORES, igual per a tothom. 2h=250 · 3h=350 · 5h=550 · 6h=650.
- **BODES**: bàsica (2h ball) **250** · **Completa** (1h cerimònia + 2h convit + 2h ball = 5h) **550** + extres upsell · luxury (6h) **650**.
- **DISCOMÒBIL/FESTES**: bàsic (2h) **250** · complet (3h) **350** · premium (5h) **550**.
- **EMPRESES**: còctel (2h) **250** · event (3h) **350** · gala (5h) **550**.
- **ANIMACIÓ** (bingo/batalla): NO es toca (productes Masquerade a preu fix).
La «Boda completa» passa de 3h a **5h** (cerimònia+convit+ball) → cal actualitzar durada + text
(features) en ca/es/en. El «des de» de totes les landings de bodes passa de 350 a **250€**.
Es va valorar 500 com a "oferta": descartat — els números donen 550, doncs 550 + extres upsell.

### INSIGHT ESTRATÈGIC (propietari 2026-06-10) — el SEO és per MUNICIPI, no per preu
«M'han trobat MÉS per municipi que no pas per preu.» L'acquisition engine són les ~30 landings
per poble (dj-bodas-girona, etc.), NO el preu. Conseqüència de producte:
- **Protegir el SEO per municipis per damunt de tot** (no degradar keywords/títols/estructura).
- **El preu pot ser mínim i simple**: no és l'ham. **DIRECCIÓ CONFIRMADA (propietari 2026-06-10):
  1 PREU BASE + EXTRES**, no nivells de pack. Cada landing mostra «des de 250€» (un sol
  ancoratge, igual a tot arreu) i la riquesa de preu es construeix al BOLO (base 250 + hores +
  cerimònia + llums + xispes…). La «Boda completa» (550) NO és un pack fix: és un bolo típic configurat.
- Això redueix els packs a un ancoratge d'entrada per servei i alinea tot amb el lead→bolo ja fet.

### PRINCIPI: DIRECTE I DEFENDIBLE (propietari 2026-06-10)
El preu ha de ser **directe** (un sol ancoratge «des de 250€» a tot arreu) i **defendible**
(cada euro justificat: base 2h DJ 250 + cada extra amb preu clar). El total = suma del que el
client tria, mai un preu arbitrari "per ser boda". Davant un "per què val això?", la resposta
és una llista d'extres, no una categoria.

### PLA D'EXECUCIÓ (1 preu base + extres) — pendent passada neta pròpia
Objectiu: cada servei mostra un sol ancoratge «des de 250€»; la resta es construeix al bolo/extres.
1. **Base**: 1 pack base per servei (2h DJ = 250€). Desactivar (`isActive=false`, NO esborrar) la
   resta de packs a BD; treure'ls del config. Cap 404 (els packs no són URLs, només targetes).
2. **Extres canònics**: hora extra 100€, pont de llums 120, bombolles 50, fum baix 75 (cost 60),
   xispes 350 (cost 250) → `INVENTARIO.extras` + taula `Extra` + i18n 3 idiomes.
3. **SEO**: verificar que `getMinPriceByService` retorna 250 a tots els serveis → «des de 250€»
   uniforme a les ~30 landings sense tocar-ne cap (preu derivat, no hardcoded). Enriquir opcional:
   schema `Offer/PriceSpecification` + FAQ de preu per guanyar.
4. **Sync + build**: `i18n:packs:sync` (BD) + seed extres + `next build` + diff JSON-LD landings.
5. Validar a cada pas (`i18n:packs:guard`, `qa:i18n-keys-sync`, `validate:core`, build).
Decisió oberta menor: ¿es manté un segon ancoratge visible «Completa des de 550€» a la landing o
només «des de 250€»? (No bloqueja; es pot decidir en executar.)
- **Directiva SEO (propietari 2026-06-10): NO perdre posicionament. Fer el que calgui per
  conservar la pistonada de les landings i, si es pot, AUGMENTAR.** O sigui: el canvi de preus
  no pot degradar el contingut/keywords/estructura que ja posiciona; els preus per ciutat
  s'actualitzen sense buidar la pàgina ni trencar títols/meta/schema. Si una landing es pot
  enriquir (més contingut útil, FAQ, preus clars) per pujar, millor.

⚠️ IMPACTE GROS (per això NO s'ha tocat): els packs viuen a `app/config/packs-config.ts`
i es consumeixen a ~60 fitxers, incloent:
- Web pública: `/configurador`, `/packs`, `/servicios/*` i **~30 landings SEO**
  (dj-bodas-girona, discomovil-maresme, etc.) que mostren packs i preus per ciutat.
- i18n: 9 claus de nom/preu de packs als 3 `messages/*.json`.
- BD: taula `Pack` sincronitzada des del config (`getAllPacks` / packAdminService sync).
- Admin: configurador del bolo, dossiers, pressupostos, catàleg PDF.

QUAN ES DECIDEIXI: cridar Opus per al pla de migració segura del catàleg (web+SEO+BD+i18n)
sense trencar el posicionament de les landings. NO fer-ho a la cua d'una sessió ni a trossos.
Estat actual: preus divergents (bodes 350/500/1000 · discomòbil i empreses 250/400/600).
