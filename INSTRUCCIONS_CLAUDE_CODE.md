# 🚀 INSTRUCCIONS PEL CLAUDE CODE - SISTEMA MULTIIDIOMA ÒRBITA EVENTS

## 📋 RESUM

Implementar sistema de traducció automàtica amb 6 idiomes:
- 🇪🇸 ES - Espanyol (MESTRE)
- 🏴 CA - Català
- 🇬🇧 EN - Anglès
- 🇲🇦 AR - Àrab (RTL!)
- 🇫🇷 FR - Francès
- 🇨🇳 ZH - Xinès

**COST: 0€** (Google Translate gratuit)

---

## 📁 ARXIUS A CREAR/MODIFICAR

### 1️⃣ REEMPLAÇAR: `i18n.ts`

```bash
# Copia el contingut de i18n.ts d'aquest paquet
cp i18n.ts /arrel-projecte/i18n.ts
```

### 2️⃣ CREAR: Script de traducció

```bash
# Copia l'script
cp scripts/translate.mjs /arrel-projecte/scripts/translate.mjs
```

### 3️⃣ CREAR: GitHub Action

```bash
# Crear carpeta si no existeix
mkdir -p .github/workflows

# Copia el workflow
cp .github/workflows/auto-translate.yml /arrel-projecte/.github/workflows/auto-translate.yml
```

### 4️⃣ AFEGIR a `messages/es.json`: Templates d'email

Obrir `messages/es.json` i afegir al final (abans de l'últim `}`):

```json
,
"emails": { ... },      // Tot el contingut de email_templates_to_add.json
"whatsapp": { ... },
"pdf": { ... },
"notifications_live": { ... }
```

### 5️⃣ CREAR: Arxius d'idiomes buits

```bash
# Crear arxius buits per nous idiomes
echo "{}" > messages/ar.json
echo "{}" > messages/fr.json
echo "{}" > messages/zh.json
```

### 6️⃣ MODIFICAR: `app/[locale]/layout.tsx`

Reemplaçar amb el layout.tsx d'aquest paquet (té suport RTL per àrab)

### 7️⃣ AFEGIR a `globals.css`: Estils RTL

Afegir al final de `globals.css` el contingut de `rtl-styles.css`

### 8️⃣ MODIFICAR: `middleware.ts`

Afegir els nous locales:

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/', '/(es|ca|en|ar|fr|zh)/:path*']  // ← AFEGIR ar, fr, zh
};
```

### 9️⃣ MODIFICAR: `LanguageSelector.tsx`

**IMPORTANT:** Reemplaçar completament amb el nou component que mostra TOTES les banderes visibles.

```bash
# Copia el nou component
cp app/components/ui/LanguageSelector.tsx /arrel-projecte/app/components/ui/LanguageSelector.tsx
```

El nou component té 3 variants:

```tsx
// VARIANT 1: Només banderes (per header desktop)
<LanguageSelector variant="flags" />
// Mostra: 🇪🇸 🏴󠁥󠁳󠁣󠁴󠁿 🇬🇧 🇲🇦 🇫🇷 🇨🇳

// VARIANT 2: Banderes + codi (més explícit)
<LanguageSelector variant="flags-text" />
// Mostra: 🇪🇸 ES | 🏴󠁥󠁳󠁣󠁴󠁿 CA | 🇬🇧 EN | 🇲🇦 AR | 🇫🇷 FR | 🇨🇳 ZH

// VARIANT 3: Compacte (per mòbil)
<LanguageSelector variant="compact" />
// Mostra grid 6 columnes amb bandera + codi

// VARIANT 4: Dropdown per mòbil (mostra bandera actual, obre les altres)
<LanguageSelectorMobile />

// VARIANT 5: Barra horitzontal (per footer)
<LanguageBar />
```

### 🔟 INTEGRAR AL HEADER

Exemple d'integració (veure `header-example.tsx`):

```tsx
import LanguageSelector, { LanguageSelectorMobile } from './LanguageSelector';

