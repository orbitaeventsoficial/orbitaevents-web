import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockListApprovedPublicTestimonials, mockSubmitPublicTestimonial } = vi.hoisted(() => ({
  mockListApprovedPublicTestimonials: vi.fn(),
  mockSubmitPublicTestimonial: vi.fn(),
}));

vi.mock('@/lib/services/publicTestimonialService', () => ({
  listApprovedPublicTestimonials: mockListApprovedPublicTestimonials,
  submitPublicTestimonial: mockSubmitPublicTestimonial,
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET, POST } from '@/app/api/testimonials/route';

function makePostRequest(body: unknown, acceptLanguage = 'ca') {
  return new NextRequest('http://localhost/api/testimonials', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept-language': acceptLanguage,
    },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(query = '', acceptLanguage = 'ca') {
  return new NextRequest(`http://localhost/api/testimonials${query}`, {
    headers: {
      'accept-language': acceptLanguage,
    },
  });
}

const validBody = {
  rating: 5,
  comment: 'Una experiencia molt bona amb tot molt ben preparat.',
  name: 'Laia Soler',
  email: 'laia@example.com',
  phone: '',
  photoUrl: '',
  videoUrl: '',
  allowGoogleShare: true,
  consentPhotoPublication: false,
  token: 'review-token-1',
  bookingRef: 'OE-2026-001',
};

describe('/api/testimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitPublicTestimonial.mockResolvedValue({
      discountCode: 'ORB-TEST',
      discountPercent: 10,
    });
    mockListApprovedPublicTestimonials.mockResolvedValue({
      testimonials: [],
      total: 0,
      hasMore: false,
    });
  });

  it('retorna 400 localitzat quan el body no valida', async () => {
    const response = await POST(makePostRequest({ ...validBody, rating: 9 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
    expect(body.details[0].path).toEqual(['rating']);
    expect(mockSubmitPublicTestimonial).not.toHaveBeenCalled();
  });

  it('envia el testimoni quan el body valida amb safeParse', async () => {
    const response = await POST(makePostRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.discountCode).toBe('ORB-TEST');
    expect(mockSubmitPublicTestimonial).toHaveBeenCalledWith({
      rating: 5,
      comment: validBody.comment,
      name: validBody.name,
      email: validBody.email,
      phone: '',
      photoUrl: undefined,
      videoUrl: undefined,
      allowGoogleShare: true,
      consentPhotoPublication: false,
      token: 'review-token-1',
      bookingRef: 'OE-2026-001',
    });
  });

  it('llista testimonis aprovats amb paginació pública', async () => {
    await GET(makeGetRequest('?limit=6&offset=12', 'en'));

    expect(mockListApprovedPublicTestimonials).toHaveBeenCalledWith(6, 12, 'en');
  });
});
