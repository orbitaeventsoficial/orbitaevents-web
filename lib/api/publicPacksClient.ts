export type PublicPacksResponse = {
  ok: boolean;
  packs: unknown[];
};

export type FetchPublicPacksOptions = {
  service?: string;
  locale?: string;
};

export async function fetchPublicPacks(
  options: FetchPublicPacksOptions = {},
  init?: RequestInit,
): Promise<PublicPacksResponse> {
  const params = new URLSearchParams();
  if (options.service) params.set('service', options.service);
  if (options.locale) params.set('locale', options.locale);
  const qs = params.toString();
  const url = qs ? `/api/public/packs?${qs}` : '/api/public/packs';
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`public-packs fetch failed (${response.status})`);
  }
  return (await response.json()) as PublicPacksResponse;
}