// Al header:
<div className="flex items-center gap-4">
  {/* Desktop: Totes les banderes visibles */}
  <div className="hidden md:block">
    <LanguageSelector variant="flags" />
  </div>
  
  {/* Mòbil: Dropdown */}
  <div className="md:hidden">
    <LanguageSelectorMobile />
  </div>
</div>
```

---

## 🔧 COMANDES A EXECUTAR

```bash
# 1. Instal·lar (si cal)
npm install

# 2. Executar traducció per primera vegada
node scripts/translate.mjs --force

# 3. Provar localment
npm run dev

# 4. Verificar cada idioma:
#    http://localhost:3000/es
#    http://localhost:3000/ca
#    http://localhost:3000/en
#    http://localhost:3000/ar  ← Comprovar que tot està invertit (RTL)
#    http://localhost:3000/fr
#    http://localhost:3000/zh

# 5. Si tot funciona, commit i push
git add .
git commit -m "feat: Add 6-language support with auto-translation"
git push
```

---

## 🔄 COM FUNCIONA L'AUTO-TRADUCCIÓ

```
TU EDITES messages/es.json
         │
         ▼
    git push
         │
         ▼
GitHub Action detecta canvi en es.json
         │
         ▼
Executa scripts/translate.mjs
         │
         ▼
Tradueix automàticament a CA, EN, AR, FR, ZH
         │
         ▼
Fa commit dels nous arxius
         │
         ▼
Vercel desplega automàticament
         │
         ▼
WEB ACTUALITZADA EN 6 IDIOMES! 🎉
```

---

## 📧 EMAILS/WHATSAPP MULTIIDIOMA

Quan un client es registra amb idioma `ar` (àrab):

```typescript
// Al crear lead, guardar l'idioma
const lead = await prisma.lead.create({
  data: {
    name: formData.name,
    email: formData.email,
    preferredLocale: locale,  // ← "ar"
    // ...
  }
});

// Al enviar email
import { getMessages } from '@/lib/messages';

async function sendConfirmationEmail(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const messages = await getMessages(lead.preferredLocale);  // Carrega ar.json
  
  const subject = messages.emails.lead_confirmation.subject;
  const body = messages.emails.lead_confirmation.body
    .replace('{name}', lead.name)
    .replace('{eventType}', lead.eventType);
  
  await sendEmail({
    to: lead.email,
    subject,  // En àrab!
    body,     // En àrab!
  });
}
```

---

## ⚠️ PUNTS IMPORTANTS

### RTL (Àrab)
- L'àrab s'escriu de DRETA a ESQUERRA
- El layout.tsx ja té `dir="rtl"` quan locale = "ar"
- Els estils CSS de rtl-styles.css gestionen la inversió
- Prova sempre la web en àrab per verificar que tot es veu bé

### Google Translate
- És GRATIS fins a 500k caràcters/mes
- La qualitat és bona però no perfecta
- Pots revisar/ajustar manualment si cal
- L'script preserva les variables {name}, {count}, etc.

### Variables en textos
- Utilitza sempre {variable} per dades dinàmiques
- Exemple: "Hola {name}, tu evento es el {date}"
- L'script les preserva durant la traducció

---

## 📊 CHECKLIST FINAL

- [ ] i18n.ts actualitzat amb 6 locales
- [ ] scripts/translate.mjs creat
- [ ] .github/workflows/auto-translate.yml creat
- [ ] messages/es.json amb templates emails
- [ ] messages/ar.json, fr.json, zh.json creats
- [ ] layout.tsx amb suport RTL
- [ ] globals.css amb estils RTL
- [ ] middleware.ts actualitzat
- [ ] **LanguageSelector.tsx reemplaçat (TOTES les banderes visibles!)**
- [ ] **Header integrat amb nou LanguageSelector**
- [ ] Traducció executada (--force primera vegada)
- [ ] Provat tots els idiomes localment
- [ ] Push a GitHub
- [ ] Verificat que GitHub Action funciona
- [ ] Web desplegada amb 6 idiomes

---

## 🆘 SI HI HA PROBLEMES

### Error "Rate limit exceeded"
L'API de Google té límits. Espera 1 minut i torna a executar.

### Traducció incorrecta
Edita manualment l'arxiu de l'idioma (ex: ar.json) i no es sobreescriurà.

### RTL no funciona
Verifica que:
1. `<html dir="rtl">` està present
2. rtl-styles.css està importat a globals.css

### GitHub Action falla
Verifica que el GITHUB_TOKEN té permisos d'escriptura al repo.

---

**FET!** 🎉

Amb això tindràs la web en 6 idiomes amb traducció 100% automàtica.

---

# 🎨 PART 2: ADMIN PANEL ESPECTACULAR

## FILOSOFIA DE DISSENY

```
MODERN · FOSC · ELEGANT · INTUÏTIU
Inspiració: Linear, Vercel, Notion, Stripe Dashboard
```

## PALETA DE COLORS

```css
--bg-primary: #0a0a0a;      /* Negre profund */
--bg-secondary: #141414;     /* Cards */
--accent: #F26522;           /* Taronja Òrbita */
--text-primary: #FFFFFF;
--text-secondary: #A1A1A1;
```

## ARXIUS ADMIN INCLOSOS

```
app/admin/
├── layout.tsx              ← Layout principal amb sidebar
├── page.tsx                ← Dashboard amb mètriques
└── components/
    ├── Sidebar.tsx         ← Navegació lateral elegant
    └── ui.tsx              ← Components UI (Button, Card, Badge, Input, etc.)
