import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customerTestimonial: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    customerDiscountCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    booking: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customerActivity: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/customerActivityService', () => ({
  recordCustomerTestimonialSubmitted: vi.fn(),
}));

import {
  listApprovedPublicTestimonials,
  listApprovedDatabaseReviews,
  submitPublicTestimonial,
} from '@/lib/services/publicTestimonialService';
import { recordCustomerTestimonialSubmitted } from '@/lib/services/customerActivityService';

const MOCK_TESTIMONIALS = [
  {
    id: 'test-1',
    text: 'Gran festa!',
    rating: 5,
    photoUrl: 'photo.jpg',
    eventType: 'WEDDING',
    showName: true,
    showPhoto: true,
    isApproved: true,
    createdAt: new Date('2026-03-01'),
    customer: { name: 'Maria García' },
  },
  {
    id: 'test-2',
    text: 'Molt bé!',
    rating: 4,
    photoUrl: null,
    eventType: 'BIRTHDAY',
    showName: false,
    showPhoto: false,
    isApproved: true,
    createdAt: new Date('2026-02-15'),
    customer: { name: 'Joan Puig' },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customerTestimonial.findMany.mockResolvedValue(MOCK_TESTIMONIALS);
  mockPrisma.customerTestimonial.count.mockResolvedValue(2);
});

