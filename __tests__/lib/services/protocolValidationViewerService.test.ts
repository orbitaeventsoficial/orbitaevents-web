import { describe, expect, it } from 'vitest';
import {
  describeProtocolValidationEmptyState,
  describeProtocolValidationFilter,
  describeProtocolPendingShortcut,
  describeProtocolValidationResults,
  describeProtocolSectionResults,
  filterProtocolCanvisByValidation,
  findFirstPendingProtocolCanvi,
  normalizeProtocolValidationFilter,
  shouldAutoOpenProtocolCanvi,
  summarizeProtocolValidationFilterCounts,
  summarizeProtocolValidationProgress,
} from '@/lib/services/protocolValidationViewerService';
import type { ProtocolCanviMeta } from '@/lib/services/protocolCanvisService';
import type { CanviValidationsMap } from '@/lib/services/protocolValidationsService';

const canvis: ProtocolCanviMeta[] = [
  {
    n: 467,
    date: '2026-05-01',
    author: 'codex',
    status: 'FET',
    headline: 'Viewer amb validació humana',
    body: 'Body 467',
    anchorId: 'canvi-467',
  },
  {
    n: 466,
    date: '2026-05-01',
    author: 'codex',
    status: 'FET',
    headline: 'Route de validacions',
    body: 'Body 466',
    anchorId: 'canvi-466',
  },
];

describe('normalizeProtocolValidationFilter', () => {
  it('accepta validated i pending', () => {
    expect(normalizeProtocolValidationFilter('validated')).toBe('validated');
    expect(normalizeProtocolValidationFilter('pending')).toBe('pending');
  });

  it('fa fallback a all per valors buits o desconeguts', () => {
    expect(normalizeProtocolValidationFilter(undefined)).toBe('all');
    expect(normalizeProtocolValidationFilter(null)).toBe('all');
    expect(normalizeProtocolValidationFilter('weird')).toBe('all');
  });
});

describe('filterProtocolCanvisByValidation', () => {
  const validations: CanviValidationsMap = new Map([
    [467, { canviN: 467, validatedAt: '2026-05-01T10:00:00.000Z', validatedBy: 'OWNER' }],
  ]);

  it('retorna tots els canvis si el filtre és all', () => {
    expect(filterProtocolCanvisByValidation(canvis, validations, 'all').map((item) => item.n)).toEqual([466, 467]);
  });

  it('retorna només els validats', () => {
    expect(filterProtocolCanvisByValidation(canvis, validations, 'validated').map((item) => item.n)).toEqual([467]);
  });

  it('retorna només els pendents', () => {
    expect(filterProtocolCanvisByValidation(canvis, validations, 'pending').map((item) => item.n)).toEqual([466]);
  });

  it('posa els pendents primer quan el filtre és all', () => {
    const reversed = [canvis[1]!, canvis[0]!];
    expect(filterProtocolCanvisByValidation(reversed, validations, 'all').map((item) => item.n)).toEqual([466, 467]);
  });
});

describe('summarizeProtocolValidationFilterCounts', () => {
  it('retorna els comptadors de tots, validats i pendents', () => {
    const validations: CanviValidationsMap = new Map([
      [467, { canviN: 467, validatedAt: '2026-05-01T10:00:00.000Z', validatedBy: 'OWNER' }],
    ]);

    expect(summarizeProtocolValidationFilterCounts(canvis, validations)).toEqual({
      all: 2,
      validated: 1,
      pending: 1,
    });
  });
});

describe('findFirstPendingProtocolCanvi', () => {
  it('retorna el primer canvi pendent del subconjunt actual', () => {
    const validations: CanviValidationsMap = new Map([
      [467, { canviN: 467, validatedAt: '2026-05-01T10:00:00.000Z', validatedBy: 'OWNER' }],
    ]);

    expect(findFirstPendingProtocolCanvi(canvis, validations)?.n).toBe(466);
  });

  it('retorna null si tots els canvis estan validats', () => {
    const validations: CanviValidationsMap = new Map([
      [467, { canviN: 467, validatedAt: '2026-05-01T10:00:00.000Z', validatedBy: 'OWNER' }],
      [466, { canviN: 466, validatedAt: '2026-05-01T11:00:00.000Z', validatedBy: 'OWNER' }],
    ]);

    expect(findFirstPendingProtocolCanvi(canvis, validations)).toBeNull();
  });
});

describe('summarizeProtocolValidationProgress', () => {
  it('retorna el progrés del subconjunt actual', () => {
    const validations: CanviValidationsMap = new Map([
      [467, { canviN: 467, validatedAt: '2026-05-01T10:00:00.000Z', validatedBy: 'OWNER' }],
    ]);

    expect(summarizeProtocolValidationProgress(canvis, validations)).toEqual({
      validated: 1,
      total: 2,
      percent: 50,
      label: '1/2 validats',
    });
  });

  it('retorna 0% quan el subconjunt és buit', () => {
    expect(summarizeProtocolValidationProgress([], new Map())).toEqual({
      validated: 0,
      total: 0,
      percent: 0,
      label: '0/0 validats',
    });
  });
});

