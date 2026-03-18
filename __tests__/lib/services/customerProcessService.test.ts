import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail, mockSendTestimonialEmail } = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    customerActivity: { create: vi.fn() },
    discountCode: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
  mockSendTestimonialEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
  sendTestimonialApprovedEmail: mockSendTestimonialEmail,
}));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { phone: '+34600000000' } },
}));
vi.mock('@/lib/site', () => ({
  getAppBaseUrl: () => 'https://test.orbita.events',
}));

import { startCustomerProcess } from '@/lib/services/customerProcessService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue(null);
  mockPrisma.customerActivity.create.mockResolvedValue({});
  mockPrisma.discountCode.create.mockResolvedValue({});
  mockSendEmail.mockResolvedValue({});
  mockSendTestimonialEmail.mockResolvedValue({});
});

describe('startCustomerProcess', () => {
  it('retorna 400 sense customerId', async () => {
    const result = await startCustomerProcess({ customerId: '', processType: 'welcome' });
    expect(result.status).toBe(400);
  });

  it('retorna 400 amb processType invàlid', async () => {
    const result = await startCustomerProcess({ customerId: 'c1', processType: 'invalid' });
    expect(result.status).toBe(400);
  });

  it('retorna 404 si client no existeix', async () => {
    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });
    expect(result.status).toBe(404);
  });

  it('envia email de benvinguda', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Maria', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(result.status).toBe(200);
    expect(result.body.processType).toBe('welcome');
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('envia review request', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Pau', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'review_request' });

    expect(result.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('post_event crea codi descompte i envia email', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Laura García', preferredLocale: 'es' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'post_event' });

    expect(result.status).toBe(200);
    expect(mockPrisma.discountCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PERCENTAGE',
        value: 10,
        sourceType: 'POST_EVENT',
      }),
    });
    expect(mockSendTestimonialEmail).toHaveBeenCalled();
  });

  it('promo crea codi 15% i envia email', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Anna', preferredLocale: 'ca' });

    const result = await startCustomerProcess({ customerId: 'c1', processType: 'promo' });

    expect(result.status).toBe(200);
    expect(mockPrisma.discountCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PERCENTAGE',
        value: 15,
        sourceType: 'PROMOTION',
      }),
    });
  });

  it('crea customerActivity després del procés', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1', email: 'test@test.com', name: 'Marc', preferredLocale: 'ca' });

    await startCustomerProcess({ customerId: 'c1', processType: 'welcome' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'c1',
        action: 'welcome',
      }),
    });
  });
});
