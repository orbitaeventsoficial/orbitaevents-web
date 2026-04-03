# TANCAT — Executat 2026-03-31

# Guia de Construcció — Configurador Upgrade "Premium-Minimal"

## Context

El configurador (`app/[locale]/configurador/client.tsx`) és un wizard de 4 passos que genera pressupostos. Funciona bé però visualment és pla comparat amb la resta del projecte.

**Objectiu**: Fer-lo espectacular dins l'estètica **premium-minimal** del projecte (NO temàtic, NO partícules, NO atmosfèric com Mon Magic o Halloween).

**Referència visual**: Les pàgines no temàtiques (servicios, packs, home, portfolio) usen:
- Fons fosc sòlid + subtle radial glows (opacitat 0.03-0.08)
- Cards amb `border-white/10`, gradient `from-white/[0.05]`, hover elevation
- Accent únic: ambre/or (`amber-400/500`, `orange-400/500`)
- Animacions d'entrada staggered (opacity + y) via framer-motion
- Hover: translate-y, scale, border brightening, shadow glow
- ZERO partícules, ZERO efectes atmosfèrics
- CTA primari: `bg-gradient-to-r from-amber-500 to-orange-500`

## Estat actual (canvis ja fets per Claude Code)

### Infraestructura
1. ✅ `AnimatePresence` per transicions entre passos (fade + slide + blur 4px)
2. ✅ Ambient background amb 3 orbs animats (motion.div + blur 100-150px) que canvien de color per event type
3. ✅ Content container amb `z-10` per estar sobre els orbs
4. ✅ Sticky price bar: border `oe-gold/20` + shadow glow ambre

### Step 1 — Tipus d'event
5. ✅ Title gradient text (`from-white via-amber-100 to-oe-gold`)
6. ✅ Cards hover: glow 48px, scale 1.05, translate-y -1, shine sweep overlay

### Step 2 — Selecció de pack
7. ✅ Title gradient text
8. ✅ Staggered entry amb framer-motion (delay 0.12s per card)
9. ✅ Cards hover: translate-y -2, shadow 48px, shine sweep overlay
10. ✅ Badge popular pulsant (`animate-[pulse_3s]`)
11. ✅ Botó amb glow hover

### Step 3 — Detalls i extres
12. ✅ Title gradient text
13. ✅ Cards data/guests: hover border + shadow
14. ✅ Preu total: text-5xl + drop-shadow ambre
15. ✅ Botó Continuar: glow 32px hover

### Step 4 — Conversió
16. ✅ Title gradient text
17. ✅ Preu final: text-6xl + drop-shadow 24px
18. ✅ Garantia card: hover green glow
19. ✅ Botó submit: shine sweep animat + glow hover
20. ✅ Success card: spring animation (scale + y) + green shadow
21. ✅ Social proof: background + border subtil

### ProgressStepsNav
22. ✅ Ring-2 + shadow 20px al step actual
23. ✅ Connecting lines amb shadow glow quan completades (duration-700)

## Què falta — Tasques per Codex

### PRIORITAT 1: Responsive polish (OBLIGATORI)

**Què verificar/millorar**:
- Step 1 cards a 375px: verificar que les 4 cards no queden massa comprimides (grid 1 col a mòbil)
- Step 2 packs a mòbil: 1 columna, pack popular al centre amb badge visible
- Sticky bar a mòbil: verificar que el preu i botó no es tallen
- Step 4 form a mòbil: inputs amb `min-h-[48px]` per touch targets
- Títols gradient text: verificar llegibilitat a mòbil (poden necessitar `leading-tight`)

### PRIORITAT 6: Micro-interaccions addicionals

**Idees opcionals** (si queda temps):
- Cursor glow al Step 1 (com el Hero usa `CursorGlow` — seguiment del cursor amb radial gradient subtil, only desktop)
- Número de convidats amb slider visual en lloc de input number pur
- Animació de "confetti subtil" (3-4 sparkles daurats) quan s'aplica un codi de descompte amb èxit
- Animació de counting-up al preu total quan canvia (com `AnimatedCounter` del Hero)
- Tooltip hover a les features dels packs (expandir descripció)

## Regles a seguir (CRÍTIQUES)

