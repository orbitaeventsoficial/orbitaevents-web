export async function register() {
  return;
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
