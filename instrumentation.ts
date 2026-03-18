import * as Sentry from '@sentry/nextjs';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

async function startCronScheduler() {
  // Esperar 60s perquè el servidor estigui completament llest
  await new Promise((resolve) => setTimeout(resolve, 60_000));

  const { syncReviews } = await import('@/lib/services/reviewsSyncService');

  const runAll = async () => {
    try {
      await syncReviews();
    } catch (e) {
      console.error('[scheduler] Error executant crons:', e);
    }
  };

  // Primera execució
  await runAll();
  // Repetir cada 12h
  setInterval(runAll, TWELVE_HOURS);
  console.log('[scheduler] Crons programats cada 12h (reviews-sync)');
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Iniciar scheduler de crons en producció
    if (process.env.NODE_ENV === 'production') {
      startCronScheduler().catch((e) =>
        console.error('[scheduler] Error iniciant scheduler:', e)
      );
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
