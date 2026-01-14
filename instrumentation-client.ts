// instrumentation-client.ts
import { initBotId } from 'botid/client/core';
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  enabled: process.env.NODE_ENV === 'production',
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('Network request failed')
      ) {
        return null;
      }
    }
    return event;
  },
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',
});

// Sentry router instrumentation (required for navigation tracking)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// RUTAS A PROTEGER (API + Server Actions)
initBotId({
  protect: [
    { path: '/api/checkout', method: 'POST' },
    { path: '/api/reserva', method: 'POST' },
    { path: '/api/packs/*', method: 'POST' }, // Wildcard: cualquier pack
    { path: '/actions/reservar', method: 'POST' }, // Server Action
  ],
});