1. **ZERO hex hardcoded** — Usar tokens Tailwind: `bg-bg-main`, `text-oe-gold`, `border-border`, etc.
2. **ZERO partícules flotants** — L'estètica del projecte és premium-minimal, NO atmosfèrica
3. **MONOCAPA** — Cada efecte a un sol lloc. No duplicar entre inline i CSS class
4. **Respectar `prefers-reduced-motion`** — Tota animació framer-motion ja ho fa per defecte. Per CSS: usar `@media (prefers-reduced-motion: reduce)`
5. **NO tocar la lògica de negoci** — Preus, descomptes, formulari, validació, PDF, analytics = intocable
6. **NO tocar els textos** — Tot ve de `t('key')` via next-intl. No canviar keys ni contingut
7. **NO canviar l'ordre dels passos** — El flow 1→2→3→4 és tancat
8. **Traduccions** — Si afegeixes text nou visible (improbable), cal als 3 JSONs (ca/es/en)
9. **TypeScript strict** — 0 errors nous a `npx tsc --noEmit`
10. **Verificació visual** — Fer captures Playwright desktop + mòbil després de cada bloc de canvis

## Comandes de validació

```bash
# Validació base
pnpm run validate:core

# TypeScript
npx tsc --noEmit

# Build complet (recomanat al final)
pnpm build

# Captures (si configurat)
npx playwright test e2e/configurador.spec.ts --project=chromium
```

## Fitxers involucrats

| Fitxer | Què conté |
|--------|-----------|
| `app/[locale]/configurador/client.tsx` | Component principal — TOT el visual es toca aquí |
| `app/[locale]/configurador/configurador-utils.ts` | Lògica pura — NO TOCAR |
| `app/[locale]/configurador/page.tsx` | Server wrapper + metadata — NO TOCAR |
| `app/globals.css` | Keyframes compartits (`shimmer`, etc.) — consultar, no crear-ne de nous si ja existeixen |
| `config/packs-config.ts` | Definició de packs/extras/offers — NO TOCAR |

## Referència de components existents (inspiració)

| Component | On | Tècniques rellevants |
|-----------|-----|---------------------|
| `HeroElegant.tsx` | Hero home | Cursor glow, staggered words, parallax, animated counter, shine sweep CTAs |
| `ServicesGridElegant.tsx` | Home | Card hover amb glow, radial gradient per pilar, animated shine |
| `CTAFinal.tsx` | Home | Pulsing glow badge, WhatsApp CTA amb dot animat, shine sweep botó |
| `PacksClient.tsx` | /packs | Tabs, pack cards amb badge popular, specs row, feature checkmarks |
| `GarantiaSection.tsx` | Home | Cards amb gradient per tipus, icon hover rotation, trust seal |

## Diagrama visual del resultat esperat

```
┌─────────────────────────────────────────────┐
│  [1]──────[2]──────[3]──────[4]             │  ← Progress nav amb glow al pas actual
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │   ✨ Gradient title text ✨          │    │
│  │                                      │    │
│  │  ┌─────────┐ ┌─────────┐            │    │  ← Cards amb shine sweep hover
│  │  │  💒     │ │  🎉     │            │    │    + glow dramàtic
│  │  │ Bodas   │ │ Fiestas │            │    │    + translate-y lift
│  │  │ 350€    │ │ 250€    │            │    │
│  │  └─────────┘ └─────────┘            │    │
│  │  ┌─────────┐ ┌─────────┐            │    │
│  │  │  🎵     │ │  💼     │            │    │
│  │  │ Disco   │ │ Empresa │            │    │
│  │  │ 250€    │ │ 250€    │            │    │
│  │  └─────────┘ └─────────┘            │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Ambient orbs (blur 150px, animats)
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Pack Premium │ 450€  │ Continuar →   │    │  ← Sticky bar amb glow ambre
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Ordre d'execució recomanat

1. Step 2 pack cards (més visual impact per token gastat)
2. Step 3 summary + extras
3. ProgressStepsNav
4. Step 4 conversió
5. Responsive polish
6. Micro-interaccions (si queda temps)

Cada bloc: fer canvis → `npx tsc --noEmit` → captura visual → next bloc.
