import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockWriteCache, mockReadCache, mockSaveCronRun, mockLog } = vi.hoisted(() => ({
  mockWriteCache: vi.fn(),
  mockReadCache: vi.fn(),
  mockSaveCronRun: vi.fn(),
  mockLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/services/googleReviewsCacheService', () => ({
  writeGoogleReviewsCache: mockWriteCache,
  readGoogleReviewsCache: mockReadCache,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRun,
}));
vi.mock('@/lib/logger', () => ({ log: mockLog }));

import { fetchFromSerpAPI, syncReviews } from '@/lib/services/reviewsSyncService';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const originalSerpKey = process.env.SERPAPI_KEY;
const originalPlaceId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SERPAPI_KEY = 'test-serp-key';
  process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID = 'ChIJtest123';
  mockWriteCache.mockResolvedValue(undefined);
  mockReadCache.mockResolvedValue(null);
  mockSaveCronRun.mockResolvedValue(undefined);
});

afterEach(() => {
  process.env.SERPAPI_KEY = originalSerpKey || '';
  process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID = originalPlaceId || '';
});

const serpApiKgResponse = {
  knowledge_graph: {
    rating: 4.8,
    review_count: 42,
  },
};

const serpApiReviewsResponse = {
  reviews: [
    {
      user: { name: 'Maria G.', thumbnail: 'https://photo.url/1.jpg' },
      rating: 5,
      snippet: 'Excel·lent servei!',
      iso_date: '2026-03-01T10:00:00Z',
      date: 'Fa 2 setmanes',
    },
    {
      user: { name: 'Joan P.' },
      rating: 4,
      text: 'Molt bona experiència',
      iso_date: '2026-02-15T08:00:00Z',
      date: 'Fa 1 mes',
    },
  ],
};

function setupFetchMocks(kgData: unknown = serpApiKgResponse, reviewsData: unknown = serpApiReviewsResponse) {
  // Paginació: reviewsData sense next_page_token = 1 sola pàgina
  mockFetch
    .mockResolvedValueOnce({ json: async () => kgData })
    .mockResolvedValueOnce({ json: async () => reviewsData });
}

function setupFetchMocksPaginated(kgData: unknown, pages: unknown[]) {
  mockFetch.mockResolvedValueOnce({ json: async () => kgData });
  for (const page of pages) {
    mockFetch.mockResolvedValueOnce({ json: async () => page });
  }
}

describe('fetchFromSerpAPI', () => {
  it('retorna null sense SERPAPI_KEY', async () => {
    delete process.env.SERPAPI_KEY;

    const result = await fetchFromSerpAPI();

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('retorna null si no hi ha knowledge_graph', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({}) });

    const result = await fetchFromSerpAPI();

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retorna dades correctes amb resposta exitosa', async () => {
    setupFetchMocks();

    const result = await fetchFromSerpAPI();

    expect(result).not.toBeNull();
    expect(result!.rating).toBe(4.8);
    expect(result!.total).toBe(42);
    expect(result!.reviews).toHaveLength(2);
    expect(result!.reviews[0]).toEqual(
      expect.objectContaining({
        author_name: 'Maria G.',
        rating: 5,
        text: 'Excel·lent servei!',
        relative_time_description: 'Fa 2 setmanes',
        profile_photo_url: 'https://photo.url/1.jpg',
      })
    );
    expect(result!.reviews[1].author_name).toBe('Joan P.');
    expect(result!.reviews[1].text).toBe('Molt bona experiència');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('usa review_count del knowledge_graph com a total', async () => {
    setupFetchMocks(
      { knowledge_graph: { rating: 4.5, review_count: 100 } },
      { reviews: [] }
    );

    const result = await fetchFromSerpAPI();

    expect(result!.total).toBe(100);
  });

  it('pagina múltiples pàgines de ressenyes', async () => {
    setupFetchMocksPaginated(
      serpApiKgResponse,
      [
        { reviews: [{ user: { name: 'A' }, rating: 5, snippet: 'Great', iso_date: '2026-03-01T10:00:00Z', date: 'recent' }], serpapi_pagination: { next_page_token: 'page2' } },
        { reviews: [{ user: { name: 'B' }, rating: 4, snippet: 'Good', iso_date: '2026-02-01T10:00:00Z', date: 'last month' }] },
      ]
    );

    const result = await fetchFromSerpAPI();

    expect(result!.reviews.length).toBeGreaterThanOrEqual(2);
    expect(mockFetch).toHaveBeenCalledTimes(3); // kg + 2 pages
  });

  it('merge amb ressenyes existents al cache', async () => {
    mockReadCache.mockResolvedValueOnce({
      reviews: [
        { author_name: 'Cached User', rating: 5, text: 'Old review', time: 1000, relative_time_description: 'Fa temps' },
      ],
    });
    setupFetchMocks(serpApiKgResponse, {
      reviews: [{ user: { name: 'New User' }, rating: 5, snippet: 'New!', iso_date: '2026-03-10T10:00:00Z', date: 'recent' }],
    });

    const result = await fetchFromSerpAPI();

    expect(result!.reviews.length).toBe(2);
    const names = result!.reviews.map(r => r.author_name);
    expect(names).toContain('Cached User');
    expect(names).toContain('New User');
  });

  it('gestiona ressenyes sense camps opcionals', async () => {
    setupFetchMocks(serpApiKgResponse, {
      reviews: [{ user: {}, rating: undefined, snippet: undefined }],
    });

    const result = await fetchFromSerpAPI();

    expect(result!.reviews[0].author_name).toBe('Anònim');
    expect(result!.reviews[0].rating).toBe(5);
    expect(result!.reviews[0].text).toBe('');
    expect(result!.reviews[0].relative_time_description).toBe('Recentment');
  });
});

describe('syncReviews', () => {
  it('crida writeGoogleReviewsCache amb dades correctes', async () => {
    setupFetchMocks();

    await syncReviews();

    expect(mockWriteCache).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 4.8,
        total: 42,
        reviews: expect.arrayContaining([
          expect.objectContaining({ author_name: 'Maria G.' }),
        ]),
      })
    );
  });

  it('guarda cron run status ok després de sincronitzar', async () => {
    setupFetchMocks();

    await syncReviews();

    expect(mockSaveCronRun).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'automation.reviewsSync',
        status: 'ok',
      })
    );
  });

  it('fa log.warn si fetchFromSerpAPI retorna null', async () => {
    delete process.env.SERPAPI_KEY;

    await syncReviews();

    expect(mockLog.warn).toHaveBeenCalled();
    expect(mockWriteCache).not.toHaveBeenCalled();
    expect(mockSaveCronRun).not.toHaveBeenCalled();
  });

  it('gestiona errors i guarda status error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await syncReviews();

    expect(mockLog.error).toHaveBeenCalled();
    expect(mockSaveCronRun).toHaveBeenCalledWith({
      prefix: 'automation.reviewsSync',
      status: 'error',
      summary: {},
      message: 'Network error',
    });
  });

  it('no llança excepció si saveCronRunStatus falla en catch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));
    mockSaveCronRun.mockRejectedValueOnce(new Error('DB down'));

    await expect(syncReviews()).resolves.toBeUndefined();
  });
});
