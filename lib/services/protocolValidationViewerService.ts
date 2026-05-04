import type { ProtocolCanviMeta } from '@/lib/services/protocolCanvisService';
import type { CanviValidationsMap } from '@/lib/services/protocolValidationsService';

export type ProtocolValidationFilter = 'all' | 'validated' | 'pending';

export interface ProtocolValidationFilterCounts {
  all: number;
  validated: number;
  pending: number;
}

export interface ProtocolValidationFilterMeta {
  label: string;
  description: string;
}

export interface ProtocolValidationEmptyStateMeta {
  title: string;
  description: string;
}

export interface ProtocolValidationProgressMeta {
  validated: number;
  total: number;
  percent: number;
  label: string;
}

export interface ProtocolValidationResultsMeta {
  title: string;
  description: string;
}

export interface ProtocolSectionResultsMeta {
  title: string;
  description: string;
}

export interface ProtocolPendingShortcutMeta {
  href: string | null;
  label: string;
  tone: 'action' | 'idle';
}

export interface ProtocolSectionEmptyStateMeta {
  title: string;
  description: string;
}

function formatCanvisLabel(count: number): string {
  return `${count} canvi${count === 1 ? '' : 's'}`;
}

function formatValidatedSuffix(count: number): string {
  return count === 1 ? 'ja validat humanament' : 'ja validats humanament';
}

function formatSectionsLabel(count: number): string {
  return `${count} secci${count === 1 ? 'ó' : 'ons'}`;
}

export function normalizeProtocolValidationFilter(raw: string | null | undefined): ProtocolValidationFilter {
  if (raw === 'validated' || raw === 'pending') return raw;
  return 'all';
}

export function filterProtocolCanvisByValidation(
  canvis: ProtocolCanviMeta[],
  validations: CanviValidationsMap,
  filter: ProtocolValidationFilter,
): ProtocolCanviMeta[] {
  const filtered = filter === 'all' ? canvis : canvis.filter((canvi) => {
    const isValidated = validations.has(canvi.n);
    return filter === 'validated' ? isValidated : !isValidated;
  });

  if (filter !== 'all') return filtered;

  return [...filtered].sort((left, right) => {
    const leftValidated = validations.has(left.n);
    const rightValidated = validations.has(right.n);
    if (leftValidated === rightValidated) return 0;
    return leftValidated ? 1 : -1;
  });
}

export function summarizeProtocolValidationFilterCounts(
  canvis: ProtocolCanviMeta[],
  validations: CanviValidationsMap,
): ProtocolValidationFilterCounts {
  let validated = 0;
  for (const canvi of canvis) {
    if (validations.has(canvi.n)) validated += 1;
  }
  return {
    all: canvis.length,
    validated,
    pending: Math.max(0, canvis.length - validated),
  };
}

export function summarizeProtocolValidationProgress(
  canvis: ProtocolCanviMeta[],
  validations: CanviValidationsMap,
): ProtocolValidationProgressMeta {
  const counts = summarizeProtocolValidationFilterCounts(canvis, validations);
  const percent = counts.all === 0 ? 0 : Math.round((counts.validated / counts.all) * 100);
  return {
    validated: counts.validated,
    total: counts.all,
    percent,
    label: `${counts.validated}/${counts.all} validats`,
  };
}

export function findFirstPendingProtocolCanvi(
  canvis: ProtocolCanviMeta[],
  validations: CanviValidationsMap,
): ProtocolCanviMeta | null {
  return canvis.find((canvi) => !validations.has(canvi.n)) ?? null;
}

export function describeProtocolValidationFilter(
  filter: ProtocolValidationFilter,
  query: string,
  filteredCount: number,
): ProtocolValidationFilterMeta {
  const querySuffix = query ? ` amb cerca "${query}"` : '';
  const countLabel = formatCanvisLabel(filteredCount);

  if (filter === 'validated') {
    return {
      label: 'Només validats',
      description: `${countLabel} amb validació humana${querySuffix}.`,
    };
  }

  if (filter === 'pending') {
    return {
      label: 'Només pendents',
      description: `${countLabel} encara pendents de validació humana${querySuffix}.`,
    };
  }

  return {
    label: query ? 'Cerca activa' : 'Sense filtre',
    description: query ? `${countLabel} en coincidència${querySuffix}.` : 'Sense filtre — tots visibles.',
  };
}

