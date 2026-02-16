# 📊 Anàlisi Exhaustiva del Codi - Admin Òrbita Events

**Data**: Febrer 2025  
**Focus**: Customer Hub (fitxa client) + Admin General

---

## 🔍 RESUM EXECUTIU

### Punts forts actuals
- ✅ Arquitectura Customer-centric ben definida
- ✅ Prisma schema robust amb relacions coherents
- ✅ Sistema de Timeline unificat
- ✅ Estructura de panells modular

### Àrees de millora crítica
- ❌ Panells massa bàsics (SummaryPanel quasi buit)
- ❌ Sense edició in-line de dades del client
- ❌ Sense loading states als panels
- ❌ Sense error boundaries
- ❌ PresupuestoPdfStudio massa gran (1309 línies)
- ❌ Admin layout com a client component (930 línies)
- ❌ Sense virtualització a llistes llargues
- ❌ Sense debounce a molts inputs

---

## 📁 FITXER PER FITXER

### 1. `app/admin/contactes/[id]/page.tsx`
**Estat**: ✅ Bé però millorable
**Problemes**:
- No hi ha fallback UI mentre carrega
- L'error va a notFound() sense explicació

**Millora proposada**:
```tsx
// Afegir Suspense amb skeleton
export default async function CustomerHubPage({ params }: Props) {
  return (
    <Suspense fallback={<CustomerHubSkeleton />}>
      <CustomerHubLoader id={params.id} />
    </Suspense>
  );
}
```

---

### 2. `app/admin/contactes/[id]/_components/CustomerHubClient.tsx`
**Estat**: ⚠️ Funcional però bàsic
**Problemes**:
- No té refresh automàtic de dades
- useMemo innecessari al panel (és senzill)
- No gestiona errors de xarxa en panells fills

**Millores proposades**:
- Afegir context per compartir refresh entre panells
- Afegir polling opcional per actualitzacions
- Afegir error boundary per cada panell

---

### 3. `app/admin/contactes/[id]/_components/CustomerHeader.tsx`
**Estat**: ✅ Bé
**Problemes menors**:
- Els botons CTA no tenen disabled state mentre hi ha accions en curs
- La lògica de statusTone és massa llarga (ternari niat 4 nivells)
- Falta indicador de "última actualització"

**Millores proposades**:
```tsx
// Extreure lògica de color a funció
const STATUS_TONE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  NEGOTIATION: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  POSTEVENT: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  LOST: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

function getStatusTone(status: string): string {
  return STATUS_TONE[status] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/40';
}
```

---

### 4. `app/admin/contactes/[id]/_components/panels/SummaryPanel.tsx`
**Estat**: ❌ Massa bàsic
**Problemes greus**:
- Només mostra comptadors (4 targetes)
- No mostra informació rellevant del client
- No permet editar res
- No té indicadors visuals d'estat

**Millores crítiques proposades**:
1. Afegir secció d'informació de contacte editable
2. Afegir gràfic d'evolució (mini sparkline)
3. Mostrar proper esdeveniment amb més detall
4. Afegir accions ràpides contextuals
5. Mostrar alertes si hi ha problemes pendents

---

### 5. `app/admin/contactes/[id]/_components/panels/ProposalsPanel.tsx`
**Estat**: ⚠️ Funcional
**Problemes**:
- El form d'enviar és un `<form>` amb action directa (no controla errors)
- Els botons no tenen feedback visual d'acció
- No mostra vista prèvia del PDF

**Millores proposades**:
- Convertir enviar a fetch amb feedback
- Afegir vista prèvia del PDF inline
- Afegir confirmació abans d'enviar

---

### 6. `app/admin/contactes/[id]/_components/panels/TasksNotesPanel.tsx`
**Estat**: ✅ Bé
**Millores menors**:
- Afegir drag-and-drop per reordenar tasques
- Afegir filtre per prioritat
- Afegir creació ràpida inline

