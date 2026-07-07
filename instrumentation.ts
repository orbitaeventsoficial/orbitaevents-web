import * as Sentry from '@sentry/nextjs';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULER AUTOMÀTIC — Tots els crons de producció
// ═══════════════════════════════════════════════════════════════════════════

const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

async function runSafe(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`[scheduler] ✅ ${name} completat`);
  } catch (e) {
    console.error(`[scheduler] ❌ ${name} error:`, e);
  }
}

const CRON_ENDPOINTS = {
  reviewsSync: '/api/cron/reviews-sync',
  commercialDaily: '/api/cron/commercial-daily',
  postEvent: '/api/cron/post-event',
  fuelDaily: '/api/cron/fuel-daily',
  invoiceSync: '/api/cron/invoice-sync',
  packPricingCheck: '/api/cron/pack-pricing-check',
} as const;

function getSchedulerBaseUrl() {
  const explicitUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    process.env.SITE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined);

  return (explicitUrl || 'https://orbitaevents.com').replace(/\/$/, '');
}

async function runCronEndpoint(name: string, path: string) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error('CRON_SECRET no configurat per scheduler');
  }

  const response = await fetch(`${getSchedulerBaseUrl()}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${cronSecret}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${name} HTTP ${response.status}: ${detail.slice(0, 240)}`);
  }
}

async function startCronScheduler() {
  // Esperar 60s perquè el servidor estigui completament llest
  await new Promise((resolve) => setTimeout(resolve, 60_000));

  const runSchedulerCron = (name: string, path: string) => runCronEndpoint(name, path);

  // ── Primera execució (escalonada per no saturar) ───────────────────────
  console.log('[scheduler] Executant primera ronda de crons...');
  await runSafe('reviews-sync', () => runSchedulerCron('reviews-sync', CRON_ENDPOINTS.reviewsSync));
  await runSafe('commercial-daily', () => runSchedulerCron('commercial-daily', CRON_ENDPOINTS.commercialDaily));
  await runSafe('post-event', () => runSchedulerCron('post-event', CRON_ENDPOINTS.postEvent));
  await runSafe('fuel-daily', () => runSchedulerCron('fuel-daily', CRON_ENDPOINTS.fuelDaily));
  await runSafe('invoice-sync', () => runSchedulerCron('invoice-sync', CRON_ENDPOINTS.invoiceSync));
  await runSafe('pack-pricing-check', () => runSchedulerCron('pack-pricing-check', CRON_ENDPOINTS.packPricingCheck));
  console.log('[scheduler] Primera ronda completada.');

  // ── Intervals recurrents ───────────────────────────────────────────────
  // Cada 12h: reviews, post-event, invoice-sync
  setInterval(() => {
    runSafe('reviews-sync', () => runSchedulerCron('reviews-sync', CRON_ENDPOINTS.reviewsSync));
    runSafe('post-event', () => runSchedulerCron('post-event', CRON_ENDPOINTS.postEvent));
    runSafe('invoice-sync', () => runSchedulerCron('invoice-sync', CRON_ENDPOINTS.invoiceSync));
  }, TWELVE_HOURS);

  // Cada 24h: commercial-daily, fuel, pack-pricing
  setInterval(() => {
    runSafe('commercial-daily', () => runSchedulerCron('commercial-daily', CRON_ENDPOINTS.commercialDaily));
    runSafe('fuel-daily', () => runSchedulerCron('fuel-daily', CRON_ENDPOINTS.fuelDaily));
    runSafe('pack-pricing-check', () => runSchedulerCron('pack-pricing-check', CRON_ENDPOINTS.packPricingCheck));
  }, TWENTY_FOUR_HOURS);

  console.log('[scheduler] Crons programats: 12h (reviews, post-event, invoice) + 24h (commercial, fuel, pack-pricing)');
}

async function autoSeedBlog() {
  try {
    // Esperar 30s i comprovar si hi ha posts
    await new Promise((resolve) => setTimeout(resolve, 30_000));

    const { prisma } = await import('@/lib/prisma');

    const count = await prisma.blogPost.count();
    if (count === 0) {
      console.log('[auto-seed] No hi ha blog posts, executant seed...');
      const { seedBlog } = await import('./prisma/seed-blog');
      await seedBlog();
      console.log('[auto-seed] ✅ Blog seed completat');
    } else {
      console.log(`[auto-seed] Blog ja té ${count} posts, saltant seed.`);
    }
  } catch (e) {
    console.error('[auto-seed] Error:', e);
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Iniciar scheduler + auto-seed en producció
    if (process.env.NODE_ENV === 'production') {
      startCronScheduler().catch((e) =>
        console.error('[scheduler] Error iniciant scheduler:', e)
      );
      autoSeedBlog().catch((e) =>
        console.error('[auto-seed] Error:', e)
      );
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
