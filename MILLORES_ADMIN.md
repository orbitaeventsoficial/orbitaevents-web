# 🚀 MILLORES ADMIN - ÒRBITA EVENTS

## Resum Executiu

S'han creat **4 nous sistemes** per millorar l'administració:

1. **HelpSystem.tsx** - Sistema d'ajuda contextual complet
2. **FormWithHelp.tsx** - Components de formulari amb ajuda integrada
3. **AdminUI.tsx** - Components de UI consistents
4. **layout.new.tsx** - Layout simplificat (opcional)

---

## 1. Sistema d'Ajuda Contextual

### Com funciona

```
┌──────────────────────────────────────────────────────────────┐
│ CAPÇALERA                                    [❓ Ajuda]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Al fer clic a "Ajuda":                                      │
│                                                              │
│  1. S'activa el mode ajuda                                   │
│  2. S'obre el panell lateral amb el glossari                 │
│  3. Tots els camps amb helpId mostren icona ?                │
│  4. Al hover, apareix tooltip amb explicació                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Ús bàsic

```tsx
import { HelpProvider, HelpToggleButton, HelpTooltip } from './components/HelpSystem';

// Al layout
export default function Layout({ children }) {
  return (
    <HelpProvider>
      <header>
        <HelpToggleButton />
      </header>
      {children}
    </HelpProvider>
  );
}

// A qualsevol component
function MeuFormulari() {
  return (
    <label>
      <HelpTooltip id="lead-status">
        Estat de l'entrada
      </HelpTooltip>
    </label>
  );
}
```

### Glossari inclòs

El sistema inclou definicions per a:

| ID | Terme | Categoria |
|----|-------|-----------|
| `lead` | Entrada | leads |
| `lead-status` | Estat entrada | leads |
| `lead-score` | Puntuació | leads |
| `lead-source` | Origen | leads |
| `lead-priority` | Prioritat | leads |
| `customer` | Client | clients |
| `customer-status` | Estat client | clients |
| `booking` | Reserva | bookings |
| `booking-status` | Estat reserva | bookings |
| `quote` | Pressupost | quotes |
| `margin` | Marge | quotes |
| `task` | Tasca | tasks |
| `conversion-rate` | Taxa conversió | analytics |
| `cac` | CAC | analytics |
| ... | (veure HelpSystem.tsx) | |

---

## 2. Components de Formulari

### FormInput

```tsx
import { FormInput } from './components/FormWithHelp';

<FormInput
  label="Correu electrònic"
  helpId="customer-email"   // ID del glossari
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  error={errors.email}
  hint="Utilitzarem aquest correu per enviar pressupostos"
  required
/>
```

### FormSelect

```tsx
import { FormSelect } from './components/FormWithHelp';

<FormSelect
  label="Estat"
  helpId="lead-status"
  options={[
    { value: 'NEW', label: 'Nou' },
    { value: 'CONTACTED', label: 'Contactat' },
    { value: 'QUOTE_SENT', label: 'Pressupost enviat' },
  ]}
  value={status}
  onChange={setStatus}
/>
```

### FormSection

```tsx
import { FormSection } from './components/FormWithHelp';

<FormSection title="Dades de contacte" description="Informació bàsica del client">
  <FormInput label="Nom" ... />
  <FormInput label="Email" ... />
</FormSection>
```

### InlineEdit

```tsx
import { InlineEdit } from './components/FormWithHelp';

// Edició inline sense obrir modal
<InlineEdit
  value={customer.name}
  onSave={async (newValue) => {
    await updateCustomer({ name: newValue });
  }}
  placeholder="Introdueix nom"
/>
```

---

## 3. Components de UI

### StatusBadge

```tsx
import { StatusBadge } from './components/AdminUI';

<StatusBadge status="WON" />           // ✅ Guanyat
<StatusBadge status="URGENT" />        // 🚨 Urgent
<StatusBadge status="CONFIRMED" />     // ✅ Confirmat

// Opcions
<StatusBadge status="WON" size="sm" />           // Petit
<StatusBadge status="WON" showIcon={false} />    // Sense icona
<StatusBadge status="WON" customLabel="Tancat" /> // Label personalitzat
```

### QuickActions

```tsx
import { QuickActions } from './components/AdminUI';

<QuickActions
  actions={[
    { icon: '📞', label: 'Trucar', onClick: handleCall },
    { icon: '📄', label: 'Pressupost', href: `/admin/quotes/new?lead=${id}` },
    { icon: '✅', label: 'Guanyat', onClick: markAsWon, variant: 'success' },
    { icon: '❌', label: 'Perdut', onClick: markAsLost, variant: 'danger' },
  ]}
/>
```

### DataCard

```tsx
import { DataCard } from './components/AdminUI';

<div className="grid grid-cols-4 gap-4">
  <DataCard
    title="Total Entrades"
    value={150}
    color="blue"
    icon="📥"
    trend={{ value: 12, label: 'vs mes anterior' }}
    href="/admin/leads"
  />
  <DataCard
    title="Conversió"
    value="23%"
    color="green"
    icon="🎯"
  />
