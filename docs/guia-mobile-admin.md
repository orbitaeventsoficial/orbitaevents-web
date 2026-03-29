# Guia Completa — Interfície Mòbil Admin Òrbita Events

> Auditoria exhaustiva + pla d'implementació per convertir l'admin mòbil en una experiència de referència.
> Data: 2026-03-29

---

## Índex

1. [Estat actual](#1-estat-actual)
2. [Arquitectura mòbil](#2-arquitectura-mòbil)
3. [Problemes detectats](#3-problemes-detectats)
4. [Pla d'implementació](#4-pla-dimplementació)
5. [Especificacions per fix](#5-especificacions-per-fix)
6. [Fitxers afectats](#6-fitxers-afectats)
7. [Criteris d'acceptació](#7-criteris-dacceptació)

---

## 1. Estat actual

### Què funciona bé (NO tocar)

| Element | Implementació | Fitxer |
|---------|---------------|--------|
| Bottom nav | 4 accions + "Més" per obrir drawer | `layout.tsx:722-744` |
| FAB (Floating Action Button) | + amb 4 accions ràpides, `active:scale-95` | `layout.tsx:31-86` |
| Sidebar drawer mòbil | Slide des de l'esquerra amb backdrop | `layout.tsx:550-654` |
| PWA | manifest, SW, standalone, offline fallback | `manifest.json`, `sw.js` |
| Dual view | Cards mòbil + taula desktop a totes les llistes | 9 pàgines principals |
| Tipografia fluida | `clamp()` per títols, KPIs, headings | `globals.css` |
| Safe area | `env(safe-area-inset-bottom)` al bottom nav | `globals.css:1937` |
| Tema fosc | Tokens CSS complets, `color-scheme: dark` | `admin-theme.css` |
| Reduced motion | Respectat per animacions | `admin-theme.css:332-342` |
| Cerca modal | `Ctrl+K`, responsive, recent items | `AdminSearchModal.tsx` |
| Prefetch intel·ligent | Rutes crítiques via `requestIdleCallback` | `layout.tsx:288-302` |
| KPI grid responsive | 2→3→4→6 columnes per breakpoint | `globals.css:2532-2554` |
| Economia tabs | `mobileLabel` abreujat a mòbil | `economia-types.ts:209-215` |

### Pàgines amb dual view (cards mòbil + taula desktop)

Totes les llistes principals ja tenen les dues vistes:

1. `bookings/page.tsx` — reserves (cards + taula 9 cols)
2. `clientes/page.tsx` — clients CRM
3. `leads/page.tsx` — entrades comercials
4. `blog/page.tsx` — blog posts
5. `activity/ActivityClient.tsx` — registre d'activitat
6. `inventory/InventoryListClient.tsx` — inventari
7. `discount-codes/page.tsx` — codis descompte
8. `presupuestos/ProposalsList.tsx` — pressupostos
9. `privacy/page.tsx` — privacitat RGPD

---

## 2. Arquitectura mòbil

### Layout

```
┌──────────────────────────────┐
│  MOBILE HEADER (56px fix)    │  ← Logo + nom pàgina + cerca + notif
│  ┌─ hamburger ─ títol ─ 🔍 🔔 │
├──────────────────────────────┤
│                              │
│  CONTINGUT PRINCIPAL         │  ← padding: 0.625rem (10px)
│  (scroll vertical)           │     max-width: 1700px
│                              │
│  Cards a mòbil               │
│  Taules a desktop            │
│                              │
├──────────────────────────────┤
│  BOTTOM NAV (64px fix)       │  ← 4 nav + "Més"
│  📊 📥 📋 📅 ☰              │     safe-area-inset-bottom
└──────────────────────────────┘
                         [FAB +] ← bottom-right, sobre bottom nav
```

### Breakpoints

| Token | Valor | Funció |
|-------|-------|--------|
| `xs` | 375px | Mòbils petits (custom) |
| `sm` | 640px | Tablet vertical |
| `md` | 768px | Tablet horitzontal |
| `lg` | 1024px | **Canvi crític**: sidebar desktop, amaga mobile header/bottom nav |
| `xl` | 1280px | Desktop ample |
| `2xl` | 1536px | Ultra-wide |

### Variables CSS mòbil

```css
--at-mobile-header-h: 56px;
--at-bottom-nav-h: 64px;
--at-sidebar-w: 14rem;        /* Sidebar desktop */
--at-transition: 150ms ease;
--at-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 3. Problemes detectats

### 🔴 CRÍTICS (afecten usabilitat directament)

#### 3.1 Touch targets kanban massa petits

**Fitxer**: `bookings/BookingPipelineView.tsx:274-284`

```tsx
// ACTUAL — text-[10px] amb py-1 = ~26px d'alçada. Massa petit.
<button className="ap-btn ap-btn--secondary flex-1 px-2 py-1 text-[10px]">
  {target.label}
</button>
```

**Problema**: Els botons de "Moure a [fase]" al kanban mòbil tenen 10px de text i padding mínim. Un dit adult necessita mínim 44×44px de target. Aquests botons fan ~26px d'alçada.

**Impacte**: L'usuari no pot moure reserves entre fases al mòbil sense errors de tap.

---

#### 3.2 Subtítol del header truncat a 140px

**Fitxer**: `globals.css:1677-1686`

```css
html.admin-mode .admin-mobile-subtitle {
  max-width: 140px;          /* ← Talla noms llargs */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
}
```

**Problema**: El nom de la pàgina actual (breadcrumb mòbil) es talla. "Configuració de notificacions" → "Configuració de no...". L'usuari no sap on és.

**Impacte**: Pèrdua d'orientació, especialment en pàgines de detall.

---

#### 3.3 Formularis llargs sense estructura mòbil

**Fitxer**: `bookings/NewBookingForm.tsx` (~600 línies de JSX)

**Problema**: El formulari de nova reserva és un scroll infinit vertical amb tots els camps visibles alhora:
- Dades client (nom, email, telèfon)
- Tipus d'event (grid de botons)
- Data, hora, lloc
- Pack, extres, preu
- Descomptes, notes

No hi ha cap divisió visual (tabs, accordion, stepper). L'usuari perd context de on és dins el formulari.

**Impacte**: Sensació d'eina complexa. Abandó potencial del formulari.

---

### 🟡 IMPORTANTS (afecten l'experiència)

#### 3.4 Kanban vertical a mòbil (scroll molt llarg)

**Fitxer**: `bookings/BookingPipelineView.tsx:162`

```tsx
grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4
```

**Problema**: A mòbil les 4 columnes del kanban (Pendent, Confirmat, Completat, Cancel·lat) s'apilen verticalment. Si hi ha 5 cards per fase = 20 cards en vertical. L'usuari ha de fer scroll molt llarg per veure totes les fases.

**Millora**: Kanban horitzontal amb snap scroll entre fases + indicador de fase actual (dots o stepper).

---

#### 3.5 Modals centrats en lloc de bottom sheet

**Fitxer**: `components/ConfirmDialog.tsx:174`

```tsx
<div className="...max-w-sm...p-6...">
```

**Problema**: Els diàlegs de confirmació apareixen centrats a la pantalla. En mòbils grans (6.5"+), els botons d'acció queden lluny del polze. El patró modern mòbil és el bottom sheet.

**Millora**: A mòbil (<640px), el modal hauria de slide-up des de baix, ample 100%, amb padding safe-area.

---

#### 3.6 Sidebar mòbil massa ampla en pantalles estretes

**Fitxer**: `globals.css` (CSS de `.admin-mobile-sidebar`)

```css
.admin-mobile-sidebar { width: 17rem; } /* 272px fix */
```

**Problema**: En un mòbil de 320px (iPhone SE), queden 48px de contingut visible darrera. L'usuari no percep que pot tancar tocant fora.

**Millora**: `width: min(17rem, 85vw)` — mai més del 85% de l'amplada.

---

#### 3.7 Zero gestos tàctils

**Problema**: L'admin no implementa cap gest tàctil natiu:
- No swipe per tancar sidebar
- No swipe horitzontal al kanban
- No pull-to-refresh a llistes
- No long-press per accions ràpides

**Millora**: Mínim implementar swipe per tancar sidebar (esperatat per l'usuari).

---

#### 3.8 FAB pot tapar contingut important

**Fitxer**: `layout.tsx:58`

```tsx
className="fixed bottom-24 right-4 z-[90]..."
```

**Problema**: El FAB (+) queda fix a `bottom-24` (96px). En pàgines amb cards que arriben fins a baix, el FAB tapa el botó d'acció de l'última card. No es pot tancar ni amagar.

**Millora**: Amagar FAB on scroll down, mostrar on scroll up (patró Material Design).

---

### 🟢 MENORS (polish)

#### 3.9 Padding contenidor massa ajustat

```css
.admin-shell.admin-main-shell { padding: 0.625rem; } /* 10px */
```

En pantalles de 375px, el contingut útil és 355px. Amb `p-4` dins les cards, queden 323px de text. Funciona però se sent estret.

**Millora**: Pujar a `0.75rem` (12px) a mòbil. Diferència subtil però respira millor.

---

#### 3.10 Bottom nav sense feedback tàctil

```css
.admin-bottom-nav-item { /* no active: state */ }
```

No hi ha cap canvi visual quan l'usuari prem un ítem del bottom nav (ni scale, ni background flash). L'app se sent "morta" al toc.

**Millora**: Afegir `active:scale-95` + `active:bg-white/5` als items del bottom nav.

---

#### 3.11 Header mòbil no col·lapsa on scroll

El header mòbil (56px) i el bottom nav (64px) ocupen 120px fixos. En una pantalla de 667px (iPhone SE), l'espai útil és 547px. 18% de pantalla perdut sempre.

**Millora**: Amagar header on scroll down, mostrar on scroll up. El bottom nav es manté fix sempre (és la nav principal).

---

#### 3.12 Charts sense interacció tàctil

Les gràfiques (economia, analytics) depenen de hover per mostrar valors. A mòbil no hi ha hover.

**Millora**: Implementar tap-to-reveal per mostrar el valor d'una barra/punt concret.

---

## 4. Pla d'implementació

### Fase 1 — Fixes ràpids (impacte immediat, ~1h)

| # | Tasca | Fitxer | Canvi |
|---|-------|--------|-------|
| F1 | Touch targets kanban | `BookingPipelineView.tsx:280` | `py-1 text-[10px]` → `py-2 text-xs min-h-[44px]` |
| F2 | Subtítol header ampliat | `globals.css:1678` | `max-width: 140px` → `max-width: min(50vw, 200px)` |
| F3 | Sidebar width segura | `globals.css` | `width: 17rem` → `width: min(17rem, 85vw)` |
| F4 | Bottom nav active state | `globals.css` | Afegir regla `active:scale-95` + `active:bg-white/5` |
| F5 | Padding contenidor | `globals.css:1924` | `padding: 0.625rem` → `padding: 0.75rem` |

### Fase 2 — UX mòbil millorada (~3-4h)

| # | Tasca | Fitxer | Canvi |
|---|-------|--------|-------|
| M1 | Kanban horitzontal mòbil | `BookingPipelineView.tsx` | `grid-cols-1` → horizontal snap scroll amb dots indicadors |
| M2 | Bottom sheet per ConfirmDialog | `ConfirmDialog.tsx` | A mòbil (<640px): slide-up des de baix, 100% width |
| M3 | Swipe per tancar sidebar | `layout.tsx` | Touch event listener amb threshold 50px |
| M4 | FAB auto-hide on scroll | `layout.tsx` | `useScrollDirection()` hook, amagar on scroll down |

### Fase 3 — Formularis per passos (~2-3h)

| # | Tasca | Fitxer | Canvi |
|---|-------|--------|-------|
| P1 | NewBookingForm per passos | `NewBookingForm.tsx` | Dividir en 4 passos: Client → Event → Pack/Extres → Resum |
| P2 | Stepper visual | `NewBookingForm.tsx` | Barra de progrés amb passos numerats |
| P3 | Navegació entre passos | `NewBookingForm.tsx` | Botons "Següent" / "Anterior" amb validació per pas |

### Fase 4 — Polish premium (~2h)

| # | Tasca | Fitxer | Canvi |
|---|-------|--------|-------|
| X1 | Header collapsable | `layout.tsx` + CSS | Amagar on scroll down, mostrar on scroll up |
| X2 | Pull-to-refresh | Llistes principals | Custom hook `usePullToRefresh()` |
| X3 | Charts tap-to-reveal | `EconomiaClient.tsx` | `onClick` en barres per mostrar valor |
| X4 | Haptic feedback | Accions crítiques | `navigator.vibrate(10)` en confirmar/eliminar |

---

## 5. Especificacions per fix

### F1 — Touch targets kanban

**Abans:**
```tsx
<button className="ap-btn ap-btn--secondary flex-1 px-2 py-1 text-[10px] disabled:opacity-50">
  {target.label}
</button>
```

**Després:**
```tsx
<button className="ap-btn ap-btn--secondary flex-1 px-2.5 py-2 text-xs min-h-[44px] disabled:opacity-50">
  {target.label}
</button>
```

---

### F2 — Subtítol header

**Abans:**
```css
html.admin-mode .admin-mobile-subtitle {
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Després:**
```css
html.admin-mode .admin-mobile-subtitle {
  max-width: min(50vw, 200px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

### F3 — Sidebar width

**Abans:**
```css
.admin-mobile-sidebar { width: 17rem; }
```

**Després:**
```css
.admin-mobile-sidebar { width: min(17rem, 85vw); }
```

---

### F4 — Bottom nav active state

**Afegir nova regla:**
```css
html.admin-mode .admin-bottom-nav-item:active {
  transform: scale(0.93);
  background: rgba(255, 255, 255, 0.05);
}
```

---

### F5 — Padding contenidor

**Abans:**
```css
.admin-shell.admin-main-shell { padding: 0.625rem; }
```

**Després:**
```css
.admin-shell.admin-main-shell { padding: 0.75rem; }
```

---

### M1 — Kanban horitzontal mòbil

**Concepte:**
```
┌─────────────────────────────────┐
│  ● ○ ○ ○  (dots = fase activa) │
├─────────────────────────────────┤
│  ←  PENDENT (3 cards)       →  │  ← snap scroll horitzontal
│  [card 1]                       │
│  [card 2]                       │
│  [card 3]                       │
└─────────────────────────────────┘
         swipe → CONFIRMAT
```

**Implementació:**
```tsx
// Contenidor de fases amb snap scroll
<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible">
  {COLUMNS_DEF.map((col) => (
    <div key={col.status} className="min-w-[85vw] snap-center md:min-w-0">
      {/* Contingut de la fase */}
    </div>
  ))}
</div>

// Indicador de fase (dots)
<div className="flex justify-center gap-2 md:hidden">
  {COLUMNS_DEF.map((col, i) => (
    <span key={col.status} className={`h-2 w-2 rounded-full ${activePhase === i ? 'bg-amber-400' : 'bg-white/20'}`} />
  ))}
</div>
```

---

### M2 — Bottom sheet per ConfirmDialog

**Concepte:**
```
Desktop (>640px):        Mòbil (<640px):
┌────────────┐          ┌─────────────────┐
│  ┌──────┐  │          │                 │
│  │Dialog│  │          │                 │
│  └──────┘  │          │                 │
└────────────┘          ├─────────────────┤
                        │  ═══ handle ═══ │  ← grip visual
                        │  Segur que...?  │
                        │                 │
                        │  [Cancel] [OK]  │
                        │     safe-area   │
                        └─────────────────┘
```

**Implementació CSS:**
```css
/* Mòbil: bottom sheet */
@media (max-width: 639px) {
  .admin-confirm-dialog {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-width: 100%;
    border-radius: 1rem 1rem 0 0;
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
    animation: slide-up 0.25s var(--at-ease-out);
  }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

---

### M3 — Swipe per tancar sidebar

**Implementació:**
```tsx
// Al component AdminLayoutShell, dins el sidebar
const touchStartX = useRef(0);

const onTouchStart = useCallback((e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
}, []);

const onTouchEnd = useCallback((e: React.TouchEvent) => {
  const delta = e.changedTouches[0].clientX - touchStartX.current;
  if (delta < -50) setSidebarOpen(false); // swipe left → tancar
}, []);

// Al JSX del sidebar:
<aside onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} ...>
```

---

### M4 — FAB auto-hide on scroll

**Hook:**
```tsx
function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastScrollY.current && y > 100);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}
```

**Ús:**
```tsx
const fabHidden = useScrollDirection();
// ...
<div className={`... transition-all duration-300 ${fabHidden ? 'translate-y-24 opacity-0 pointer-events-none' : ''}`}>
```

---

### P1 — NewBookingForm per passos

**Estructura proposada:**

```
Pas 1: CLIENT         Pas 2: EVENT          Pas 3: PACK           Pas 4: RESUM
┌──────────────┐     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ ● ─ ○ ─ ○ ─ ○│     │ ○ ─ ● ─ ○ ─ ○│      │ ○ ─ ○ ─ ● ─ ○│      │ ○ ─ ○ ─ ○ ─ ●│
│              │     │              │      │              │      │              │
│ Nom          │     │ Tipus event  │      │ Pack         │      │ Resum final  │
│ Email        │     │ Data         │      │ Extres       │      │ Preu total   │
│ Telèfon      │     │ Hora         │      │ Hores extra  │      │ Descompte    │
│ Idioma       │     │ Ubicació     │      │ Notes        │      │ Notes        │
│              │     │ Convidats    │      │              │      │              │
│   [Següent →]│     │[← Ant] [Seg→]│      │[← Ant] [Seg→]│      │[← Ant] [Crear]│
└──────────────┘     └──────────────┘      └──────────────┘      └──────────────┘
```

**Validació per pas:**
- Pas 1: nom obligatori
- Pas 2: data i tipus obligatoris
- Pas 3: pack obligatori
- Pas 4: confirmació

---

## 6. Fitxers afectats

### Fase 1 (fixes ràpids)
```
app/admin/bookings/BookingPipelineView.tsx   ← F1 touch targets
app/globals.css                               ← F2 subtitle, F3 sidebar, F4 bottom nav, F5 padding
```

### Fase 2 (UX millorada)
```
app/admin/bookings/BookingPipelineView.tsx   ← M1 kanban horitzontal
app/admin/components/ConfirmDialog.tsx       ← M2 bottom sheet
app/admin/layout.tsx                         ← M3 swipe sidebar, M4 FAB auto-hide
```

### Fase 3 (formularis)
```
app/admin/bookings/NewBookingForm.tsx        ← P1-P3 formulari per passos
```

### Fase 4 (polish)
```
app/admin/layout.tsx                         ← X1 header collapsable
hooks/usePullToRefresh.ts                    ← X2 pull-to-refresh (NOU)
app/admin/economia/EconomiaClient.tsx        ← X3 charts tap
```

---

## 7. Criteris d'acceptació

### Per donar una fase per tancada:

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx vitest run` → tots els tests passen
- [ ] `pnpm run validate:core` → OK
- [ ] Verificar visualment a 375px (iPhone SE), 390px (iPhone 14), 428px (Pixel 7)
- [ ] Verificar que el canvi no trenca la vista desktop (>1024px)
- [ ] Verificar safe-area amb notch simulat

### Mètriques objectiu:

| Mètrica | Actual | Objectiu |
|---------|--------|----------|
| Touch target mínim | 26px (kanban) | 44px |
| Espai útil vertical | 547px (iPhone SE) | 600px+ (amb header collapsable) |
| Temps orientació (on sóc?) | Truncat | Sempre visible |
| Gestos implementats | 0 | 3 (swipe sidebar, swipe kanban, scroll FAB) |
| Formulari passos | 0 | 4 passos amb stepper |

---

## Veredicte final

**No cal refer de zero.** L'arquitectura base (bottom nav, dual view, PWA, tokens CSS, responsive grids) és sòlida i madura. El que falta és una capa de polish mòbil que es pot aplicar incrementalment:

1. **Fase 1** (30 min): Fixes ràpids CSS — impacte immediat, risc zero
2. **Fase 2** (3-4h): Kanban horitzontal + bottom sheet + gestos — el salt de qualitat
3. **Fase 3** (2-3h): Formulari per passos — elimina la sensació de complexitat
4. **Fase 4** (2h): Header collapsable + pull-to-refresh — l'últim 10% que fa la diferència

El resultat serà un admin que no simplement "funciona a mòbil" sinó que **està pensat per mòbil**, mantenint la mateixa profunditat funcional que el desktop.

## 2026-03-29 — Estat després de la reforma mòbil pública

### Què s'ha tocat
- Sistema públic: `LayoutWrapper`, `MobileBottomNav`, `MobileAppShell`, `MobileHeroUltimate`, `MobileHomePage`, `MobileServicesCards`.
- Pàgines públiques: `servicios`, `packs`, `contacto` i `configurador`.

### Criteris aplicats
- **Monocapa**: menys UI persistent simultània i menys competència entre nav, CTA i hero.
- **Responsive real**: menys alçada malgastada al first fold i més prioritat a contingut útil en viewport mòbil.
- **Zero hardcoded**: rutes i copy sensible del hero resolts via locale/traduccions, no literals locals.

### Validació
- `npx tsc --noEmit` OK
- `pnpm run validate:core` OK
- `pnpm vitest run` OK (`142` fitxers, `1795` tests)

### Estat honest
- El tall públic queda estable i sense regressions detectades.
- L'admin mòbil encara és un front separat; especialment `app/admin/bookings/BookingPipelineView.tsx` no s'ha acabat de refondre en aquesta passada.
