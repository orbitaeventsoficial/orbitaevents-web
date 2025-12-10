// instrumentation-client.ts
import { initBotId } from 'botid/client/core';

// RUTAS A PROTEGER (API + Server Actions)
initBotId({
  protect: [
    { path: '/api/checkout', method: 'POST' },
    { path: '/api/reserva', method: 'POST' },
    { path: '/api/packs/*', method: 'POST' }, // Wildcard: cualquier pack
    { path: '/actions/reservar', method: 'POST' }, // Server Action
  ],
});