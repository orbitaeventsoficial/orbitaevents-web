import { useCallback, useState } from 'react';

interface UseAsyncFormOptions {
  initialError?: string | null;
  initialSuccess?: string | null;
}

export function useAsyncForm(options: UseAsyncFormOptions = {}) {
  const { initialError = null, initialSuccess = null } = options;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(initialSuccess);

  const reset = useCallback(() => {
    setSubmitting(false);
    setError(initialError);
    setSuccess(initialSuccess);
  }, [initialError, initialSuccess]);

  const run = useCallback(async <T,>(task: () => Promise<T>) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      return await task();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperat';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    error,
    success,
    setError,
    setSuccess,
    reset,
    run,
  };
}
