# 🚀 GUIA D'IMPLEMENTACIÓ - Activar la Màquina de Facturar

## ✅ FITXERS NOUS CREATS

Els següents fitxers nous estan preparats per substituir els components estàtics:

1. **`app/components/home/HeroCinematic-REAL.tsx`**
   - Hero connectat a BD amb `usePublicStats()` i `useAvailability()`
   - Stats REALS, countdown REAL, disponibilitat REAL

2. **`app/components/home/Testimonials-REAL.tsx`**
   - Testimonials de BD amb `useTestimonials()`
   - Stats REALS, empty state elegant, promoció sistema gamificat

3. **`ANALISI-BRUTAL-COMPLETA.md`**
   - Document complet amb tots els problemes i solucions

---

## 🔧 PAS 1: Canviar la Homepage (5 minuts)

Edita `app/[locale]/page.tsx` i canvia els imports:

```typescript
// ABANS (FAKE):
import { 
  HeroCinematicBrutal, 
  TestimonialsBrutal, 
  CTASectionBrutal, 
  WhyUsBrutal 
} from '../components/home';

// DESPRÉS (REAL):
import { 
  HeroCinematicReal,      // ← NOU! Connectat a BD
  TestimonialsBrutalReal, // ← NOU! Connectat a BD
  CTASectionBrutal, 
  WhyUsBrutal 
} from '../components/home';
```

I al `return`:

```typescript
export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <HeroCinematicReal />         {/* ← CANVIAT! */}
      <ServicesSection />
      <ThemesSection />
      <WhyUsBrutal />
      <TestimonialsBrutalReal />    {/* ← CANVIAT! */}
      <CTASectionBrutal />
    </main>
  );
}
```

---

## 🔧 PAS 2: Afegir FlashOffer al Layout (5 minuts)

Edita `app/[locale]/layout.tsx` i afegeix:

```typescript
import FlashOffer from '@/app/components/marketing/FlashOffer';

// Dins del layout, al principi del body:
export default function LocaleLayout({ children }) {
  return (
    <html>
      <body>
        <FlashOffer />  {/* ← AFEGIR! Banner oferta dinàmica */}
        {/* ... resta del contingut */}
      </body>
    </html>
  );
}
```

---

## 🔧 PAS 3: Afegir Traduccions que Falten (15 minuts)

Les noves claus necessàries per al component Testimonials-REAL:

```json
// Afegir a messages/ca.json dins de "testimonials":
{
  "testimonials": {
    // ... claus existents ...
    "stats": {
      "googleRating": "Valoració Google",
      "events": "Events realitzats",
      "rating": "Valoració mitjana",
      "reviews": "Opinions"
    },
    "emptyState": {
      "title": "Sigues el primer!",
      "description": "Encara no tenim opinions publicades. Has celebrat un event amb nosaltres? Deixa la teva opinió i guanya fins un 25% de descompte!",
      "cta": "Deixa la primera opinió"
    }
  }
}
```

```json
// Afegir a messages/es.json dins de "testimonials":
{
  "testimonials": {
    // ... claus existents ...
    "stats": {
      "googleRating": "Valoración Google",
      "events": "Eventos realizados",
      "rating": "Valoración media",
      "reviews": "Opiniones"
    },
    "emptyState": {
      "title": "¡Sé el primero!",
      "description": "Aún no tenemos opiniones publicadas. ¿Has celebrado un evento con nosotros? ¡Deja tu opinión y gana hasta un 25% de descuento!",
      "cta": "Deja la primera opinión"
    }
  }
}
```

---

## 🔧 PAS 4: Configurar Oferta Flash a la BD (5 minuts)

Per activar el FlashOffer, has d'afegir aquests Settings a la BD:

```sql
INSERT INTO settings (id, key, value, type, category) VALUES
  (gen_random_uuid(), 'offer_active', 'true', 'BOOLEAN', 'offer'),
  (gen_random_uuid(), 'offer_end_date', '2025-12-31T23:59:59Z', 'STRING', 'offer'),
  (gen_random_uuid(), 'offer_discount', '10', 'NUMBER', 'offer'),
  (gen_random_uuid(), 'offer_cta_link', '/configurador', 'STRING', 'offer'),
  (gen_random_uuid(), 'offer_title', '⚡ OFERTA NADAL', 'STRING', 'offer'),
  (gen_random_uuid(), 'offer_description', '-10% en tots els packs fins al 31 de desembre', 'STRING', 'offer');
```

O via l'admin panel si tens /admin/settings configurat.

---

## 🔧 PAS 5: ELIMINAR Testimonials FAKE (5 minuts)

Edita `messages/ca.json` i ELIMINA o marca com deprecated:

```json
// ELIMINAR AIXÒ (és el teu propi casament que ENCARA NO HA PASSAT!):
"testimonial1": {
  "eventType": "Casament temàtic",
  "highlight": "Una experiència màgica!",
  "quote": "Van transformar el nostre casament...",
  "author": "Lorena i Carles",  // ← SOU VOSALTRES!
  "role": "Nuvis - Casament Món Màgic",
  "date": "Juliol 2025"  // ← DATA FUTURA!
}
```

El nou component Testimonials-REAL JA NO utilitza aquestes traduccions - llegeix de la BD.

---

## ✅ CHECKLIST FINAL

- [ ] Canviat `HeroCinematicBrutal` per `HeroCinematicReal`
- [ ] Canviat `TestimonialsBrutal` per `TestimonialsBrutalReal`
- [ ] Afegit `FlashOffer` al layout
- [ ] Afegides traduccions noves
- [ ] Configurada oferta a Settings BD
- [ ] Eliminats testimonials fake de translations
- [ ] Testat en local amb `npm run dev`
- [ ] Desplegat a Vercel

---

## 🔥 RESULTAT ESPERAT

Després d'aquests canvis:

1. **Hero** → Mostra stats REALS de la BD (events, anys, etc.)
2. **Countdown** → Data REAL del proper dissabte disponible
3. **Testimonials** → Opinions REALS aprovades per admin
4. **FlashOffer** → Banner dinàmic controlat per admin
5. **Zero contingut fake** → Tot verificable i honest

---

## 🚨 TROUBLESHOOTING

### "Els stats mostren 0"
- Verifica que tens dades a la taula `bookings` amb `status: COMPLETED`
- Verifica que l'API `/api/public/stats` respon correctament

### "No hi ha testimonials"
- Normal si no en tens cap aprovat! El component mostra un empty state elegant
- Afegeix testimonials via admin o directament a BD amb `isApproved: true`

### "FlashOffer no apareix"
- Verifica que `offer_active` = `true` a Settings
- Verifica que `offer_end_date` és una data futura
- Comprova la consola per errors d'API

---

*Manolo: "Ara cada píxel és honest i vèn. Endavant!"* 🔥
