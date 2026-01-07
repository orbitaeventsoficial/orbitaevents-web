# Lighthouse Audit Results - Òrbita Events
**Date:** 2026-01-08
**Tool:** Lighthouse CI 0.15.1
**URLs Tested:** 4 (homepage, contacto, servicios/bodas, portfolio)
**Runs per URL:** 3

---

## Summary

| Metric | Homepage | Contacto | Bodas | Portfolio | Target |
|--------|----------|----------|-------|-----------|--------|
| **Accessibility** | 0.89 | 0.89 | 0.86 | 0.89 | ≥0.90 |
| **SEO** | 0.92 | 0.92 | 0.92 | 0.85 | ≥0.95 |
| **Performance** | ⚠️ Multiple warnings | ⚠️ Multiple warnings | ⚠️ Multiple warnings | ⚠️ Multiple warnings | ≥0.90 |
| **Console Errors** | ❌ Yes | ❌ Yes | ❌ Yes | ❌ Yes | None |

---

## Critical Issues

### 1. Accessibility Failures (All Pages)

#### Button Name (`button-name`)
**Score:** 0 (Expected: ≥0.9)
**Issue:** Buttons do not have an accessible name
**Impact:** Screen readers cannot announce button purpose

**Fix Required:**
```tsx
// Before:
<button className="...">
  <svg>...</svg>
</button>

// After:
<button className="..." aria-label="Open menu">
  <svg aria-hidden="true">...</svg>
</button>
```

#### Color Contrast (`color-contrast`)
**Score:** 0 (Expected: ≥0.9)
**Issue:** Background and foreground colors do not have sufficient contrast ratio
**Impact:** Low vision users cannot read text
**WCAG Requirement:** 4.5:1 for normal text, 3:1 for large text

**Fix Required:**
- Audit all text colors against backgrounds
- Increase contrast ratios to meet WCAG AA standards

#### Heading Order (`heading-order`)
**Score:** 0 (Expected: ≥0.9)
**Issue:** Heading elements are not in sequentially-descending order
**Impact:** Screen reader navigation broken

**Example Fix:**
```tsx
// Before:
<h1>Title</h1>
<h3>Subtitle</h3> // ❌ Skips h2

// After:
<h1>Title</h1>
<h2>Subtitle</h2> // ✅ Sequential
```

#### Form Labels (`label`) - Bodas Page Only
**Score:** 0 (Expected: ≥0.9)
**Issue:** Form elements do not have associated labels
**Impact:** Screen readers cannot identify form fields

**Fix Required:**
```tsx
// Before:
<input type="text" placeholder="Name" />

// After:
<label htmlFor="name">Name</label>
<input id="name" type="text" placeholder="Name" />
```

---

### 2. SEO Failures

#### Link Text (`link-text`)
**Score:** 0 (Expected: ≥0.9)
**Pages:** All
**Issue:** Links do not have descriptive text
**Impact:** Search engines and screen readers cannot understand link purpose

**Examples to Fix:**
```tsx
// Before:
<a href="/contacto">click aquí</a>

// After:
<a href="/contacto">Contacta con nosotros</a>
```

#### Canonical Tag (`canonical`) - Portfolio Page
**Score:** 0 (Expected: ≥0.9)
**Issue:** Document does not have a valid `rel=canonical`
**Impact:** SEO confusion, potential duplicate content issues

**Fix Required:**
Check `app/[locale]/portfolio/page.tsx` metadata configuration.

---

### 3. Performance Issues

#### Console Errors (`errors-in-console`)
**Score:** 0 (Expected: ≥0.9)
**Pages:** All
**Issue:** Browser errors logged to console
**Impact:** May cause runtime failures, poor user experience

**Action Required:**
1. Open browser DevTools console
2. Identify all errors on each page
3. Fix JavaScript/React errors

#### Responsive Images (`uses-responsive-images`)
**Homepage:** 6 oversized images
**Portfolio:** 9 oversized images
**Bodas:** 1 oversized image

**Issue:** Images served are significantly larger than display size
**Impact:** Wasted bandwidth, slower page loads

