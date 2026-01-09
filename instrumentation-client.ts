// instrumentation-client.ts
import { initBotId } from 'botid/client/core';
import * as Sentry from '@sentry/nextjs';

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