export type CompatibleExtraLike = {
  compatibleWith?: string[];
  enabled?: boolean;
};

export function isExtraCompatibleWithService(extra: CompatibleExtraLike, service: string): boolean {
  if (!extra.compatibleWith) return true;
  if (extra.compatibleWith.length === 0) return false;
  return extra.compatibleWith.includes(service);
}

export function filterCompatibleExtras<T extends CompatibleExtraLike>(extras: T[], service: string): T[] {
  return extras.filter(
    (extra) => extra.enabled !== false && isExtraCompatibleWithService(extra, service)
  );
}
