import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getPublicUrl: vi.fn((path: string) => `/api/uploads/${path}`),
  fileExists: vi.fn().mockResolvedValue(true),
}));

import {
  listHeroMedia,
  listActiveHeroMedia,
  addHeroMedia,
  removeHeroMedia,
  toggleHeroMedia,
  reorderHeroMedia,
  updateHeroMediaLabel,
} from '@/lib/services/heroVideoService';
import { uploadFile, deleteFile, fileExists } from '@/lib/storage';

const SETTING_KEY = 'config.heroMedia';

const sampleMedia = [
  { id: 'v1', url: '/videos/hero.mp4', type: 'video', label: 'Vídeo 1', active: true, sortOrder: 0 },
  { id: 'i1', url: '/img/foto.avif', type: 'image', label: 'Imatge 1', active: true, sortOrder: 1 },
  { id: 'i2', url: '/img/foto2.avif', type: 'image', label: 'Imatge 2', active: false, sortOrder: 2 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('listHeroMedia', () => {
  it('retorna defaults si no hi ha setting', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);
    const result = await listHeroMedia();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('type');
  });

  it('retorna media desada ordenada per sortOrder', async () => {
    const reversed = [...sampleMedia].reverse();
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(reversed),
    });
    const result = await listHeroMedia();
    expect(result[0].id).toBe('v1');
    expect(result[1].id).toBe('i1');
    expect(result[2].id).toBe('i2');
  });

  it('retorna defaults si JSON és invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: 'not-json',
    });
    const result = await listHeroMedia();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
  });
});

describe('listActiveHeroMedia', () => {
  it('filtra només els actius', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    const result = await listActiveHeroMedia();
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.active)).toBe(true);
  });

  it('retorna buit si cap és actiu', async () => {
    const allInactive = sampleMedia.map((m) => ({ ...m, active: false }));
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(allInactive),
    });
    const result = await listActiveHeroMedia();
    expect(result).toHaveLength(0);
  });
});

describe('addHeroMedia', () => {
  beforeEach(() => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
  });

  it('afegeix fitxer pujat (vídeo .mp4)', async () => {
    const result = await addHeroMedia({
      file: { buffer: Buffer.from('fake'), originalName: 'hero.mp4' },
      label: 'Vídeo nou',
    });
    expect(result.type).toBe('video');
    expect(result.label).toBe('Vídeo nou');
    expect(result.active).toBe(true);
    expect(result.sortOrder).toBe(3);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(1);
  });

  it('afegeix fitxer pujat (imatge .webp)', async () => {
    const result = await addHeroMedia({
      file: { buffer: Buffer.from('fake'), originalName: 'foto.webp' },
      label: 'Foto nova',
    });
    expect(result.type).toBe('image');
    expect(result.label).toBe('Foto nova');
  });

  it('afegeix URL externa (vídeo)', async () => {
    const result = await addHeroMedia({
      externalUrl: 'https://cdn.example.com/video.mp4',
      label: 'Extern',
    });
    expect(result.type).toBe('video');
    expect(result.url).toBe('https://cdn.example.com/video.mp4');
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('afegeix URL externa (imatge)', async () => {
    const result = await addHeroMedia({
      externalUrl: 'https://cdn.example.com/foto.jpg',
      label: 'Foto externa',
    });
    expect(result.type).toBe('image');
  });

  it('usa mediaType explicit si es proporciona', async () => {
    const result = await addHeroMedia({
      externalUrl: 'https://cdn.example.com/stream',
      label: 'Stream',
      mediaType: 'video',
    });
    expect(result.type).toBe('video');
  });

  it('error si no hi ha ni fitxer ni URL', async () => {
    await expect(addHeroMedia({ label: 'Res' })).rejects.toThrow('Cal un fitxer o una URL');
  });

  it('assigna label per defecte si no es proporciona', async () => {
    const result = await addHeroMedia({
      externalUrl: 'https://cdn.example.com/video.mp4',
      label: '',
    });
    expect(result.label).toBe('Vídeo');
  });
});

describe('removeHeroMedia', () => {
  it('elimina un element i reordena', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await removeHeroMedia('i1');
    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(1);
    const savedValue = JSON.parse(mockPrisma.setting.upsert.mock.calls[0][0].update.value);
    expect(savedValue).toHaveLength(2);
    expect(savedValue.find((m: any) => m.id === 'i1')).toBeUndefined();
    expect(savedValue[0].sortOrder).toBe(0);
    expect(savedValue[1].sortOrder).toBe(1);
  });

  it('no fa res si ID no existeix', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await removeHeroMedia('inexistent');
    expect(mockPrisma.setting.upsert).not.toHaveBeenCalled();
  });

  it('elimina fitxer local si URL comença per /api/uploads/hero/', async () => {
    const localMedia = [
      { id: 'local1', url: '/api/uploads/hero/file.mp4', type: 'video', label: 'Local', active: true, sortOrder: 0 },
    ];
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(localMedia),
    });
    await removeHeroMedia('local1');
    expect(fileExists).toHaveBeenCalled();
    expect(deleteFile).toHaveBeenCalled();
  });
});

describe('toggleHeroMedia', () => {
  it('desactiva un element actiu', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await toggleHeroMedia('v1');
    const savedValue = JSON.parse(mockPrisma.setting.upsert.mock.calls[0][0].update.value);
    const toggled = savedValue.find((m: any) => m.id === 'v1');
    expect(toggled.active).toBe(false);
  });

  it('activa un element inactiu', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await toggleHeroMedia('i2');
    const savedValue = JSON.parse(mockPrisma.setting.upsert.mock.calls[0][0].update.value);
    const toggled = savedValue.find((m: any) => m.id === 'i2');
    expect(toggled.active).toBe(true);
  });

  it('no fa res si ID no existeix', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await toggleHeroMedia('inexistent');
    expect(mockPrisma.setting.upsert).not.toHaveBeenCalled();
  });
});

describe('reorderHeroMedia', () => {
  it('reordena segons els IDs proporcionats', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await reorderHeroMedia(['i2', 'v1', 'i1']);
    const savedValue = JSON.parse(mockPrisma.setting.upsert.mock.calls[0][0].update.value);
    expect(savedValue[0].id).toBe('i2');
    expect(savedValue[0].sortOrder).toBe(0);
    expect(savedValue[1].id).toBe('v1');
    expect(savedValue[1].sortOrder).toBe(1);
    expect(savedValue[2].id).toBe('i1');
    expect(savedValue[2].sortOrder).toBe(2);
  });

  it('conserva elements no inclosos a la llista', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await reorderHeroMedia(['v1']);
    const savedValue = JSON.parse(mockPrisma.setting.upsert.mock.calls[0][0].update.value);
    expect(savedValue).toHaveLength(3);
    expect(savedValue[0].id).toBe('v1');
  });
});

describe('updateHeroMediaLabel', () => {
  it('actualitza el label d\'un element', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await updateHeroMediaLabel('v1', 'Nom nou');
    const savedValue = JSON.parse(mockPrisma.setting.upsert.mock.calls[0][0].update.value);
    const updated = savedValue.find((m: any) => m.id === 'v1');
    expect(updated.label).toBe('Nom nou');
  });

  it('no fa res si ID no existeix', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    await updateHeroMediaLabel('inexistent', 'Label');
    expect(mockPrisma.setting.upsert).not.toHaveBeenCalled();
  });
});
