# Pantalla negra — Redisseny fitxa del lead `/admin/leads/[id]`

> Blueprint dissenyat per Opus (2026-06-11). Redisseny SENCER des de zero.
> Condicions propietari: responsiu · monocapa · 0 hardcoded · es pot ampliar CSS ·
> fonts/colors nous són un RECURS (s'usen on convingui, no obligatori a tot arreu).

## Direcció tipogràfica
- **Bricolage Grotesque** = títols/display (nom, xifres protagonistes, títols de banda).
- **Inter** = cos/UI/valors/botons.
- **IBM Plex Mono** = NOMÉS dades (imports, dates, hores, €/h, refs, eyebrows). Tabular.
- **Menys majúscules**: uppercase només a eyebrows micro + estats. Jerarquia per mida+pes+color.

## Layout nou — 4 bandes
- **BAND 0 · Command bar** (sticky): ← Temporada · breadcrumb · estat · [+Pressupost][+Dossier].
- **BAND 1 · Identitat** (fusió hero+stats): nom (Bricolage 32px) + meta + statchips (Valor/Durada/Prioritat) | dreta: **NET DEL BOLO** protagonista + fase + CTA.
- **BAND 2 · Treball** (grid `minmax(0,340px) 1fr`): esquerra = aside d'acordions (Dades, Contacte, Rendibilitat/docs, Cobraments) · dreta = **EL BOLO** protagonista (configurador + Economia del bolo).
- **BAND 3 · Anàlisi econòmica** (full width): Import · Marge · €/h · a tarifa · col·laborador (rep el Total/€h/cost mogut de Rendibilitat).

Responsive: tablet → 1 col, bolo PRIMER · mòbil → apilat, statchips scroll, acordions tancats, catàleg `max-height:none`.

## Tokens a ampliar (orbita-tokens.css, font de veritat)
- `app/fonts.ts`: carregar `Bricolage_Grotesque` (`--font-bricolage`) + `IBM_Plex_Mono` (`--font-plex-mono`).
- Injectar variables al `<body>` (layout).
- `--o-font-mono` → Plex real (avui apunta a Inter). `--o-font-heading` nou → Bricolage.
- `leads-design.css`: aliases `--display`/`--mono` consumeixen els tokens (avui `--mono` hardcodat a Inter).
- Escala `--o-text-*` revisada (jerarquia: encongir mitjos, eixamplar extrems). Restaurar `--o-text-micro` alias.

## Classes
- MOREN: tot el sistema `.ap-detail-*` (bar/hero/stats) + `.fxd__work` grid 480px.
- ES REFAN: `.fxd__panelhead span`, `.fxd__rows dt` (treure uppercase), `.fxd__kpi-lbl`, `.fxd__econohead`.
- ES CREEN: `.fxd__cmd`, `.fxd__id`/`.fxd__id-net`, `.fxd__statchips`/`.fxd__statchip`, `.fxd__netbox`, `.fxd__band2`/`.fxd__aside`/`.fxd__main`, `.fxd__acc`, `.fxd__bolo`.

## Ordre d'implementació (passa petita + captura a cada pas)
1. **Fonts + tokens** (sense canvi de layout). Captura: imports en Plex, títols en Bricolage.
2. BAND 0 command bar.
3. BAND 1 identitat (fusió hero+stats, sense net encara).
4. BAND 1 netbox + fase (elevar càlcul d'economia a LeadDetailClient).
5. BAND 2 estructura (aside 340 / bolo 1fr).
6. Aside → acordions (fusionar cobraments; treure Total/€h/cost de Rendibilitat).
7. Despullar majúscules.
8. BAND 3 anàlisi (rep Total/€h/cost).
9. Responsive (3 amplades).
10. Polish tokens (0 hardcoded; eliminar `.ap-detail-*` mortes, verificar amb grep que no s'usen fora).

## Fitxers clau
- `app/admin/leads/[id]/LeadDetailClient.tsx` (markup bandes)
- `app/admin/leads/leads-design.css` (CSS `.fxd__*`)
- `app/admin/leads/[id]/LeadBoloSection.tsx` (elevar economia perquè el net pugi al hero)
- `app/fonts.ts` (Bricolage + Plex Mono)
- `app/studio/orbita-tokens.css` (tokens de família + escala)
