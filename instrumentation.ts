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

async function startCronScheduler() {
  // Esperar 60s perquè el servidor estigui completament llest
  await new Promise((resolve) => setTimeout(resolve, 60_000));

  // ── Imports dinàmics (opacs per webpack — evitar bundle nodemailer) ───
  const imp = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
  const { syncReviews } = await imp('@/lib/services/reviewsSyncService');
  const { runCommercialDailyAutomation } = await imp('@/lib/services/commercialDailyAutomationService');
  const { listPendingPostEventBookings, sendPostEventEmailForBooking } = await imp('@/lib/services/postEventDispatchService');
  const { runFuelDailyRefresh } = await imp('@/lib/services/fuelReferenceService');
  const { runInvoiceSyncCron } = await imp('@/lib/services/invoiceService');
  const { runPackPricingCheck } = await imp('@/lib/services/packPricingCheckService');
  const { saveCronRunStatus } = await imp('@/lib/services/cronRunStatusService');

  // ── Post-event dispatch (mateixa lògica que la ruta cron) ──────────────
  async function runPostEventDispatch() {
    const bookings = await listPendingPostEventBookings();
    const BATCH_SIZE = 5;
    let sent = 0, skipped = 0, errors = 0;

    for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
      const batch = bookings.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (b: { id: string }) => {
          try {
            return await sendPostEventEmailForBooking(b.id);
          } catch {
            return { status: 'error' as const };
          }
        })
      );
      for (const r of results) {
        if (r.status === 'sent') sent++;
        else if (r.status === 'skipped') skipped++;
        else errors++;
      }
    }

    await saveCronRunStatus({
      prefix: 'automation.postEvent',
      status: errors > 0 ? 'error' : 'ok',
      summary: { processed: bookings.length, sent, skipped, errors },
    });
  }

  // ── Primera execució (escalonada per no saturar) ───────────────────────
  console.log('[scheduler] Executant primera ronda de crons...');
  await runSafe('reviews-sync', syncReviews);
  await runSafe('commercial-daily', runCommercialDailyAutomation);
  await runSafe('post-event', runPostEventDispatch);
  await runSafe('fuel-daily', runFuelDailyRefresh);
  await runSafe('invoice-sync', runInvoiceSyncCron);
  await runSafe('pack-pricing-check', runPackPricingCheck);
  console.log('[scheduler] Primera ronda completada.');

  // ── Intervals recurrents ───────────────────────────────────────────────
  // Cada 12h: reviews, post-event, invoice-sync
  setInterval(() => {
    runSafe('reviews-sync', syncReviews);
    runSafe('post-event', runPostEventDispatch);
    runSafe('invoice-sync', runInvoiceSyncCron);
  }, TWELVE_HOURS);

  // Cada 24h: commercial-daily, fuel, pack-pricing
  setInterval(() => {
    runSafe('commercial-daily', runCommercialDailyAutomation);
    runSafe('fuel-daily', runFuelDailyRefresh);
    runSafe('pack-pricing-check', runPackPricingCheck);
  }, TWENTY_FOUR_HOURS);

  console.log('[scheduler] Crons programats: 12h (reviews, post-event, invoice) + 24h (commercial, fuel, pack-pricing)');
}

async function autoSeedBlog() {
  try {
    // Esperar 30s i comprovar si hi ha posts
    await new Promise((resolve) => setTimeout(resolve, 30_000));

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const count = await prisma.blogPost.count();
      if (count === 0) {
        console.log('[auto-seed] No hi ha blog posts, executant seed...');
        const { seedBlog } = await import('./prisma/seed-blog');
        await seedBlog();
        console.log('[auto-seed] ✅ Blog seed completat');
      } else {
        console.log(`[auto-seed] Blog ja té ${count} posts, saltant seed.`);
      }
    } finally {
      await prisma.$disconnect();
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
