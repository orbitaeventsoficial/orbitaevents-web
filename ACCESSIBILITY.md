# ♿ Mejoras de Accesibilidad Recomendadas

## Estado Actual

- **Aria-labels actuales:** 25 instancias
- **Nivel WCAG:** Parcial 2.1 AA
- **Puntuación:** 8.0/10 (Bueno)

---

## Prioridad Alta

### 1. Añadir aria-labels a Botones con Solo Iconos

**Componentes a revisar:**
- `GalleryPro.tsx` - Botones de navegación (anterior/siguiente, cerrar, zoom)
- `PWAInstallButton` - Botón de instalación
- Botones de redes sociales (compartir)
- Iconos de menú móvil

**Ejemplo de mejora:**
```tsx
// ❌ Antes
<button onClick={handleClose}>
  <Icons.Close />
</button>

// ✅ Después
<button
  onClick={handleClose}
  aria-label="Cerrar galería"
>
  <Icons.Close />
</button>
```

### 2. Regiones ARIA para Notificaciones

**Ubicación:** `ContactFormComplete.tsx`, formularios

```tsx
// Añadir al componente de formulario
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {successMessage && <p>{successMessage}</p>}
  {errorMessage && <p>{errorMessage}</p>}
</div>
```

### 3. Skip Navigation Link

**Añadir en layout principal:**

```tsx
// app/layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-amber-500 focus:text-black"
>
  Saltar al contenido principal
</a>

{/* ... */}

<main id="main-content">
  {children}
</main>
```

---

## Prioridad Media

### 4. Mejorar Keyboard Navigation

#### Trap Focus en Modales

**GalleryPro.tsx Lightbox:**

```tsx
useEffect(() => {
  if (!isOpen) return;

  const focusableElements = modalRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements?.[0];
  const lastElement = focusableElements?.[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        (lastElement as HTMLElement)?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        (firstElement as HTMLElement)?.focus();
      }
    }
  };

  document.addEventListener('keydown', handleTab);
  (firstElement as HTMLElement)?.focus();

  return () => document.removeEventListener('keydown', handleTab);
}, [isOpen]);
```

#### Mejorar Tab Order

```tsx
// Botones de filtro en GalleryPro
<button
  tabIndex={activeCategory === cat.id ? 0 : -1}
  aria-pressed={activeCategory === cat.id}
>
  {cat.label}
</button>
```

### 5. Estados de Focus Visibles

**Añadir a global.css:**

```css
/* Focus visible mejorado */
*:focus-visible {
  outline: 2px solid theme('colors.amber.400');
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only:focus,
.sr-only:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Prioridad Baja

### 6. Mejorar Contraste de Colores

**Verificar con herramientas:**
- Chrome DevTools Lighthouse
- axe DevTools
- WebAIM Contrast Checker

**Áreas a revisar:**
- Texto sobre fondos degradados
- Enlaces en estado hover
- Botones secundarios

### 7. Mensajes de Error Descriptivos

```tsx
// ❌ Antes
{errors.email && <p className="text-red-500">Error</p>}

// ✅ Después
{errors.email && (
  <p
    id="email-error"
    role="alert"
    className="text-red-500"
  >
    <span className="sr-only">Error:</span>
    {errors.email}
  </p>
)}

<input
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
```

### 8. Landmarks ARIA

```tsx
// Añadir roles semánticos
<header role="banner">
  <nav role="navigation" aria-label="Navegación principal">
    {/* ... */}
  </nav>
</header>

<main role="main">
  {/* Contenido principal */}
</main>

<aside role="complementary" aria-label="Información adicional">
  {/* Sidebar */}
</aside>

<footer role="contentinfo">
  {/* Footer */}
</footer>
```

---

## Testing de Accesibilidad

### Herramientas Recomendadas

#### 1. axe DevTools (Chrome/Firefox)

```bash
# Instalar para Playwright
pnpm add -D @axe-core/playwright

# Usar en tests
import { injectAxe, checkA11y } from 'axe-playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

#### 2. Lighthouse CI

```bash
# Ya instalado - ejecutar
pnpm lighthouse https://orbitaevents.com --only-categories=accessibility
```

#### 3. Manual Testing

**Keyboard only:**
- Tab through toda la página
- Enter para activar botones/enlaces
- Escape para cerrar modales
- Arrow keys en galerías/carousels

**Screen reader:**
- NVDA (Windows, gratis)
- JAWS (Windows, pago)
- VoiceOver (macOS, incluido)
- TalkBack (Android)

---

## Checklist de Implementación

### Alta Prioridad
- [ ] Añadir aria-labels a botones con iconos en GalleryPro
- [ ] Añadir aria-live regions en formularios
- [ ] Implementar skip navigation link
- [ ] Mejorar keyboard focus visibility

### Media Prioridad
- [ ] Implementar focus trap en modales
- [ ] Verificar y mejorar tab order
- [ ] Añadir aria-pressed/aria-expanded donde aplique
- [ ] Mejorar mensajes de error con role="alert"

### Baja Prioridad
- [ ] Auditar contraste de colores con axe DevTools
- [ ] Añadir landmarks ARIA semánticos
- [ ] Testing completo con screen readers
- [ ] Añadir tests automatizados de a11y

---

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## Comandos Útiles

```bash
# Buscar botones sin aria-label
grep -r "<button" app/ --include="*.tsx" | grep -v "aria-label"

# Buscar imágenes sin alt
grep -r "<img\|<Image" app/ --include="*.tsx" | grep -v "alt="

# Ejecutar Lighthouse
pnpm lighthouse https://orbitaevents.com --only-categories=accessibility --view

# Test con axe (después de instalar)
pnpm test:a11y
```

---

**Impacto esperado:** Mejora del 8.0/10 → 9.5/10 en accesibilidad
**Esfuerzo:** Medio (4-6 horas)
**Beneficios:**
- Mejor experiencia para usuarios con discapacidades
- Cumplimiento legal (accesibilidad web es obligatoria en muchas jurisdicciones)
- Mejor SEO (Google favorece sitios accesibles)
- Mejor usabilidad general (keyboard navigation beneficia a todos)
