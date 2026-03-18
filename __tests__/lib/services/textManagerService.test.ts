import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockReadFile } = vi.hoisted(() => ({
  mockPrisma: {
    translation: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockReadFile: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('fs', () => ({
  default: { promises: { readFile: mockReadFile } },
  promises: { readFile: mockReadFile },
}));

import {
  getTextManagerPayload,
  saveTextManagerModifications,
  runTextManagerAction,
} from '@/lib/services/textManagerService';

const esJson = JSON.stringify({ hero: { title: 'Hola', subtitle: 'Mundo' }, footer: { copy: '© 2026' } });
const caJson = JSON.stringify({ hero: { title: 'Hola', subtitle: 'Món' } });
const enJson = JSON.stringify({ hero: { title: 'Hello' } });

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.translation.findMany.mockResolvedValue([]);
  mockPrisma.translation.upsert.mockResolvedValue({});
  mockPrisma.$transaction.mockResolvedValue([]);

  mockReadFile.mockImplementation((filePath: string) => {
    if (filePath.includes('es.json')) return Promise.resolve(esJson);
    if (filePath.includes('ca.json')) return Promise.resolve(caJson);
    if (filePath.includes('en.json')) return Promise.resolve(enJson);
    return Promise.reject(new Error('not found'));
  });
});

describe('getTextManagerPayload', () => {
  it('retorna textos aplanats i stats', async () => {
    const result = await getTextManagerPayload();

    expect(result.ok).toBe(true);
    expect(result.es['hero.title']).toBe('Hola');
    expect(result.es['hero.subtitle']).toBe('Mundo');
    expect(result.es['footer.copy']).toBe('© 2026');
    expect(result.ca['hero.title']).toBe('Hola');
    expect(result.en['hero.title']).toBe('Hello');
    expect(result.stats.totalTexts).toBe(3); // es has 3 keys
    expect(result.stats.missingInCa).toBe(1); // footer.copy
    expect(result.stats.missingInEn).toBe(2); // hero.subtitle + footer.copy
  });

  it('merged DB overrides sobre fitxers base', async () => {
    mockPrisma.translation.findMany.mockResolvedValue([
      { namespace: 'hero', key: 'title', locale: 'es', value: 'Bienvenido' },
    ]);

    const result = await getTextManagerPayload();

    expect(result.es['hero.title']).toBe('Bienvenido');
  });

  it('gestiona fitxers JSON corruptes', async () => {
    mockReadFile.mockImplementation(() => Promise.reject(new Error('ENOENT')));

    const result = await getTextManagerPayload();

    expect(result.ok).toBe(true);
    expect(result.stats.totalTexts).toBe(0);
  });
});

describe('saveTextManagerModifications', () => {
  it('retorna 400 amb input invàlid', async () => {
    const result = await saveTextManagerModifications({ modifications: null as unknown as Record<string, string> });
    expect(result.ok).toBe(false);
  });

  it('retorna 400 sense canvis vàlids', async () => {
    const result = await saveTextManagerModifications({ modifications: {} });
    expect(result.ok).toBe(false);
  });

  it('desa modificacions amb upsert', async () => {
    const result = await saveTextManagerModifications({
      modifications: { 'hero.title': 'Nou títol', 'footer.copy': '© 2027' },
      locale: 'ca',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.body.updated).toBe(2);
    expect(result.body.locale).toBe('ca');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('usa locale es per defecte', async () => {
    const result = await saveTextManagerModifications({
      modifications: { 'hero.title': 'Hola' },
    });

    expect(result.body.locale).toBe('es');
  });
});

describe('runTextManagerAction', () => {
  it('sync retorna estadístiques de sincronització', async () => {
    const result = await runTextManagerAction('sync');

    expect(result.ok).toBe(true);
    expect(result.action).toBe('sync');
    expect(result).toHaveProperty('missingInCa');
    expect(result).toHaveProperty('missingInEn');
    expect(result).toHaveProperty('stats');
  });

  it('export retorna textos unflattenitzats', async () => {
    const result = await runTextManagerAction('export');

    expect(result.ok).toBe(true);
    expect(result.action).toBe('export');
    // L'estructura hauria de tenir hero.title nested
    const esData = (result as { es: Record<string, unknown> }).es;
    expect(esData).toHaveProperty('hero');
  });

  it('validate retorna ok', async () => {
    const result = await runTextManagerAction('validate');

    expect(result.ok).toBe(true);
    expect(result.action).toBe('validate');
  });

  it('restore retorna error', async () => {
    const result = await runTextManagerAction('restore');

    expect(result.ok).toBe(false);
  });

  it('acció desconeguda retorna error', async () => {
    const result = await runTextManagerAction('unknown');

    expect(result.ok).toBe(false);
  });
});
