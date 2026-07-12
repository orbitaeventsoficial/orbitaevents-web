export type CoverageAreaMutationAction = 'remove' | 'toggle';
export type CoverageAreaMutationKey = `${CoverageAreaMutationAction}:${string}`;

export function readCoverageApiError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error.trim()) return record.error;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
  }

  return fallback;
}

export function getCoverageAreaMutationKey(
  action: CoverageAreaMutationAction,
  city: string,
): CoverageAreaMutationKey {
  return `${action}:${city}`;
}

export function isCoverageAreaMutationPending(
  pendingKey: CoverageAreaMutationKey | null,
  action: CoverageAreaMutationAction,
  city: string,
): boolean {
  return pendingKey === getCoverageAreaMutationKey(action, city);
}
