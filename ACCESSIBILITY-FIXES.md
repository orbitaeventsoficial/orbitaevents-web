# Accessibility Fixes Guide - Òrbita Events

**Based on Lighthouse Audit Results**
**Date:** 2026-01-08
**Current Score:** 0.86-0.89 (Target: ≥0.90)

---

## Priority Fixes

### 🔴 Critical Issues (Must Fix)

#### 1. Button Accessible Names (`button-name`)

**Problem:** Buttons with icons but no text need `aria-label`

**How to Fix:**
```tsx
// ❌ Before (BAD)
<button className="...">
  <svg>...</svg>
</button>

// ✅ After (GOOD)
<button className="..." aria-label="Open menu">
  <svg aria-hidden="true">...</svg>
</button>
```

**Common Locations to Fix:**
- Mobile menu toggle buttons
- Close buttons (×)
- Navigation arrows (← →)
- Social media icon buttons
- Search button icons
- Play/Pause buttons

**Action Required:**
```bash
# Find all buttons
grep -r "<button" app/ components/ --include="*.tsx" | grep -v "aria-label"

# Add aria-label to each button that contains only icons
```

---

#### 2. Color Contrast (`color-contrast`)

**Problem:** Text doesn't have sufficient contrast ratio
**WCAG Requirement:** 4.5:1 for normal text, 3:1 for large text

**How to Fix:**

```tsx
// ❌ Before (BAD - Low contrast)
<p className="text-gray-400">Low contrast text</p>
// Contrast ratio: ~3:1 (FAIL)

// ✅ After (GOOD - High contrast)
<p className="text-gray-200">High contrast text</p>
// Contrast ratio: ~7:1 (PASS)
```

**Common Problem Areas:**
- Placeholder text: `text-white/30` → `text-white/50`
- Secondary text: `text-white/60` → `text-white/70`
- Disabled states: Ensure at least 3:1
- Gradient text over gradient backgrounds

**Tool to Check:**
https://webaim.org/resources/contrastchecker/

**Tailwind Classes to Review:**
```css
/* Replace these low-contrast classes: */
text-white/30  → text-white/50  (placeholders)
text-white/40  → text-white/60  (secondary)
text-white/50  → text-white/70  (tertiary)
text-gray-400  → text-gray-200  (general text)
text-gray-500  → text-gray-300
```

---

#### 3. Heading Order (`heading-order`)

**Problem:** Headings skip levels (h1 → h3, skipping h2)

**How to Fix:**
```tsx
// ❌ Before (BAD)
<h1>Main Title</h1>
<h3>Subtitle</h3>  {/* Skips h2 */}

// ✅ After (GOOD)
<h1>Main Title</h1>
<h2>Subtitle</h2>
<h3>Sub-subtitle</h3>
```

**Rules:**
- Always start with `<h1>` (one per page)
- Never skip levels (h1 → h2 → h3)
- Multiple h2s are OK
- Headings for structure, not just styling

**Common Pages to Check:**
- Homepage
- Service pages
- About page
- Contact page

**Search Command:**
```bash
# Find all headings
grep -r "<h[1-6]" app/ --include="*.tsx"
```

---

#### 4. Form Labels (`label`)

**Problem:** Form inputs missing associated `<label>` elements
**Affected:** Bodas page contact form

**How to Fix:**
```tsx
// ❌ Before (BAD)
<input type="text" placeholder="Name" />

// ✅ After (GOOD - Option 1: Explicit label)
<label htmlFor="name">Name</label>
<input id="name" type="text" placeholder="Name" />

// ✅ After (GOOD - Option 2: Wrapped label)
<label>
  Name
  <input type="text" placeholder="Name" />
</label>

// ✅ After (GOOD - Option 3: aria-label if no visible label)
<input type="text" placeholder="Name" aria-label="Your full name" />
```

**Locations to Fix:**
- `app/[locale]/servicios/bodas/page.tsx` - Contact form
- Any custom form components
- Search inputs
- Newsletter signup forms

---

#### 5. Link Text (`link-text`)

**Problem:** Links with non-descriptive text like "click here", "more", "read more"

**How to Fix:**
```tsx
// ❌ Before (BAD)
<a href="/contacto">click aquí</a>
Para más info, <a href="/about">haz click aquí</a>

// ✅ After (GOOD)
<a href="/contacto">Contacta con nosotros</a>
<a href="/about">Lee más sobre Òrbita Events</a>

// ✅ Alternative with aria-label
<a href="/about" aria-label="Lee más sobre nuestros servicios de DJ">
  Leer más
</a>
```

**Common Problematic Phrases:**
- "click aquí" → "Contacta con nosotros"
- "más info" → "Más información sobre [topic]"
- "leer más" → "Leer más sobre [specific topic]"
- "ver más" → "Ver más eventos de [category]"

