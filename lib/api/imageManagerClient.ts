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
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`image-manager fetch failed (${response.status})`);
  }
  return (await response.json()) as ImageManagerResponse;
}
