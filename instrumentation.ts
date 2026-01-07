export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (
  err: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  }
) => {
  // This will be called for all errors in production
  // You can customize error reporting here
  console.error('[Instrumentation Error]', {
    error: err.message,
    digest: err.digest,
    path: request.path,
    method: request.method,
  });
};