```

## COMPONENTS DISPONIBLES

### Components UI (app/admin/components/ui.tsx):

```tsx
// Mètriques
<MetricCard icon="💰" label="Facturat" value="4.850€" change="+23%" changeType="up" />

// Botons
<Button variant="primary" icon="+" label="Nova reserva" />
<Button variant="secondary" label="Exportar" />
<Button variant="ghost" label="Cancel·lar" />
<Button variant="danger" label="Eliminar" />

// Inputs
<Input label="Nom" placeholder="Escriu el nom..." icon="👤" />
<Select label="Tipus" options={[...]} />
<SearchInput placeholder="Buscar..." />

// Badges
<Badge label="Boda" icon="💍" color="orange" />
<StatusBadge status="new" />  // new, contacted, quote_sent, won, lost

// Cards
<Card title="Leads recents" subtitle="23 leads" action={<Button />}>
  {children}
</Card>

// Altres
<Avatar name="Maria García" />
<Toast type="success" message="Guardat correctament!" />
<SlideOver isOpen={true} title="Detalls lead">{children}</SlideOver>
<Tabs tabs={[...]} activeTab="leads" onChange={setTab} />
<EmptyState icon="📭" title="No hi ha leads" description="..." />
```

## INTEGRACIÓ

### 1. Copiar components:
```bash
cp -r app/admin/* /arrel-projecte/app/admin/
```

### 2. Afegir animacions a globals.css:
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 0.2s ease-out; }
.animate-slide-up { animation: slide-up 0.3s ease-out; }
```

## PÀGINES ADMIN A CREAR

| Pàgina | Ruta | Descripció |
|--------|------|------------|
| Dashboard | /admin | KPIs, calendari, activitat |
| Leads | /admin/leads | Taula + Kanban |
| Reserves | /admin/reservas | Calendari + llista |
| Calendari | /admin/calendario | Vista mensual |
| Inventari | /admin/inventario | Llista equipament |
| Packs | /admin/packs | Editor packs |
| FAQ | /admin/faq | Editor preguntes |
| Testimonis | /admin/testimonios | Gestió ressenyes |
| Traduccions | /admin/traducciones | Editor textos |
| Post-Event | /admin/post-event | Qüestionaris |
| Config | /admin/config | Configuració general |

Veure ADMIN_PANEL_DESIGN.md per més detalls i mockups.
