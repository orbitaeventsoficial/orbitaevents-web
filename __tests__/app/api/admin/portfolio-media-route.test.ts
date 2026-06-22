import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockAddPortfolioMedia,
  mockDeletePortfolioMedia,
  mockDetectMediaType,
  mockIsValidSlug,
  mockListPortfolioMedia,
  mockUpdatePortfolioMedia,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockAddPortfolioMedia: vi.fn(),
  mockDeletePortfolioMedia: vi.fn(),
  mockDetectMediaType: vi.fn(),
  mockIsValidSlug: vi.fn(),
  mockListPortfolioMedia: vi.fn(),
  mockUpdatePortfolioMedia: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/portfolioMediaService', () => ({
  addPortfolioMedia: mockAddPortfolioMedia,
  deletePortfolioMedia: mockDeletePortfolioMedia,
  detectMediaType: mockDetectMediaType,
  isValidSlug: mockIsValidSlug,
  listPortfolioMedia: mockListPortfolioMedia,
  updatePortfolioMedia: mockUpdatePortfolioMedia,
}));
vi.mock('@/lib/constants/portfolio-media', () => ({
  PORTFOLIO_MEDIA_IMAGE_MAX_SIZE: 5 * 1024 * 1024,
  PORTFOLIO_MEDIA_VIDEO_MAX_SIZE: 50 * 1024 * 1024,
}));

import { DELETE, GET, PATCH, POST } from '@/app/api/admin/portfolio/media/route';

function makePostReq() {
  return new NextRequest('http://localhost/api/admin/portfolio/media', {
    method: 'POST',
  });
}

function makeUploadReq() {
  const file = {
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
    name: 'foto.jpg',
    size: 10,
    type: 'image/jpeg',
  };
  const formData = {
    get: vi.fn((key: string) => {
      if (key === 'file') return file;
      if (key === 'slug') return 'bodas';
      if (key === 'caption') return 'Pista plena';
      return null;
    }),
  };
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
}

function makePatchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/portfolio/media', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/portfolio/media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockAddPortfolioMedia.mockResolvedValue({ id: 'media-1' });
    mockDeletePortfolioMedia.mockResolvedValue(undefined);
    mockDetectMediaType.mockReturnValue('image');
    mockIsValidSlug.mockReturnValue(true);
    mockListPortfolioMedia.mockResolvedValue([{ id: 'media-1' }]);
    mockUpdatePortfolioMedia.mockResolvedValue({ id: 'media-1', caption: 'Nova' });
  });

  it('llista media sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/portfolio/media?slug=bodas'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListPortfolioMedia).toHaveBeenCalledWith('bodas');
    await expect(res.json()).resolves.toEqual({ data: [{ id: 'media-1' }] });
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq());

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockAddPortfolioMedia).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir formData en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq();

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockAddPortfolioMedia).not.toHaveBeenCalled();
  });

  it('puja media amb CSRF valid', async () => {
    const res = await POST(makeUploadReq());

    expect(res.status).toBe(201);
    expect(mockAddPortfolioMedia).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'bodas',
      fileName: 'foto.jpg',
      mimeType: 'image/jpeg',
      caption: 'Pista plena',
      uploadedBy: 'ADMIN',
    }));
    await expect(res.json()).resolves.toEqual({ data: { id: 'media-1' } });
  });

  it('rebutja CSRF abans de llegir body en PATCH', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePatchReq({ mediaId: 'media-1', caption: 'Nova' });

    const res = await PATCH(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdatePortfolioMedia).not.toHaveBeenCalled();
  });

  it('actualitza media amb CSRF valid', async () => {
    const res = await PATCH(makePatchReq({ mediaId: 'media-1', caption: 'Nova', sortOrder: 2 }));

    expect(res.status).toBe(200);
    expect(mockUpdatePortfolioMedia).toHaveBeenCalledWith('media-1', {
      caption: 'Nova',
      sortOrder: 2,
    });
    await expect(res.json()).resolves.toEqual({ data: { id: 'media-1', caption: 'Nova' } });
  });

  it('rebutja CSRF abans de llegir query en DELETE', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/portfolio/media?mediaId=media-1', { method: 'DELETE' });

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDeletePortfolioMedia).not.toHaveBeenCalled();
  });

  it('elimina media amb CSRF valid', async () => {
    const res = await DELETE(new NextRequest('http://localhost/api/admin/portfolio/media?mediaId=media-1', { method: 'DELETE' }));

    expect(res.status).toBe(200);
    expect(mockDeletePortfolioMedia).toHaveBeenCalledWith('media-1');
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