---

### 7. `app/admin/contactes/[id]/_components/TimelinePanel.tsx`
**Estat**: ⚠️ Pot escalar malament
**Problemes**:
- 250 events sense virtualització
- Sense agrupació per dia/setmana
- Sense filtre per tipus

**Millores proposades**:
- Afegir virtualització (react-window)
- Agrupar per dia
- Afegir filtres per tipus d'event

---

### 8. `lib/customer-hub/fetchCustomerHub.ts`
**Estat**: ⚠️ Funcional però millorable
**Problemes**:
- Usa `prisma as any` (perd tipat)
- Take arbitraris (80, 120) sense paginació
- No cacheja

**Millores proposades**:
- Eliminar `as any` i tipar correctament
- Afegir paginació real
- Considerar React Query o cache de Next.js

---

### 9. `app/admin/presupuestos/PresupuestoPdfStudio.tsx`
**Estat**: ❌ Massa gran i complex
**Problemes greus**:
- **1309 línies** en un sol component
- 40+ useState (hauria de ser useReducer)
- Molta lògica de negoci dins del component
- Sense separació de responsabilitats

**Millores crítiques**:
1. **Dividir en mòduls**:
   - `StudioHeader.tsx` - capçalera amb client info
   - `PackSelector.tsx` - selecció de pack
   - `ExtrasSelector.tsx` - selecció d'extres
   - `PdfPreview.tsx` - previsualització
   - `StudioActions.tsx` - botons d'acció
   - `useStudioState.ts` - hook amb useReducer

2. **Extreure lògica**:
   - `lib/studio/calculations.ts` - càlculs de preus
   - `lib/studio/pdf-builder.ts` - construcció del PDF
   - `lib/studio/draft-manager.ts` - gestió de drafts

---

### 10. `app/admin/layout.tsx`
**Estat**: ❌ Massa gran i tot client
**Problemes**:
- **930 línies** com a client component
- Tot el layout re-renderitza a cada navegació
- La sidebar podria ser server component

**Millores proposades**:
1. Separar en:
   - `AdminLayout.tsx` (server) - estructura base
   - `AdminSidebar.tsx` (client) - navegació
   - `AdminHeader.tsx` (client) - capçalera
   - `AdminMobileNav.tsx` (client) - nav mòbil

2. Memoitzar llistes de navegació fora del component

---

## 🛠️ PLA D'ACCIÓ PRIORITZAT

### Fase 1: Customer Hub (PRIORITAT ALTA)
1. ✨ Millorar SummaryPanel amb edició i més info
2. ✨ Afegir loading states i error boundaries
3. ✨ Millorar ProposalsPanel amb millor feedback
4. ✨ Afegir accions ràpides al header

### Fase 2: Rendiment
1. 🚀 Virtualitzar TimelinePanel
2. 🚀 Afegir debounce a inputs
3. 🚀 Lazy load de panells secundaris

### Fase 3: Refactorització
1. 🔧 Dividir PresupuestoPdfStudio
2. 🔧 Dividir Admin Layout
3. 🔧 Millorar tipat (eliminar `any`)

### Fase 4: UX
1. 🎨 Skeletons per carregues
2. 🎨 Transicions suaus entre tabs
3. 🎨 Millors feedback d'accions

---

## 📈 MÈTRIQUES ESPERADES

| Mètrica | Actual | Objectiu |
|---------|--------|----------|
| Línies SummaryPanel | 37 | 150-200 |
| Línies PresupuestoPdfStudio | 1309 | <400 (principal) |
| Línies Admin Layout | 930 | <200 (principal) |
| Loading states | 0 | 100% dels panels |
| Error boundaries | 1 | 1 per panel |
| Virtualització | 0 | Timeline + llistes >50 |

---

## 🚀 IMPLEMENTACIÓ

Començo implementant les millores més crítiques al Customer Hub.
