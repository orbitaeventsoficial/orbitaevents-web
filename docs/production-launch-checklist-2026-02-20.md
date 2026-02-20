# Production Launch Checklist (2026-02-20)

## Objective
Close the remaining gap between "technical complete" and "operationally complete".

## 1) Monitoring
- Set `SENTRY_DSN` in production.
- Set `NEXT_PUBLIC_SENTRY_DSN` in production.
- Set `SENTRY_ORG` and `SENTRY_PROJECT` in production.
- Verify `/api/health` returns `checks.sentry.status = "pass"`.

## 2) Build and Quality Gates
- Run `npx tsc --noEmit`.
- Run `npm run build` (or `SKIP_ASSET_SCRIPTS=1 npm run build` in CI).
- Run `npx playwright test e2e/api.spec.ts --project=chromium`.
- Run `npx playwright test e2e/seo.spec.ts --project=chromium`.

## 3) Content Pipeline (Commercial SEO)
- Publish 2 real blog posts/week from `docs/seo/editorial-calendar-q1-2026.md`.
- Publish 1 real portfolio case/week using `docs/seo/case-study-template.md`.
- Each post must link to:
  - 1 service page
  - 1 portfolio page
  - 1 conversion CTA (`/contacto` or `/configurador`)

## 4) Asset Discipline
- Upload only real media with consent and event facts.
- Keep filenames normalized in `public/img/portfolio/*`.
- Regenerate config after asset updates:
  - `npm run generate:portfolio`

## 5) Weekly Operating Loop
- Monday: publish content.
- Tuesday: validate Search Console query movement.
- Wednesday: refresh one money page (`/servicios/*`).
- Friday: run monitor script and verify health:
  - `npm run monitor`

## Exit Criteria
- Monitoring green (Sentry + health pass).
- All quality gates green.
- Content cadence running for at least 4 consecutive weeks.
