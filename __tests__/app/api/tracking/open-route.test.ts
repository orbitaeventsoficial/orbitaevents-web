import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRecordEmailOpen, mockTrackingPixelGif } = vi.hoisted(() => ({
  mockRecordEmailOpen: vi.fn(),
  mockTrackingPixelGif: Buffer.from('GIF89a', 'ascii'),
}));

vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailOpen: mockRecordEmailOpen,
  TRACKING_PIXEL_GIF: mockTrackingPixelGif,
}));

import { GET } from '@/app/api/tracking/open/[token]/route';

describe('GET /api/tracking/open/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordEmailOpen.mockResolvedValue(true);
  });

  it('retorna el pixel GIF i dispara el registre d’obertura', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/tracking/open/tok-123'),
      { params: Promise.resolve({ token: 'tok-123' }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/gif');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(mockRecordEmailOpen).toHaveBeenCalledWith('tok-123');
  });
});
