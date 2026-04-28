import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  linkBookingToCustomer,
  previewBookingCustomerLink,
} from '@/lib/services/bookings/bookingCustomerLinkService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('previewBookingCustomerLink', () => {
  it('returns booking-not-found when booking does not exist', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    const result = await previewBookingCustomerLink('book-x');
    expect(result.kind).toBe('booking-not-found');
  });

  it('returns already-linked when booking has customerId + customer relation', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      customerId: 'c1',
      clientName: 'Joan',
      clientEmail: 'a@b.cat',
      clientPhone: null,
      customer: { id: 'c1', name: 'Joan', email: 'a@b.cat', phone: null },
    });
    const result = await previewBookingCustomerLink('b1');
    expect(result.kind).toBe('already-linked');
  });

  it('matches by email + name when both align (strong confidence)', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b2',
      customerId: null,
      clientName: 'Maria Puig',
      clientEmail: 'maria@x.cat',
      clientPhone: null,
      customer: null,
    });
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 'cust-strong',
        name: 'Maria Puig',
        email: 'maria@x.cat',
        phone: null,
        emailNormalized: 'maria@x.cat',
        phoneNormalized: null,
        nameNormalized: 'maria puig',
      },
    ]);
    const result = await previewBookingCustomerLink('b2');
    expect(result.kind).toBe('matches-found');
    if (result.kind !== 'matches-found') return;
    expect(result.matches[0].matchedBy).toEqual(['email', 'name']);
    expect(result.matches[0].confidence).toBe('strong');
  });

  it('returns no-match when email/phone/name absent (clientEmail buit, clientPhone null, clientName 2 chars)', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'b3',
      customerId: null,
      clientName: 'Jo',
      clientEmail: '',
      clientPhone: null,
      customer: null,
    });
    const result = await previewBookingCustomerLink('b3');
    expect(result.kind).toBe('no-match');
    expect(mockPrisma.customer.findMany).not.toHaveBeenCalled();
  });
});

describe('linkBookingToCustomer — link', () => {
  const baseBooking = {
    id: 'b-link',
    customerId: null,
    clientName: 'Joan',
    clientEmail: 'joan@x.cat',
    clientPhone: '612345678',
    preferredLocale: 'ca',
  };

  it('404 si booking missing', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    const result = await linkBookingToCustomer({
      bookingId: 'b-x',
      action: 'link',
      customerId: 'c1',
    });
    expect(result).toEqual({ ok: false, error: 'Reserva no trobada', status: 404 });
  });

  it('alreadyLinked sense tocar update', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...baseBooking, customerId: 'c1' });
    const result = await linkBookingToCustomer({
      bookingId: 'b-link',
      action: 'link',
      customerId: 'c1',
    });
    expect(result).toEqual({
      ok: true,
      customerId: 'c1',
      created: false,
      alreadyLinked: true,
    });
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
  });

  it('400 sense customerId', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    const result = await linkBookingToCustomer({ bookingId: 'b-link', action: 'link' });
    expect(result).toEqual({ ok: false, error: 'Cal customerId per vincular', status: 400 });
  });

  it('happy path: vincula i update booking', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c-target' });
    mockPrisma.booking.update.mockResolvedValue({});

    const result = await linkBookingToCustomer({
      bookingId: 'b-link',
      action: 'link',
      customerId: 'c-target',
    });

    expect(result).toEqual({
      ok: true,
      customerId: 'c-target',
      created: false,
      alreadyLinked: false,
    });
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'b-link' },
      data: { customerId: 'c-target' },
    });
  });
});

describe('linkBookingToCustomer — create', () => {
  const baseBooking = {
    id: 'b-create',
    customerId: null,
    clientName: 'Maria Puig',
    clientEmail: 'MARIA@X.CAT',
    clientPhone: '612 345 678',
    preferredLocale: 'es',
  };

  it('400 si clientEmail buit', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...baseBooking, clientEmail: '' });
    const result = await linkBookingToCustomer({ bookingId: 'b-create', action: 'create' });
    expect(result).toEqual({
      ok: false,
      error: 'La reserva no té email per crear un client nou',
      status: 400,
    });
  });

  it('409 si email ja existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'existing' });
    const result = await linkBookingToCustomer({ bookingId: 'b-create', action: 'create' });
    expect(result).toEqual({
      ok: false,
      error: 'Ja existeix un client amb aquest email. Cal vincular en lloc de crear.',
      status: 409,
    });
  });

  it('happy path: crea customer normalitzat i vincula', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(baseBooking);
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.customer.create.mockResolvedValue({ id: 'c-new' });
    mockPrisma.booking.update.mockResolvedValue({});

    const result = await linkBookingToCustomer({ bookingId: 'b-create', action: 'create' });

    expect(result).toEqual({
      ok: true,
      customerId: 'c-new',
      created: true,
      alreadyLinked: false,
    });
    const data = mockPrisma.customer.create.mock.calls[0][0].data;
    expect(data.email).toBe('maria@x.cat');
    expect(data.emailNormalized).toBe('maria@x.cat');
    expect(data.phoneNormalized).toBe('+34612345678');
    expect(data.preferredLocale).toBe('es');
    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'b-create' },
      data: { customerId: 'c-new' },
    });
  });
});
