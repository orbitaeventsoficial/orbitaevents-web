import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  getLeadViewsKey,
  sanitizeLeadSavedViews,
  getLeadSavedViews,
  saveLeadSavedViews,
  createLeadSavedView,
} from '@/lib/services/leadSavedViewsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('getLeadViewsKey', () => {
  it('retorna clau base sense user', () => {
    expect(getLeadViewsKey()).toBe('leads.views');
    expect(getLeadViewsKey(null)).toBe('leads.views');
  });

  it('retorna clau amb user', () => {
    expect(getLeadViewsKey('admin')).toBe('leads.views.admin');
  });
});

describe('sanitizeLeadSavedViews', () => {
  it('retorna [] per input invàlid', () => {
    expect(sanitizeLeadSavedViews(null)).toEqual([]);
    expect(sanitizeLeadSavedViews('string')).toEqual([]);
    expect(sanitizeLeadSavedViews(42)).toEqual([]);
  });

  it('sanititza vistes vàlides', () => {
    const input = [
      { id: 'v1', name: 'Test', query: 'status=NEW', createdAt: '2026-01-01' },
    ];
    const result = sanitizeLeadSavedViews(input);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
  });

  it('filtra vistes sense camps obligatoris', () => {
    const input = [
      { id: '', name: 'Test', query: 'q', createdAt: '2026' },
      { id: 'v1', name: '', query: 'q', createdAt: '2026' },
      { id: 'v1', name: 'Test', query: '', createdAt: '2026' },
    ];
    expect(sanitizeLeadSavedViews(input)).toEqual([]);
  });

  it('limita a 50 vistes', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: `v${i}`, name: `View ${i}`, query: 'q', createdAt: '2026',
    }));
    expect(sanitizeLeadSavedViews(many)).toHaveLength(50);
  });

  it('trunca noms a 80 chars', () => {
    const input = [{ id: 'v1', name: 'A'.repeat(100), query: 'q', createdAt: '2026' }];
    expect(sanitizeLeadSavedViews(input)[0].name).toHaveLength(80);
  });
});

describe('createLeadSavedView', () => {
  it('crea vista amb id únic', () => {
    const view = createLeadSavedView({ name: 'Test', query: 'status=NEW' });
    expect(view).not.toBeNull();
    expect(view!.id).toBeTruthy();
    expect(view!.name).toBe('Test');
    expect(view!.query).toBe('status=NEW');
    expect(view!.createdAt).toBeTruthy();
  });

  it('retorna null sense nom', () => {
    expect(createLeadSavedView({ name: '', query: 'q' })).toBeNull();
  });

  it('retorna null sense query', () => {
    expect(createLeadSavedView({ name: 'Test', query: '' })).toBeNull();
  });
});

describe('getLeadSavedViews', () => {
  it('retorna [] si no hi ha setting', async () => {
    expect(await getLeadSavedViews('leads.views')).toEqual([]);
  });

  it('retorna vistes des de BD', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify([{ id: 'v1', name: 'T', query: 'q', createdAt: '2026' }]),
    });
    const result = await getLeadSavedViews('leads.views');
    expect(result).toHaveLength(1);
  });
});

describe('saveLeadSavedViews', () => {
  it('guarda vistes sanititzades', async () => {
    const views = [{ id: 'v1', name: 'Test', query: 'q', createdAt: '2026' }];
    const result = await saveLeadSavedViews('leads.views', views);
    expect(result).toHaveLength(1);
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });
});
