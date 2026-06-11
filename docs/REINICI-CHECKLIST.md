# Checklist de reinici — on ho deixem (2026-06-10)

> Pots reiniciar el PC tranquil. **Tot està escrit a disc.** Un reinici NO perd res
> del codi ni dels docs (l'arbre de git es conserva). L'únic que es para és el
> `next dev`. Aquest fitxer és per reprendre net.

## Estat exacte en parar

- Branca: `main` · últim commit: `b1d845a3`
- **Canvi #917 fet i validat** (counter, protocol, diari, agent-sync actualitzats).
- Canvis a disc SENSE committar (segurs després del reinici):
  - `app/admin/bookings/BookingServiceLinesSection.tsx` — importa el seu `nb-design.css` + prop `embedded`
  - `app/admin/leads/[id]/LeadBoloSection.tsx` — passa `embedded`
  - `lib/constants/admin.ts` — counter → 917
  - `docs/admin-protocol.md` · `docs/admin-diary.md` · `docs/agent-sync.md` — registre #917
  - `.dbg-bolo.cjs` — script de captura del bolo (no committat)
- Validació passada: `npx tsc --noEmit` ✅ · `pnpm run validate:core` ✅ · `qa:protocol` ✅
- `pnpm build` AJORNAT (dev viu). No és blocador: el canvi és import CSS + render condicional.

## Què s'ha resolt al #917

El configurador del bolo sortia SENSE estil a la fitxa del lead (mur de text
`Basic350€Premium500€…`, títol «El bolo» duplicat). Causa: `nb-design.css` només
l'importava `NewBookingForm`. Ara el component compartit porta el seu CSS i té mode
`embedded`. Captura «després»: `.codex-captures/bolo-focus.png`.

## En reprendre (passos)

1. Arrencar el dev net:
   ```powershell
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   pnpm dev
   ```
2. Obrir el bolo a la fitxa del lead i **netejar cache un cop**
   (DevTools → Vaciar caché y recargar):
   `http://localhost:3000/admin/leads/cmpwudznj00g3vigky4altclu`
3. Recapturar si cal: `node .dbg-bolo.cjs` → `.codex-captures/bolo-focus.png`

## SEGÜENT (decisió teva pendent)

Fase "pantalla negra" = redisseny visual element per element, amb captura + el teu OK
a cada pas. Has de triar:
- **A)** T'agrada la base ja estilada → dius quin element del bolo refem primer
  (catàleg dreta · files de línies · total · capçalera).
- **B)** Vols un llenguatge visual nou de zero → me'l descrius o et proposo 2-3
  direccions amb captura abans de tocar res.

També pendent (no bloca): Fase 4 (fulla d'economia, net per bolo) i unificació de
packs (decisió de negoci aparcada — veure `docs/bolo-flux.md`).

## Si vols que quedi committat abans de reiniciar

No cal (l'arbre es conserva), però si ho prefereixes, demana-m'ho i ho commitejo
en una branca abans que paris.
