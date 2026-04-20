import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRecordEmailClick } = vi.hoisted(() => ({
  mockRecordEmailClick: vi.fn(),
}));

vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailClick: mockRecordEmailClick,
}));

import { GET } from '@/app/api/tracking/click/[token]/route';

describe('GET /api/tracking/click/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordEmailClick.mockResolvedValue(true);
  });

  it('redirigeix a la URL segura i registra el clic', async () => {
    const target = encodeURIComponent('https://orbitaevents.com/contacte');
    const response = await GET(
      new NextRequest(`http://localhost/api/tracking/click/tok-1?url=${target}`),
      { params: Promise.resolve({ token: 'tok-1' }) }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://orbitaevents.com/contacte');
    expect(mockRecordEmailClick).toHaveBeenCalledWith('tok-1');
  });

  it('redirigeix a / si falta la URL', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/tracking/click/tok-2'),
      { params: Promise.resolve({ token: 'tok-2' }) }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });

  it('bloqueja protocols insegurs', async () => {
    const target = encodeURIComponent('javascript:alert(1)');
    const response = await GET(
      new NextRequest(`http://localhost/api/tracking/click/tok-3?url=${target}`),
      { params: Promise.resolve({ token: 'tok-3' }) }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });
});