</div>
```

### EmptyState

```tsx
import { EmptyState } from './components/AdminUI';

<EmptyState
  icon="📭"
  title="No hi ha entrades"
  description="Quan rebis una nova consulta, apareixerà aquí"
  action={{ label: 'Crear entrada manual', href: '/admin/leads/new' }}
/>
```

### ConfirmModal

```tsx
import { ConfirmModal } from './components/AdminUI';

const [showDelete, setShowDelete] = useState(false);

<ConfirmModal
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  title="Eliminar entrada?"
  message="Aquesta acció no es pot desfer. Tots les dades associades es perdran."
  confirmLabel="Sí, eliminar"
  variant="danger"
  loading={deleting}
/>
```

### Toast

```tsx
import { Toast } from './components/AdminUI';

{showToast && (
  <Toast
    type="success"
    message="Entrada guardada correctament"
    onClose={() => setShowToast(false)}
  />
)}
```

---

## 4. Layout Simplificat (Opcional)

El nou layout (`layout.new.tsx`) redueix de **930 línies a ~400** i simplifica la navegació:

### Navegació anterior (32 opcions)
```
Entrades, Clients, Reserves, Tasques, Pressupostos,
Missatges, Calendari, Inbox, Finances, Operativa de vendes,
Ressenyes, Post-esdeveniment, Analítica, Rendibilitat, Catàleg,
FAQ, Textos PRO, Correus automàtics, Canvas, Ressenyes Google,
Blog, Configuració, Plantilla pressupostos, Integracions,
Features, Cobertura, Tema, Traduccions...
```

### Navegació nova (15 opcions)
```
PRINCIPAL
├── Entrades
├── Clients
├── Reserves
├── Tasques
└── Pressupostos

OPERATIVA
├── Calendari
├── Inbox
└── Analítica

GESTIÓ
├── Ressenyes
├── Post-Esdeveniment
├── Finances
└── Packs i Preus

CONTINGUT
├── Blog
├── FAQ
└── Textos

⚙️ Configuració
```

### Per aplicar

```bash
# IMPORTANT: Fes backup primer!
cp app/admin/layout.tsx backups/layout.tsx.backup

# Aplica el nou layout
cp app/admin/layout.new.tsx app/admin/layout.tsx
```

---

## 5. Com Integrar

### Pas 1: Afegir HelpProvider al layout

```tsx
// app/admin/layout.tsx
import { HelpProvider, HelpToggleButton } from './components/HelpSystem';

export default function AdminLayout({ children }) {
  return (
    <HelpProvider>
      <header>
        <HelpToggleButton />
      </header>
      <main>{children}</main>
    </HelpProvider>
  );
}
```

### Pas 2: Usar components als formularis

```tsx
// app/admin/leads/[id]/page.tsx
import { FormInput, FormSelect, FormSection } from '../components/FormWithHelp';
import { StatusBadge, QuickActions } from '../components/AdminUI';

function LeadPage({ lead }) {
  return (
    <div>
      <StatusBadge status={lead.status} />
      
      <FormSection title="Dades del lead">
        <FormInput label="Nom" helpId="lead" value={lead.name} />
        <FormSelect label="Prioritat" helpId="lead-priority" ... />
      </FormSection>
      
      <QuickActions actions={[...]} />
    </div>
  );
}
```

---

## 6. Llista de Fitxers Creats

| Fitxer | Descripció | Línies |
|--------|------------|--------|
| `app/admin/components/HelpSystem.tsx` | Sistema d'ajuda complet | ~400 |
| `app/admin/components/FormWithHelp.tsx` | Components formulari | ~350 |
| `app/admin/components/AdminUI.tsx` | Components UI | ~400 |
| `app/admin/layout.new.tsx` | Layout simplificat | ~400 |
| `scripts/apply-admin-improvements.sh` | Script d'aplicació | ~80 |

---

## 7. Beneficis Esperats

| Mètrica | Abans | Després |
|---------|-------|---------|
| Temps per entendre un camp | ~30s (preguntar) | ~3s (tooltip) |
| Opcions de menú | 32 | 15 |
| Consistència visual | Variable | 100% |
| Codi duplicat | Alt | Baix |
| Onboarding nous usuaris | Difícil | Fàcil |

---

## 8. Pròxims Passos Recomanats

1. ✅ Integrar HelpSystem al layout actual
2. ⬜ Reemplaçar formularis antics amb FormWithHelp
3. ⬜ Afegir més termes al glossari segons necessitat
4. ⬜ Considerar aplicar el layout simplificat
5. ⬜ Crear tests per als nous components

---

## 9. Contacte i Suport

Si tens dubtes sobre com integrar aquests components, revisa:

- `/app/admin/components/HelpSystem.tsx` - Comentaris inline
- `/app/admin/components/AdminUI.tsx` - Exemples d'ús
- Aquest document

---

*Última actualització: Febrer 2026*
