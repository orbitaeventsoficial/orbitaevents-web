export type ImageManagerItem = {
  src?: string;
  alt?: string;
  caption?: string;
};

export type ImageManagerEntry = {
  item?: ImageManagerItem;
  items?: ImageManagerItem[];
};

export type ImageManagerResponse = {
  ok: boolean;
  data?: Record<string, ImageManagerEntry>;
};

// Coalesce concurrent requests for the same URL to avoid N parallel fetches
// when multiple components (e.g. HeaderChampion + Footer) ask for the same key.
// Only applies when no AbortSignal is present — each caller with a signal owns its request.
const _inflight = new Map<string, Promise<ImageManagerResponse>>();

export async function fetchImageManager(
  keys: string | string[],
  init?: RequestInit,
): Promise<ImageManagerResponse> {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const params = new URLSearchParams();
  for (const key of keyList) {
    params.append('key', key);
  }
  const url = `/api/public/image-manager?${params.toString()}`;

  if (!init?.signal) {
    const existing = _inflight.get(url);
    if (existing) return existing;
  }

  const promise = fetch(url, init)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`image-manager fetch failed (${response.status})`);
      }
      return (await response.json()) as ImageManagerResponse;
    })
    .finally(() => {
      _inflight.delete(url);
    });

  if (!init?.signal) {
    _inflight.set(url, promise);
  }

  return promise;
}