export function shouldAutoOpenProtocolCanvi(
  canviN: number,
  focusCanviN: number | null,
  validations: CanviValidationsMap,
  filter: ProtocolValidationFilter,
): boolean {
  if (focusCanviN === canviN) return true;
  return filter === 'pending' && !validations.has(canviN);
}

export function describeProtocolValidationEmptyState(
  filter: ProtocolValidationFilter,
  query: string,
): ProtocolValidationEmptyStateMeta {
  if (filter === 'pending') {
    return query
      ? {
          title: 'Cap pendent amb aquesta cerca',
          description: `No hi ha canvis pendents de validació humana que coincideixin amb "${query}".`,
        }
      : {
          title: 'Tot validat',
          description: 'No queden canvis pendents de validació humana en aquesta vista.',
        };
  }

  if (filter === 'validated') {
    return query
      ? {
          title: 'Cap validat amb aquesta cerca',
          description: `No hi ha canvis validats que coincideixin amb "${query}".`,
        }
      : {
          title: 'Cap canvi validat',
          description: 'Encara no consta cap validació humana registrada.',
        };
  }

  return query
    ? {
        title: 'Cap coincidència',
        description: `No hi ha canvis que coincideixin amb "${query}".`,
      }
    : {
        title: 'Cap canvi visible',
        description: 'No hi ha cap canvi visible amb la configuració actual.',
      };
}

export function describeProtocolValidationResults(
  filter: ProtocolValidationFilter,
  query: string,
  filteredCount: number,
): ProtocolValidationResultsMeta {
  const countLabel = formatCanvisLabel(filteredCount);
  const querySuffix = query ? ` amb cerca "${query}"` : '';

  if (filter === 'pending') {
    return {
      title: `Pendents de validació (${filteredCount})`,
      description: `${countLabel} pendents de validació humana${querySuffix}; els detalls s'obren automàticament.`,
    };
  }

  if (filter === 'validated') {
    return {
      title: `Validats humans (${filteredCount})`,
      description: `${countLabel} ${formatValidatedSuffix(filteredCount)}${querySuffix}.`,
    };
  }

  if (query) {
    return {
      title: `Resultats canvis (${filteredCount})`,
      description: `${countLabel} visibles després de la cerca; el #N citat al manual queda ressaltat si véns d'allà.`,
    };
  }

  return {
    title: 'Tots els canvis',
    description: "Cada bloc està plegat per defecte. Obre el que t'interessi; el #N citat al manual quedarà ressaltat si véns d'allà.",
  };
}

export function describeProtocolSectionResults(
  query: string,
  filteredCount: number,
): ProtocolSectionResultsMeta {
  if (query) {
    return {
      title: `Seccions amb coincidències (${filteredCount})`,
      description: `${formatSectionsLabel(filteredCount)} visibles per la cerca; cada link obre la secció completa amb àncora.`,
    };
  }

  return {
    title: 'Seccions del protocol §X.Y',
    description: "Índex navegable de totes les seccions del protocol. Cada link obre la secció completa amb àncora; els CTAs PENDING del manual ja apunten aquí.",
  };
}

export function describeProtocolSectionEmptyState(query: string): ProtocolSectionEmptyStateMeta {
  if (query) {
    return {
      title: 'Cap secció amb aquesta cerca',
      description: `No hi ha cap secció del protocol que coincideixi amb "${query}".`,
    };
  }

  return {
    title: 'Cap secció visible',
    description: 'No hi ha cap secció visible amb la configuració actual.',
  };
}

export function describeProtocolPendingShortcut(
  firstPending: ProtocolCanviMeta | null,
  query: string,
): ProtocolPendingShortcutMeta {
  if (!firstPending) {
    return {
      href: null,
      label: query ? 'Sense pendents en aquesta cerca' : 'Sense pendents',
      tone: 'idle',
    };
  }

  const querySuffix = query ? `&q=${encodeURIComponent(query)}` : '';

  return {
    href: `/admin/docs/protocol?validation=pending&canvi=${firstPending.n}${querySuffix}#canvi-${firstPending.n}`,
    label: `Obrir primer pendent · #${firstPending.n}`,
    tone: 'action',
  };
}