// ─────────────────────────────────────────────────────────────────────────
// listApprovedPublicTestimonials
// ─────────────────────────────────────────────────────────────────────────
describe('listApprovedPublicTestimonials', () => {
  it('retorna testimonis aprovats amb paginació', async () => {
    const result = await listApprovedPublicTestimonials(10, 0, 'ca');

    expect(result.testimonials).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('mostra nom real si showName=true', async () => {
    const result = await listApprovedPublicTestimonials(10, 0, 'ca');

    expect(result.testimonials[0].name).toBe('Maria García');
  });

  it('mostra "Client verificat" si showName=false (ca)', async () => {
    const result = await listApprovedPublicTestimonials(10, 0, 'ca');

    expect(result.testimonials[1].name).toBe('Client verificat');
  });

  it('mostra "Cliente verificado" si showName=false (es)', async () => {
    const result = await listApprovedPublicTestimonials(10, 0, 'es');

    expect(result.testimonials[1].name).toBe('Cliente verificado');
  });

  it('mostra "Verified customer" si showName=false (en)', async () => {
    const result = await listApprovedPublicTestimonials(10, 0, 'en');

    expect(result.testimonials[1].name).toBe('Verified customer');
  });

  it('mostra foto si showPhoto=true', async () => {
    const result = await listApprovedPublicTestimonials(10, 0, 'ca');

    expect(result.testimonials[0].photoUrl).toBe('photo.jpg');
    expect(result.testimonials[1].photoUrl).toBeNull();
  });

  it('hasMore=true si hi ha més elements', async () => {
    mockPrisma.customerTestimonial.count.mockResolvedValue(15);

    const result = await listApprovedPublicTestimonials(10, 0, 'ca');

    expect(result.hasMore).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// listApprovedDatabaseReviews
// ─────────────────────────────────────────────────────────────────────────
describe('listApprovedDatabaseReviews', () => {
  it('filtra emails @reviews.orbitaevents.com', async () => {
    mockPrisma.customerTestimonial.findMany.mockResolvedValue([
      {
        id: 'test-1',
        customer: { name: 'Real', email: 'real@gmail.com', source: 'web' },
      },
      {
        id: 'test-2',
        customer: { name: 'Fake', email: 'imported@reviews.orbitaevents.com', source: 'import' },
      },
    ]);

    const result = await listApprovedDatabaseReviews();

    expect(result).toHaveLength(1);
    expect(result[0].customer.name).toBe('Real');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// submitPublicTestimonial
// ─────────────────────────────────────────────────────────────────────────
describe('submitPublicTestimonial', () => {
  beforeEach(() => {
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 'cust-1' }),
        },
        customerTestimonial: {
          create: vi.fn().mockResolvedValue({ id: 'test-1' }),
          update: vi.fn().mockResolvedValue({}),
        },
        customerDiscountCode: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 'dc-1', code: 'OE-ABC123' }),
        },
        booking: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
        },
        customerActivity: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });
  });

  it('crea testimoni i retorna dades', async () => {
    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Increïble!',
      allowGoogleShare: false,
      consentPhotoPublication: true,
    });

    expect(result.testimonialId).toBe('test-1');
    expect(result.customerId).toBe('cust-1');
    expect(result.discountCode).toMatch(/^OE-[A-Z0-9]{6}$/);
  });

  it('descompte base 5% sense extras', async () => {
    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 4,
      comment: 'Bé!',
      allowGoogleShare: false,
      consentPhotoPublication: false,
    });

    expect(result.discountPercent).toBe(5);
  });

  it('descompte +5% amb foto', async () => {
    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Amb foto!',
      photoUrl: 'photo.jpg',
      allowGoogleShare: false,
      consentPhotoPublication: true,
    });

    expect(result.discountPercent).toBe(10); // 5 base + 5 foto
  });

  it('descompte +10% amb vídeo', async () => {
    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Amb vídeo!',
      videoUrl: 'video.mp4',
      allowGoogleShare: false,
      consentPhotoPublication: false,
    });

    expect(result.discountPercent).toBe(15); // 5 base + 10 vídeo
  });

  it('descompte +5% amb Google share', async () => {
    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Compartit!',
      allowGoogleShare: true,
      consentPhotoPublication: false,
    });

    expect(result.discountPercent).toBe(10); // 5 base + 5 google
  });

  it('descompte màxim amb tot (25%)', async () => {
    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Tot!',
      photoUrl: 'photo.jpg',
      videoUrl: 'video.mp4',
      allowGoogleShare: true,
      consentPhotoPublication: true,
    });

    expect(result.discountPercent).toBe(25); // 5 + 5 + 10 + 5
  });

  it('usa client existent si ja existeix', async () => {
    const existingCustomer = { id: 'existing-cust' };
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        customer: {
          findUnique: vi.fn().mockResolvedValue(existingCustomer),
          create: vi.fn(),
        },
        customerTestimonial: {
          create: vi.fn().mockResolvedValue({ id: 'test-2' }),
          update: vi.fn().mockResolvedValue({}),
        },
        customerDiscountCode: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 'dc-2', code: 'OE-ABC123' }),
        },
        booking: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
        },
        customerActivity: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Test',
      allowGoogleShare: false,
      consentPhotoPublication: false,
    });

    expect(result.customerId).toBe('existing-cust');
  });

  it('registra TESTIMONIAL_SUBMITTED via capa shared', async () => {
    await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Test',
      allowGoogleShare: false,
      consentPhotoPublication: false,
    });

    expect(recordCustomerTestimonialSubmitted).toHaveBeenCalledWith({
      customerId: 'cust-1',
      testimonialId: 'test-1',
      rating: 5,
      discountCode: expect.stringMatching(/^OE-[A-Z0-9]{6}$/),
      discountPercent: 5,
    }, expect.any(Object));
  });

  it('vincula el testimoni a la reserva del link public i marca reviewSubmittedAt', async () => {
    const tx = {
      customer: {
        findUnique: vi.fn().mockResolvedValue({ id: 'booking-customer' }),
        create: vi.fn(),
      },
      customerTestimonial: {
        create: vi.fn().mockResolvedValue({ id: 'test-booking' }),
        update: vi.fn().mockResolvedValue({}),
      },
      customerDiscountCode: {
        create: vi.fn().mockResolvedValue({ id: 'dc-booking', code: 'OE-LINKED' }),
      },
      booking: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'booking-1',
          customerId: 'booking-customer',
          eventType: 'WEDDING',
          eventDate: new Date('2026-05-01T18:00:00.000Z'),
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      customerActivity: { create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx));

    const result = await submitPublicTestimonial({
      name: 'Maria',
      email: 'maria@test.com',
      rating: 5,
      comment: 'Test vinculat',
      allowGoogleShare: false,
      consentPhotoPublication: false,
      token: 'tok-1',
      bookingRef: 'OE-2026-001',
    });

    expect(result.customerId).toBe('booking-customer');
    expect(tx.booking.findFirst).toHaveBeenCalledWith({
      where: { reference: 'OE-2026-001', reviewToken: 'tok-1' },
      select: { id: true, customerId: true, eventType: true, eventDate: true },
    });
    expect(tx.customerTestimonial.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'booking-customer',
        eventType: 'WEDDING',
        eventDate: new Date('2026-05-01T18:00:00.000Z'),
      }),
    });
    expect(tx.customerTestimonial.update).toHaveBeenCalledWith({
      where: { id: 'test-booking' },
      data: { discountCodeId: 'dc-booking' },
    });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: { reviewSubmittedAt: expect.any(Date) },
    });
  });
});
