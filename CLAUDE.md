# CLAUDE.md - Òrbita Events

## Project Overview

**Òrbita Events** is a professional DJ and events company website built with Next.js 14. The site serves customers in Barcelona and Girona (Catalonia, Spain), offering DJ services for weddings, corporate events, private parties, and themed events.

**Production URL:** https://orbitaevents.com

## Tech Stack

- **Framework:** Next.js 14.2.0 (App Router)
- **Language:** TypeScript 5.4.5
- **Styling:** Tailwind CSS 3.4.3
- **Database:** PostgreSQL via Prisma ORM 5.22.0
- **Storage:** Supabase Storage (media uploads)
- **Deployment:** Vercel
- **i18n:** next-intl (Catalan `ca` + Spanish `es`)
- **Email:** SendGrid + Nodemailer
- **UI Libraries:** Framer Motion, Headless UI, Radix UI, Lucide React

## Project Structure

```
/
├── app/
│   ├── [locale]/          # i18n routes (ca/es)
│   ├── admin/             # Admin dashboard (protected)
│   ├── api/               # API routes
│   │   ├── admin/         # Protected admin APIs
│   │   ├── contact/       # Contact form
│   │   ├── health/        # Health check endpoint
│   │   ├── testimonials/  # Public testimonials
│   │   └── upload/        # Media upload to Supabase
│   ├── components/        # App-specific components
│   ├── config/            # App configuration
│   ├── constants/         # Constants and enums
│   └── types/             # TypeScript types
├── components/
│   └── mobile/            # Mobile-specific components
├── lib/
│   ├── services/          # Business logic services
│   ├── seo/               # SEO utilities
│   ├── utils/             # Utility functions
│   ├── auth.ts            # Authentication helpers
│   ├── email.ts           # Email templates & sending
│   ├── logger.ts          # Structured logging
│   ├── prisma.ts          # Prisma client
│   ├── rate-limit.ts      # Rate limiting
│   └── supabase.ts        # Supabase client
├── messages/              # i18n translations
│   ├── ca.json            # Catalan
│   └── es.json            # Spanish
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed data
├── public/
│   ├── img/               # Images and portfolio
│   ├── images/            # Additional images
│   └── video/             # Video assets
└── scripts/               # Build and utility scripts
```

## Commands

```bash
# Development
pnpm dev                   # Start dev server

# Build (runs pre-build scripts automatically)
pnpm build                 # Full production build

# Database
pnpm db:push               # Push schema to database
pnpm db:seed               # Seed database
pnpm db:reset              # Reset and reseed database

# Utilities
pnpm lint                  # Run ESLint
pnpm health                # Check production health endpoint
pnpm monitor               # Run monitoring script
```

## Environment Variables

Required variables for production:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://...

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Admin Authentication
ADMIN_USER=...
ADMIN_PASS=...             # Minimum 16 characters

# Email (SendGrid)
SENDGRID_API_KEY=...
EMAIL_FROM=...
EMAIL_TO=...

# Security (CRITICAL)
CSRF_SECRET=...            # Minimum 32 characters (generate: openssl rand -hex 32)

# Cloudflare Turnstile (Anti-spam/bot protection)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# Rate Limiting (Optional - uses in-memory fallback if not set)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Key Architectural Decisions

### i18n Strategy
- Default locale: Spanish (`es`) - served without URL prefix
- Catalan (`ca`) - served with `/ca/` prefix
- Language preference stored in `NEXT_LOCALE` cookie
- Translations in `/messages/*.json`

### Admin Authentication
- Basic HTTP authentication via middleware
- Protected paths: `/admin/*` and `/api/admin/*`
- Credentials from environment variables (never hardcoded)

### Media Upload
- Direct upload to Supabase Storage (bypasses Vercel's 4.5MB limit)
- Bucket name: `media`
- Public access for portfolio images

### Database Schema Highlights
- **Customer CRM:** Unified customer records with GDPR compliance
- **Lead Management:** Full lead pipeline with status tracking
- **Booking System:** Complete booking workflow with inventory
- **Packs & Extras:** Configurable service packages with translations
- **GDPR/LOPDGDD:** Consent records, data requests, privacy audit logs

## Development Guidelines

### Code Style
- Use TypeScript strictly
- Follow existing patterns in the codebase
- Components use functional style with hooks
- API routes use Next.js App Router conventions

### Translations
- All user-facing text must be in translation files
- Use `useTranslations` hook from next-intl
- Keys are namespaced (e.g., `hero.title`, `contact.form.name`)

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `pnpm db:push` to update database
3. Update seed data if needed in `prisma/seed.ts`

### Adding New Pages
1. Create route in `app/[locale]/your-page/page.tsx`
2. Add translations to `messages/es.json` and `messages/ca.json`
3. Update sitemap in `app/sitemap.ts` if needed

## Build Process

The build command runs these scripts in order:
1. `normalize:filenames` - Normalizes file names in public/
2. `rename:portfolio` - Renames portfolio images
3. `generate:portfolio` - Generates portfolio configuration
4. `next build` - Next.js production build

## Important Notes

- **Supabase null handling:** Clients return null when not configured, allowing builds without env vars
- **Portfolio images:** Must follow naming convention in `/public/img/portfolio/[category]/`
- **Rate limiting:** API routes implement rate limiting for abuse prevention
- **Structured logging:** Use `lib/logger.ts` for consistent logging format