describe('describeProtocolValidationFilter', () => {
  it('descriu el filtre validated', () => {
    expect(describeProtocolValidationFilter('validated', '', 1)).toEqual({
      label: 'Només validats',
      description: '1 canvi amb validació humana.',
    });
  });

  it('descriu el filtre pending amb cerca activa', () => {
    expect(describeProtocolValidationFilter('pending', 'viewer', 2)).toEqual({
      label: 'Només pendents',
      description: '2 canvis encara pendents de validació humana amb cerca "viewer".',
    });
  });

  it('descriu la cerca activa quan el filtre és all', () => {
    expect(describeProtocolValidationFilter('all', 'claude', 3)).toEqual({
      label: 'Cerca activa',
      description: '3 canvis en coincidència amb cerca "claude".',
    });
  });
});

describe('describeProtocolValidationEmptyState', () => {
  it('descriu el buit per pending sense cerca', () => {
    expect(describeProtocolValidationEmptyState('pending', '')).toEqual({
      title: 'Tot validat',
      description: 'No queden canvis pendents de validació humana en aquesta vista.',
    });
  });

  it('descriu el buit per pending amb cerca', () => {
    expect(describeProtocolValidationEmptyState('pending', 'viewer')).toEqual({
      title: 'Cap pendent amb aquesta cerca',
      description: 'No hi ha canvis pendents de validació humana que coincideixin amb "viewer".',
    });
  });

  it('descriu el buit per validated', () => {
    expect(describeProtocolValidationEmptyState('validated', '')).toEqual({
      title: 'Cap canvi validat',
      description: 'Encara no consta cap validació humana registrada.',
    });
  });

  it('descriu el buit general amb cerca', () => {
    expect(describeProtocolValidationEmptyState('all', 'claude')).toEqual({
      title: 'Cap coincidència',
      description: 'No hi ha canvis que coincideixin amb "claude".',
    });
  });
});

describe('describeProtocolValidationResults', () => {
  it('descriu la vista pending', () => {
    expect(describeProtocolValidationResults('pending', '', 2)).toEqual({
      title: 'Pendents de validació (2)',
      description: "2 canvis pendents de validació humana; els detalls s'obren automàticament.",
    });
  });

  it('descriu la vista validated amb cerca', () => {
    expect(describeProtocolValidationResults('validated', 'claude', 1)).toEqual({
      title: 'Validats humans (1)',
      description: '1 canvi ja validat humanament amb cerca "claude".',
    });
  });

  it('manté el copy base per a la vista general', () => {
    expect(describeProtocolValidationResults('all', '', 2)).toEqual({
      title: 'Tots els canvis',
      description: "Cada bloc està plegat per defecte. Obre el que t'interessi; el #N citat al manual quedarà ressaltat si véns d'allà.",
    });
  });
});

describe('describeProtocolSectionResults', () => {
  it('descriu les seccions amb cerca activa', () => {
    expect(describeProtocolSectionResults('lead', 2)).toEqual({
      title: 'Seccions amb coincidències (2)',
      description: "2 seccions visibles per la cerca; cada link obre la secció completa amb àncora.",
    });
  });

  it('manté el copy base per a totes les seccions', () => {
    expect(describeProtocolSectionResults('', 5)).toEqual({
      title: 'Seccions del protocol §X.Y',
      description: "Índex navegable de totes les seccions del protocol. Cada link obre la secció completa amb àncora; els CTAs PENDING del manual ja apunten aquí.",
    });
  });
});

describe('describeProtocolPendingShortcut', () => {
  it('retorna CTA accionable quan hi ha pendent', () => {
    expect(describeProtocolPendingShortcut(canvis[1]!, 'lead')).toEqual({
      href: '/admin/docs/protocol?validation=pending&canvi=466&q=lead#canvi-466',
      label: 'Obrir primer pendent · #466',
      tone: 'action',
    });
  });

  it('construeix una URL neta quan no hi ha cerca activa', () => {
    expect(describeProtocolPendingShortcut(canvis[1]!, '')).toEqual({
      href: '/admin/docs/protocol?validation=pending&canvi=466#canvi-466',
      label: 'Obrir primer pendent · #466',
      tone: 'action',
    });
  });

  it('retorna estat passiu quan no hi ha pendents', () => {
    expect(describeProtocolPendingShortcut(null, '')).toEqual({
      href: null,
      label: 'Sense pendents',
      tone: 'idle',
    });
  });
});

describe('shouldAutoOpenProtocolCanvi', () => {
  const validations: CanviValidationsMap = new Map([
    [467, { canviN: 467, validatedAt: '2026-05-01T10:00:00.000Z', validatedBy: 'OWNER' }],
  ]);

  it('obre sempre el canvi enfocat', () => {
    expect(shouldAutoOpenProtocolCanvi(467, 467, validations, 'all')).toBe(true);
  });

  it('obre els pendents quan el filtre és pending', () => {
    expect(shouldAutoOpenProtocolCanvi(466, null, validations, 'pending')).toBe(true);
    expect(shouldAutoOpenProtocolCanvi(467, null, validations, 'pending')).toBe(false);
  });

  it('no autoobre fora del filtre pending', () => {
    expect(shouldAutoOpenProtocolCanvi(466, null, validations, 'all')).toBe(false);
    expect(shouldAutoOpenProtocolCanvi(466, null, validations, 'validated')).toBe(false);
  });
});