**Search for Non-Descriptive Links:**
```bash
grep -ri "click.*aquí\|haz click\|más info\|leer más" app/ messages/
```

---

### 🟡 High Priority

#### 6. Canonical Tags

**Problem:** `/portfolio` missing valid `rel=canonical`

**How to Fix:**
```tsx
// In app/[locale]/portfolio/page.tsx
export async function generateMetadata({ params }: { params: { locale: string } }) {
  return {
    title: 'Portfolio | Òrbita Events',
    description: '...',
    alternates: {
      canonical: `/${params.locale}/portfolio`,  // ✅ Add this
    },
  };
}
```

---

## Automated Fix Script

Create `scripts/fix-accessibility.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Fix color contrast
const contrastFixes = {
  'text-white/30': 'text-white/50',
  'text-white/40': 'text-white/60',
  'text-white/50': 'text-white/70',
  'text-gray-400': 'text-gray-200',
  'text-gray-500': 'text-gray-300',
};

// Fix non-descriptive links
const linkTextFixes = {
  'click aquí': 'Contacta con nosotros',
  'haz click': 'Ver más información',
  'más info': 'Más información',
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Apply contrast fixes
  for (const [old, newVal] of Object.entries(contrastFixes)) {
    if (content.includes(old)) {
      content = content.replace(new RegExp(old, 'g'), newVal);
      modified = true;
      console.log(`✅ Fixed contrast in ${filePath}: ${old} → ${newVal}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// Scan all TSX files
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  }
}

console.log('🔍 Scanning for accessibility issues...\n');
scanDirectory('./app');
scanDirectory('./components');
console.log('\n✅ Done!');
```

**Run:**
```bash
node scripts/fix-accessibility.js
```

---

## Manual Review Checklist

### Forms
- [ ] All `<input>` have associated `<label>`
- [ ] All `<select>` have labels
- [ ] All `<textarea>` have labels
- [ ] Error messages are associated with inputs (`aria-describedby`)
- [ ] Required fields marked with `required` or `aria-required="true"`

### Buttons
- [ ] All icon-only buttons have `aria-label`
- [ ] Toggle buttons have `aria-pressed` state
- [ ] Disabled buttons have `disabled` attribute
- [ ] Submit buttons have descriptive text

### Links
- [ ] All links have descriptive text
- [ ] External links have `rel="noopener noreferrer"`
- [ ] Links opening in new tab have warning (`target="_blank"` → add aria-label)

### Images
- [ ] All `<img>` have `alt` text
- [ ] Decorative images have `alt=""` (empty)
- [ ] Complex images have extended descriptions

### Color
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Large text contrast ratio ≥ 3:1
- [ ] Focus indicators visible (outline)
- [ ] Information not conveyed by color alone

### Structure
- [ ] One `<h1>` per page
- [ ] Heading hierarchy correct (no skipped levels)
- [ ] Landmarks used (`<main>`, `<nav>`, `<aside>`, `<footer>`)
- [ ] Skip to main content link (optional but recommended)

### Keyboard
- [ ] All interactive elements focusable
- [ ] Focus order logical
- [ ] No keyboard traps
- [ ] Custom widgets have proper ARIA

---

## Testing Tools

### Automated
```bash
# Lighthouse
npx lighthouse https://orbitaevents.com --only-categories=accessibility --view

# axe-core
npm install -D @axe-core/cli
npx axe https://orbitaevents.com
```

### Manual
- **Keyboard Navigation:** Tab through entire site
- **Screen Reader:** Test with NVDA (Windows) or VoiceOver (Mac)
- **Zoom:** Test at 200% zoom
- **Color Blindness:** Use browser extensions

### Browser Extensions
- **axe DevTools** - Free, comprehensive
- **WAVE** - Visual feedback
- **Accessibility Insights** - Microsoft tool

---

## Quick Wins (30 minutes)

1. **Add aria-labels to icon buttons** (10 min)
2. **Fix color contrast** with automated script (5 min)
3. **Fix heading hierarchy** on main pages (10 min)
4. **Add form labels** to bodas page (5 min)

---

## Implementation Priority

### Week 1 (Critical)
- [ ] Fix all button aria-labels
- [ ] Fix color contrast issues
- [ ] Fix heading order on all pages
- [ ] Add form labels

### Week 2 (High)
- [ ] Fix link text
- [ ] Add canonical tags
- [ ] Keyboard navigation testing
- [ ] Screen reader testing

### Week 3 (Enhancement)
- [ ] Skip to main content link
- [ ] ARIA landmarks
- [ ] Focus visible improvements
- [ ] Error message association

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## Target After Fixes

- **Accessibility Score:** ≥ 0.95 (currently 0.86-0.89)
- **All Critical Issues:** Resolved
- **WCAG Level:** AA Compliant

**Estimated Time:** 2-3 hours for all critical fixes