**Fix Required:**
Use Next.js `<Image>` component with proper `sizes` attribute:
```tsx
<Image
  src="/img/portfolio/bodas-01.webp"
  alt="Boda"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
/>
```

#### LCP Lazy Loaded (`lcp-lazy-loaded`) - Portfolio Page
**Score:** 0 (Expected: ≥0.9)
**Issue:** Largest Contentful Paint image was lazily loaded
**Impact:** Slower perceived performance

**Fix Required:**
```tsx
// For above-the-fold hero images:
<Image
  src="/hero.jpg"
  priority // ✅ Disables lazy loading for LCP image
  alt="Hero"
/>
```

#### Unused JavaScript (`unused-javascript`)
**Found on:** Homepage, Bodas, Portfolio
**Issue:** Reduce unused JavaScript

**Fix Required:**
- Code split heavy components
- Remove unused dependencies
- Use dynamic imports for non-critical features

#### Back/Forward Cache (`bf-cache`)
**Score:** 0 (Expected: ≥0.9)
**Pages:** All
**Issue:** Page prevented back/forward cache restoration

**Potential Causes:**
- `unload` event listeners
- Non-persistent connections
- Cache-Control headers

---

### 4. Performance Warnings

#### Speed Index
**Homepage:** 0.48 (target: ≥0.9)
**Contacto:** 0.33
**Bodas:** 0.83
**Portfolio:** Not measured

**Issue:** Visual load speed slower than expected

#### DOM Size (`dom-size-insight`)
**Score:** 0 (Expected: ≥0.9)
**Pages:** All

**Recommended Actions:**
- Reduce total DOM nodes
- Limit DOM depth
- Avoid excessive nesting

#### Legacy JavaScript
**Pages:** All
**Count:** 2-4 instances

**Issue:** Serving legacy JavaScript to modern browsers
**Impact:** Larger bundles, slower execution

**Fix Required:**
Update `browserslist` in `package.json`:
```json
{
  "browserslist": [
    ">0.3%",
    "not dead",
    "not op_mini all"
  ]
}
```

#### Render Blocking Resources
**Count:** 2 resources on all pages

**Fix Required:**
- Inline critical CSS
- Defer non-critical CSS/JS
- Use `rel="preload"` for critical resources

#### Cache Policy (`uses-long-cache-ttl`)
**Issue:** 2 static assets without efficient cache policy

**Fix Required:**
Update `next.config.mjs` headers configuration for longer cache TTL.

---

## Detailed Reports

View full Lighthouse reports:
- [Homepage Report](https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1767828569066-14836.report.html)
- [Contacto Report](https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1767828569910-73890.report.html)
- [Bodas Report](https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1767828570803-91394.report.html)
- [Portfolio Report](https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1767828571786-40563.report.html)

---

## Priority Action Plan

### 🔴 Critical (Do First)
1. **Fix Console Errors** - Identify and fix all JavaScript errors
2. **Add Button Aria Labels** - All icon buttons need `aria-label`
3. **Fix Heading Hierarchy** - Ensure h1→h2→h3 sequential order
4. **Add Form Labels** - Bodas page contact form
5. **Fix Link Text** - Replace "click here" with descriptive text
6. **Fix Portfolio Canonical** - Add/fix canonical tag

### 🟡 High Priority
7. **Color Contrast Audit** - Ensure all text meets WCAG AA (4.5:1)
8. **Optimize Images** - Use proper `sizes` attribute on all `<Image>` components
9. **Fix LCP Lazy Loading** - Add `priority` to hero images
10. **Reduce Unused JS** - Code split and remove unused dependencies

### 🟢 Medium Priority
11. **Improve Speed Index** - Optimize critical rendering path
12. **Reduce DOM Size** - Simplify component structure
13. **Remove Legacy JavaScript** - Update build targets
14. **Fix bf-cache** - Remove unload listeners, optimize headers

---

## Testing After Fixes

```bash
# Run full audit again
npx lhci autorun

# Or test specific URL
npx lighthouse https://orbitaevents.com --view

# Test locally before deploying
pnpm build
pnpm start
npx lighthouse http://localhost:3000 --view
```

---

## References

- [Web Vitals](https://web.dev/vitals/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
