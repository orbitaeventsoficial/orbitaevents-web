export type PublicCoverageResponse = {
  ok: boolean;
  areas?: unknown[];
  cities?: unknown[];
  error?: string;
};

export async function fetchPublicCoverage(init?: RequestInit): Promise<PublicCoverageResponse> {
  const response = await fetch('/api/public/coverage', init);
  if (!response.ok) {
    throw new Error(`public-coverage fetch failed (${response.status})`);
  }
  return (await response.json()) as PublicCoverageResponse;
}
