# Studio Lab · Òrbita Command — handoff

> **Per continuar sense re-explicar res.** Obre això i sabràs on som i què toca.
> Superfície: `http://localhost:3000/studio-lab` (intern, `noindex`, sense auth).

## Què és

`/studio-lab` és el **laboratori del nou admin**: el concepte **Òrbita Command**.
Premissa: *el sistema no organitza pantalles, organitza decisions*. No és un CRM amb
menús; és un lloc de comandament per a una empresa d'esdeveniments, amb els bolos i les
decisions al centre.

Distinció de les tres superfícies:
- `/admin` → l'admin **real** de producció (el que es vol substituir).
- `/studio` → la **fitxa tècnica** del sistema visual (tokens, components, PDFs). Zona protegida.
- `/studio-lab` → el **laboratori** on es dissenya el nou admin (aquesta pàgina).

## Estat actual (Canvi #758)

- **Pipeline de 5 estats** amb drag & drop HTML5: `nou · contactat · pressupost enviat · guanyat · perdut`.
  Arrossegar un bolo el mou d'estat. Cada columna té color sòlid, count i suma €.
- **Tot clickable**: cards, KPIs, capes (Temps/Diners/Persones/Operació), senyals, comandaments.
- **Decisió ara**: panell connectat al lead seleccionat; cada estat proposa la següent acció.
- **KPIs vius** (pipeline = suma dinàmica), rellotge en viu.
- Dades de **mostra** (no connectat encara a leads reals).

## Fitxers

| Fitxer | Rol |
|---|---|
| `app/studio-lab/page.tsx` | Client component. Dades: `STAGES`, `INITIAL_LEADS`, `LAYERS`, `SIGNALS`, `NEXT_ACTION`, `ACTIONS_BY_STAGE`. Estat React + drag&drop. |
| `app/studio-lab/studio-lab.css` | Tokens scoped a `.sl-root` + colors d'estat sòlids + estats interactius + responsive. |
| `app/studio-lab/layout.tsx` | `robots: noindex`. |
| `.dbg-studio-lab.cjs` | Captura Playwright → `.codex-captures/studio-lab.png`. |

## Roadmap (per ordre)

1. **Persistir** l'ordre/estat del pipeline (ara es reseteja en recarregar).
2. **Connectar a leads reals** (avui `INITIAL_LEADS` són mostres) — via servei/endpoint admin.
3. **Capes Diners / Persones / Operació**: ara només "Temps" té sentit visual; donar vista a cada capa.
4. **Motiu de pèrdua** en moure un bolo a "perdut" (coherent amb `leadLoss` del repo).
5. **Comandaments reals**: WhatsApp amb senyal, generar contracte, reservar equip, etc.
6. **Promoure a esquelet del nou admin** quan convenci, i muntar-hi les peces de `/studio`.

## Validació / captura

```bash
npx tsc --noEmit
node scripts/check-layer-catalogs.mjs     # studio-lab exempt
# dev net (si surt "Cannot read properties of undefined (reading 'call')" → rm -rf .next i torna a arrencar)
npx next dev
node .dbg-studio-lab.cjs                   # captura
```

## Regles de la casa

- Tot canvi (prova o definitiu) → **git** + diari amb número de canvi (`ADMIN_CHANGE_COUNTER`).
- No tocar `/studio` (zona protegida) ni l'admin consolidat des d'aquí.
- Català sempre. Colors via tokens `--sl-*` (no hex nou al JSX).
