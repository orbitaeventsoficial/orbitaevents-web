# Auditoria de DISSENY de l'admin (centímetre a centímetre) — 2026-06-27

> Encàrrec del propietari: NO és «funciona o no» (això ja se sap). És auditar,
> millorar i replantejar si cal el DISSENY de tot l'admin + PDFs + textos:
> CSS, forma, responsiu, format, colors, aspecte, tipografia, normes de mida,
> lògica i millores. Centímetre a centímetre.

## Barem (7 eixos «Sèrie Òrbita Events» + disseny fi)
Visual · Coherència · Canònic · Monocapa · Responsiu · Corporatiu · Tècnic
+ per a aquesta auditoria: **tipografia** (escala, pes, font canònica), **espaiat**
(ritme vertical), **color** (tokens, contrast), **jerarquia**, **densitat**,
**alineació**, **copy/textos**.

## Mètode
Peça a peça. Per cada una: captura (3 breakpoints quan toqui) + lectura del CSS/codi
+ veredicte per eix + proposta de millora concreta. PDFs: generar i llegir el PDF real.

---

## PDFs

### Dossier (`/api/admin/studio/preview/dossier`) — auditat 2026-06-27
**Veredicte: BO de base, 3 punts a replantejar.**
- ✅ Portada carbó + marc daurat, logo centrat, jerarquia «PER A → nom → sub». Molt de marca.
- ✅ Cos net, eyebrows mono daurat + títols bold + nota amb barra lateral. Jerarquia consistent.
- 🔴 **Trencament de fons**: portada FOSCA → cos CLAR (crema). Xoca; un sol univers cromàtic seria més coherent (o transició intencionada). REPLANTEJAR.
- ⚠️ **Placeholders `XXXXXX`** al preview — verificar que amb dades reals s'omplen i que mai arriba un `XXXXXX` a client.
- ⚠️ **`des de 195 €`**: el preu (info clau per al client) hauria de tenir més pes visual.
- ⚠️ **`1h`** (capçalera de servei) queda orfe respecte l'eyebrow — alinear/agrupar.

### Catàleg / Contracte / Factura / Informe — PENDENTS d'auditar visualment

---

## Pantalles admin (per òrgan) — PENDENTS d'auditoria de disseny fi
(la passada anterior va verificar que FUNCIONEN; ara cal el disseny centímetre a centímetre)

## Troballes de codi (tipografia / normes de mida / canònic)
- **44 `<h2>` amb Tailwind cru** (`text-sm/base/xl font-*`) en comptes de `.ap-h2` — barreja de títols de secció (haurien de ser canònics) amb títols de widget compactes (potser intencionals). Revisió cas a cas pendent.
- (acumular més aquí)
